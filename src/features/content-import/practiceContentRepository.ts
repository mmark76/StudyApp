import { units as builtInUnits } from "../../data/units";
import {
  studyDatabase,
  type StudyDatabase,
} from "../../infrastructure/database/studyDatabase";
import type { Flashcard, StudyUnit } from "../../shared/types/models";
import { mergeImportedFlashcards } from "./flashcardIdentity";
import {
  IMPORTED_FLASHCARDS_SETTING_KEY,
  IMPORTED_UNITS_SETTING_KEY,
  parseImportedFlashcards,
  parseImportedUnits,
  parseStoredFlashcards,
  parseStoredUnits,
} from "./importedContent";

async function readImportedUnits(database: StudyDatabase): Promise<StudyUnit[]> {
  const setting = await database.settings.get(IMPORTED_UNITS_SETTING_KEY);
  return parseStoredUnits(setting?.value);
}

async function readImportedFlashcards(
  database: StudyDatabase,
): Promise<Flashcard[]> {
  const setting = await database.settings.get(IMPORTED_FLASHCARDS_SETTING_KEY);
  return parseStoredFlashcards(setting?.value);
}

async function removeCardRecords(
  database: StudyDatabase,
  cardIds: readonly string[],
): Promise<void> {
  if (cardIds.length === 0) return;
  await database.cardProgress.bulkDelete([...cardIds]);
  await database.studyOperations.where("cardId").anyOf([...cardIds]).delete();
}

export async function addImportedPracticeUnit(
  unit: StudyUnit,
  database: StudyDatabase = studyDatabase,
): Promise<void> {
  const [validatedUnit] = parseImportedUnits([unit]);
  await database.transaction("rw", database.settings, async () => {
    const currentUnits = await readImportedUnits(database);
    if (
      currentUnits.some(
        (current) => current.id === validatedUnit.id || current.number === validatedUnit.number,
      )
    ) {
      throw new Error("Practice chapter already exists");
    }
    const nextUnits = parseImportedUnits([...currentUnits, validatedUnit]);
    await database.settings.put({
      key: IMPORTED_UNITS_SETTING_KEY,
      value: nextUnits,
    });
  });
}

export async function addImportedPracticeFlashcard(
  card: Flashcard,
  database: StudyDatabase = studyDatabase,
): Promise<void> {
  const [validatedCard] = parseImportedFlashcards([card]);
  await database.transaction("rw", database.settings, async () => {
    const [currentUnits, currentCards] = await Promise.all([
      readImportedUnits(database),
      readImportedFlashcards(database),
    ]);
    const knownUnitIds = new Set([
      ...builtInUnits.map((unit) => unit.id),
      ...currentUnits.map((unit) => unit.id),
    ]);
    if (!knownUnitIds.has(validatedCard.unitId)) {
      throw new Error("Practice chapter does not exist");
    }
    if (currentCards.some((current) => current.id === validatedCard.id)) {
      throw new Error("Flashcard already exists");
    }
    const nextCards = parseImportedFlashcards([...currentCards, validatedCard]);
    await database.settings.put({
      key: IMPORTED_FLASHCARDS_SETTING_KEY,
      value: nextCards,
    });
  });
}

export async function importPracticeUnits(
  units: readonly StudyUnit[],
  database: StudyDatabase = studyDatabase,
): Promise<void> {
  const validatedUnits = parseImportedUnits([...units]);
  await database.transaction("rw", database.settings, async () => {
    const currentUnits = await readImportedUnits(database);
    const byNumber = new Map<number, StudyUnit>(
      currentUnits.map((unit) => [unit.number, unit] as const),
    );
    for (const unit of validatedUnits) {
      const existing = byNumber.get(unit.number);
      byNumber.set(unit.number, existing ? { ...unit, id: existing.id } : unit);
    }
    const nextUnits = parseImportedUnits(
      [...byNumber.values()].sort(
        (first, second) => first.number - second.number,
      ),
    );
    await database.settings.put({
      key: IMPORTED_UNITS_SETTING_KEY,
      value: nextUnits,
    });
  });
}

export async function importPracticeFlashcards(
  flashcards: readonly Flashcard[],
  database: StudyDatabase = studyDatabase,
): Promise<void> {
  const validatedFlashcards = parseImportedFlashcards([...flashcards]);
  await database.transaction("rw", database.settings, async () => {
    const [currentUnits, currentCards] = await Promise.all([
      readImportedUnits(database),
      readImportedFlashcards(database),
    ]);
    const knownUnitIds = new Set([
      ...builtInUnits.map((unit) => unit.id),
      ...currentUnits.map((unit) => unit.id),
    ]);
    if (validatedFlashcards.some((card) => !knownUnitIds.has(card.unitId))) {
      throw new Error("A flashcard refers to a practice chapter that does not exist");
    }
    const nextCards = parseImportedFlashcards(
      mergeImportedFlashcards(currentCards, validatedFlashcards),
    );
    await database.settings.put({
      key: IMPORTED_FLASHCARDS_SETTING_KEY,
      value: nextCards,
    });
  });
}

export async function renameImportedPracticeUnit(
  unitId: string,
  title: string,
  database: StudyDatabase = studyDatabase,
): Promise<void> {
  const normalizedTitle = title.trim();
  if (!normalizedTitle) throw new Error("Practice chapter title is required");

  await database.transaction("rw", database.settings, async () => {
    const currentUnits = await readImportedUnits(database);
    if (!currentUnits.some((unit) => unit.id === unitId)) {
      throw new Error("Practice chapter was not found");
    }
    const nextUnits = parseImportedUnits(currentUnits.map((unit) =>
      unit.id === unitId ? { ...unit, title: normalizedTitle } : unit,
    ));
    await database.settings.put({
      key: IMPORTED_UNITS_SETTING_KEY,
      value: nextUnits,
    });
  });
}

export async function removeImportedPracticeUnit(
  unitId: string,
  database: StudyDatabase = studyDatabase,
): Promise<number> {
  return database.transaction(
    "rw",
    database.settings,
    database.cardProgress,
    database.studyOperations,
    async () => {
      const [currentUnits, currentCards] = await Promise.all([
        readImportedUnits(database),
        readImportedFlashcards(database),
      ]);
      if (!currentUnits.some((unit) => unit.id === unitId)) {
        throw new Error("Practice chapter was not found");
      }

      const affectedCardIds = currentCards
        .filter((card) => card.unitId === unitId)
        .map((card) => card.id);
      const nextUnits = parseImportedUnits(
        currentUnits.filter((unit) => unit.id !== unitId),
      );
      const nextCards = parseImportedFlashcards(
        currentCards.filter((card) => card.unitId !== unitId),
      );
      await database.settings.put({
        key: IMPORTED_UNITS_SETTING_KEY,
        value: nextUnits,
      });
      await database.settings.put({
        key: IMPORTED_FLASHCARDS_SETTING_KEY,
        value: nextCards,
      });
      await removeCardRecords(database, affectedCardIds);
      return affectedCardIds.length;
    },
  );
}

export async function updateImportedPracticeFlashcard(
  updatedCard: Flashcard,
  database: StudyDatabase = studyDatabase,
): Promise<void> {
  const [validatedCard] = parseImportedFlashcards([updatedCard]);
  await database.transaction("rw", database.settings, async () => {
    const [currentUnits, currentCards] = await Promise.all([
      readImportedUnits(database),
      readImportedFlashcards(database),
    ]);
    const knownUnitIds = new Set([
      ...builtInUnits.map((unit) => unit.id),
      ...currentUnits.map((unit) => unit.id),
    ]);
    if (!knownUnitIds.has(validatedCard.unitId)) {
      throw new Error("Practice chapter does not exist");
    }
    if (!currentCards.some((card) => card.id === validatedCard.id)) {
      throw new Error("Flashcard was not found");
    }
    const nextCards = parseImportedFlashcards(currentCards.map((card) =>
      card.id === validatedCard.id ? validatedCard : card,
    ));
    await database.settings.put({
      key: IMPORTED_FLASHCARDS_SETTING_KEY,
      value: nextCards,
    });
  });
}

export async function removeImportedPracticeFlashcard(
  cardId: string,
  database: StudyDatabase = studyDatabase,
): Promise<void> {
  await database.transaction(
    "rw",
    database.settings,
    database.cardProgress,
    database.studyOperations,
    async () => {
      const currentCards = await readImportedFlashcards(database);
      if (!currentCards.some((card) => card.id === cardId)) {
        throw new Error("Flashcard was not found");
      }
      const nextCards = parseImportedFlashcards(
        currentCards.filter((card) => card.id !== cardId),
      );
      await database.settings.put({
        key: IMPORTED_FLASHCARDS_SETTING_KEY,
        value: nextCards,
      });
      await removeCardRecords(database, [cardId]);
    },
  );
}
