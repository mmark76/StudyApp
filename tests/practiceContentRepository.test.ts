import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addImportedPracticeFlashcard,
  addImportedPracticeUnit,
  importPracticeFlashcards,
  importPracticeUnits,
  removeImportedPracticeFlashcard,
  removeImportedPracticeUnit,
  renameImportedPracticeUnit,
  updateImportedPracticeFlashcard,
} from "../src/features/content-import/practiceContentRepository";
import {
  getPracticeContentCapacityMessage,
  IMPORTED_FLASHCARDS_SETTING_KEY,
  IMPORTED_UNITS_SETTING_KEY,
  MAX_IMPORTED_FLASHCARDS,
  MAX_IMPORTED_UNITS,
  parseStoredFlashcards,
  parseStoredUnits,
  PracticeContentCapacityError,
  StoredContentValidationError,
} from "../src/features/content-import/importedContent";
import { exportBackup } from "../src/infrastructure/backup/backup";
import { StudyDatabase } from "../src/infrastructure/database/studyDatabase";
import type { Flashcard, StudyUnit } from "../src/shared/types/models";

const practiceUnit: StudyUnit = {
  id: "practice-unit-1",
  number: 50,
  title: "Practice chapter",
  objectives: ["Learn safely"],
  summary: ["One key point"],
  keyTerms: ["practice"],
};

const practiceCard: Flashcard = {
  id: "practice-card-1",
  unitId: practiceUnit.id,
  number: 1,
  question: "What is local-first?",
  answer: "Data stays on the device.",
  tags: ["privacy"],
};

function capacityUnit(number: number): StudyUnit {
  return {
    id: `capacity-unit-${number}`,
    number,
    title: `Chapter ${number}`,
    objectives: [],
    summary: [],
    keyTerms: [],
  };
}

function capacityUnits(count: number, firstNumber = 1): StudyUnit[] {
  return Array.from(
    { length: count },
    (_, index) => capacityUnit(firstNumber + index),
  );
}

function capacityCard(index: number): Flashcard {
  return {
    id: `capacity-card-${index}`,
    unitId: practiceUnit.id,
    number: index + 1,
    question: `Q${index}`,
    answer: `A${index}`,
    tags: [],
  };
}

function capacityCards(count: number, firstIndex = 0): Flashcard[] {
  return Array.from(
    { length: count },
    (_, index) => capacityCard(firstIndex + index),
  );
}

describe("practice content repository", () => {
  let database: StudyDatabase;
  let databaseName: string;

  beforeEach(async () => {
    databaseName = `practice-content-${crypto.randomUUID()}`;
    database = new StudyDatabase(databaseName);
    await database.open();
  });

  afterEach(async () => {
    await database.delete();
  });

  async function storedUnits() {
    const setting = await database.settings.get(IMPORTED_UNITS_SETTING_KEY);
    return parseStoredUnits(setting?.value);
  }

  async function storedCards() {
    const setting = await database.settings.get(IMPORTED_FLASHCARDS_SETTING_KEY);
    return parseStoredFlashcards(setting?.value);
  }

  async function expectBackupExportable(): Promise<void> {
    await expect(exportBackup(database)).resolves.toMatchObject({
      schemaVersion: 1,
    });
  }

  it.each([
    [
      "en",
      "chapters",
      MAX_IMPORTED_UNITS,
      "Not saved. The maximum total of 10,000 practice chapters has been reached. Existing content is unchanged.",
    ],
    [
      "el",
      "chapters",
      MAX_IMPORTED_UNITS,
      "Δεν αποθηκεύτηκε. Συμπληρώθηκε το μέγιστο σύνολο των 10.000 κεφαλαίων εξάσκησης. Το υπάρχον περιεχόμενο δεν άλλαξε.",
    ],
    [
      "en",
      "flashcards",
      MAX_IMPORTED_FLASHCARDS,
      "Not saved. The maximum total of 100,000 flashcards has been reached. Existing content is unchanged.",
    ],
    [
      "el",
      "flashcards",
      MAX_IMPORTED_FLASHCARDS,
      "Δεν αποθηκεύτηκε. Συμπληρώθηκε το μέγιστο σύνολο των 100.000 flashcards. Το υπάρχον περιεχόμενο δεν άλλαξε.",
    ],
  ] as const)(
    "provides a safe %s capacity message for %s",
    (language, collection, maximum, expected) => {
      const error = new PracticeContentCapacityError(collection, maximum);

      expect(error.code).toBe("practice-content-capacity-exceeded");
      expect(getPracticeContentCapacityMessage(error, language)).toBe(expected);
    },
  );

  it("adds, renames, and edits practice content with stable IDs", async () => {
    await addImportedPracticeUnit(practiceUnit, database);
    await addImportedPracticeFlashcard(practiceCard, database);
    await renameImportedPracticeUnit(practiceUnit.id, "Renamed chapter", database);
    await updateImportedPracticeFlashcard(
      { ...practiceCard, question: "Updated question?", answer: "Updated answer." },
      database,
    );

    await expect(storedUnits()).resolves.toEqual([
      { ...practiceUnit, title: "Renamed chapter" },
    ]);
    await expect(storedCards()).resolves.toEqual([
      { ...practiceCard, question: "Updated question?", answer: "Updated answer." },
    ]);
  });

  it("merges compatible CSV imports without replacing unrelated content", async () => {
    await addImportedPracticeUnit(practiceUnit, database);
    await addImportedPracticeFlashcard(practiceCard, database);
    const secondUnit = { ...practiceUnit, id: "practice-unit-2", number: 51, title: "CSV chapter" };
    const secondCard = { ...practiceCard, id: "practice-card-2", unitId: secondUnit.id, question: "CSV question?" };

    await importPracticeUnits([secondUnit], database);
    await importPracticeFlashcards([secondCard], database);

    await expect(storedUnits()).resolves.toEqual([practiceUnit, secondUnit]);
    await expect(storedCards()).resolves.toEqual([practiceCard, secondCard]);
  });

  it("updates same-number CSV metadata while preserving relationships transactionally", async () => {
    await addImportedPracticeUnit(practiceUnit, database);
    await addImportedPracticeFlashcard(practiceCard, database);
    const progress = {
      cardId: practiceCard.id,
      score: 2 as const,
      repetitions: 3,
      intervalDays: 7,
      nextReviewAt: "2026-08-27T00:00:00.000Z",
      lastReviewedAt: "2026-08-20T00:00:00.000Z",
      lapses: 0,
    };
    await database.cardProgress.put(progress);

    await importPracticeUnits([{
      ...practiceUnit,
      id: "csv-generated-replacement-id",
      title: "CSV replacement title",
      objectives: ["CSV replacement goal"],
      summary: ["CSV replacement point"],
      keyTerms: ["csv-term"],
    }], database);

    await expect(storedUnits()).resolves.toEqual([{
      ...practiceUnit,
      title: "CSV replacement title",
      objectives: ["CSV replacement goal"],
      summary: ["CSV replacement point"],
      keyTerms: ["csv-term"],
    }]);
    await expect(storedCards()).resolves.toEqual([practiceCard]);
    await expect(database.cardProgress.get(practiceCard.id)).resolves.toEqual(progress);
  });

  it("accepts the exact chapter limit and rejects one more without changing it", async () => {
    const relatedCard = {
      ...practiceCard,
      unitId: capacityUnit(1).id,
    };
    await database.settings.bulkPut([
      {
        key: IMPORTED_UNITS_SETTING_KEY,
        value: capacityUnits(MAX_IMPORTED_UNITS - 1),
      },
      { key: IMPORTED_FLASHCARDS_SETTING_KEY, value: [relatedCard] },
      {
        key: "appearance-settings",
        value: {
          colorScheme: "blue",
          backgroundTone: "sky",
          fontChoice: "system",
          textSize: "comfortable",
          uiDensity: "comfortable",
        },
      },
    ]);
    await database.cardProgress.add({
      cardId: relatedCard.id,
      score: 2,
      repetitions: 1,
      intervalDays: 1,
      nextReviewAt: "2026-08-17T00:00:00.000Z",
      lastReviewedAt: "2026-08-16T00:00:00.000Z",
      lapses: 0,
    });
    await database.studySessions.add({
      id: "capacity-session",
      mode: "flashcards",
      startedAt: "2026-08-16T00:00:00.000Z",
      reviewedCards: 1,
      correctAnswers: 1,
    });
    await database.studyOperations.add({
      id: "capacity-operation",
      kind: "card-rating",
      mode: "flashcards",
      sessionId: "capacity-session",
      cardId: relatedCard.id,
      rating: 2,
      committedAt: "2026-08-16T00:01:00.000Z",
      completesSession: false,
    });

    await addImportedPracticeUnit(capacityUnit(MAX_IMPORTED_UNITS), database);
    await expect(storedUnits()).resolves.toHaveLength(MAX_IMPORTED_UNITS);
    const beforeRejection = await database.settings.get(IMPORTED_UNITS_SETTING_KEY);
    const beforeAppearance = await database.settings.get("appearance-settings");
    const beforeProgress = await database.cardProgress.toArray();
    const beforeSessions = await database.studySessions.toArray();
    const beforeOperations = await database.studyOperations.toArray();

    await expect(
      addImportedPracticeUnit(capacityUnit(MAX_IMPORTED_UNITS + 1), database),
    ).rejects.toMatchObject({
      code: "practice-content-capacity-exceeded",
      collection: "chapters",
      maximum: MAX_IMPORTED_UNITS,
    });

    await expect(database.settings.get(IMPORTED_UNITS_SETTING_KEY))
      .resolves.toEqual(beforeRejection);
    await expect(database.settings.get("appearance-settings"))
      .resolves.toEqual(beforeAppearance);
    await expect(database.cardProgress.toArray()).resolves.toEqual(beforeProgress);
    await expect(database.studySessions.toArray()).resolves.toEqual(beforeSessions);
    await expect(database.studyOperations.toArray()).resolves.toEqual(beforeOperations);
    await expect(storedUnits()).resolves.toHaveLength(MAX_IMPORTED_UNITS);
    await expectBackupExportable();
  });

  it("rejects cumulative chapter imports over the limit", async () => {
    await database.settings.put({
      key: IMPORTED_UNITS_SETTING_KEY,
      value: capacityUnits(6_000),
    });
    const beforeRejection = await database.settings.get(IMPORTED_UNITS_SETTING_KEY);

    await expect(
      importPracticeUnits(capacityUnits(6_000, 6_001), database),
    ).rejects.toBeInstanceOf(PracticeContentCapacityError);

    await expect(database.settings.get(IMPORTED_UNITS_SETTING_KEY))
      .resolves.toEqual(beforeRejection);
    await expect(storedUnits()).resolves.toHaveLength(6_000);
    await expectBackupExportable();
  });

  it("serializes concurrent chapter additions at the limit", async () => {
    await database.settings.put({
      key: IMPORTED_UNITS_SETTING_KEY,
      value: capacityUnits(MAX_IMPORTED_UNITS - 1),
    });
    const peerDatabase = new StudyDatabase(databaseName);
    await peerDatabase.open();

    try {
      const results = await Promise.allSettled([
        addImportedPracticeUnit(capacityUnit(MAX_IMPORTED_UNITS), database),
        addImportedPracticeUnit(capacityUnit(MAX_IMPORTED_UNITS + 1), peerDatabase),
      ]);

      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
      expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
      expect(results.find((result) => result.status === "rejected"))
        .toMatchObject({ reason: { code: "practice-content-capacity-exceeded" } });
      await expect(storedUnits()).resolves.toHaveLength(MAX_IMPORTED_UNITS);
      await expectBackupExportable();
    } finally {
      peerDatabase.close();
    }
  });

  it("accepts the exact flashcard limit and rejects one more without changing it", async () => {
    await database.settings.bulkPut([
      { key: IMPORTED_UNITS_SETTING_KEY, value: [practiceUnit] },
      {
        key: IMPORTED_FLASHCARDS_SETTING_KEY,
        value: capacityCards(MAX_IMPORTED_FLASHCARDS - 1),
      },
    ]);

    await addImportedPracticeFlashcard(
      capacityCard(MAX_IMPORTED_FLASHCARDS - 1),
      database,
    );
    await expect(storedCards()).resolves.toHaveLength(MAX_IMPORTED_FLASHCARDS);
    const beforeRejection = await database.settings.get(
      IMPORTED_FLASHCARDS_SETTING_KEY,
    );

    await expect(addImportedPracticeFlashcard(
      capacityCard(MAX_IMPORTED_FLASHCARDS),
      database,
    )).rejects.toMatchObject({
      code: "practice-content-capacity-exceeded",
      collection: "flashcards",
      maximum: MAX_IMPORTED_FLASHCARDS,
    });

    await expect(database.settings.get(IMPORTED_FLASHCARDS_SETTING_KEY))
      .resolves.toEqual(beforeRejection);
    await expect(storedCards()).resolves.toHaveLength(MAX_IMPORTED_FLASHCARDS);
    await expectBackupExportable();
  });

  it("rejects cumulative flashcard imports over the limit", async () => {
    await database.settings.bulkPut([
      { key: IMPORTED_UNITS_SETTING_KEY, value: [practiceUnit] },
      {
        key: IMPORTED_FLASHCARDS_SETTING_KEY,
        value: capacityCards(60_000),
      },
    ]);
    const beforeRejection = await database.settings.get(
      IMPORTED_FLASHCARDS_SETTING_KEY,
    );

    await expect(
      importPracticeFlashcards(capacityCards(60_000, 60_000), database),
    ).rejects.toBeInstanceOf(PracticeContentCapacityError);

    await expect(database.settings.get(IMPORTED_FLASHCARDS_SETTING_KEY))
      .resolves.toEqual(beforeRejection);
    await expect(storedCards()).resolves.toHaveLength(60_000);
    await expectBackupExportable();
  });

  it("serializes concurrent flashcard additions at the limit", async () => {
    await database.settings.bulkPut([
      { key: IMPORTED_UNITS_SETTING_KEY, value: [practiceUnit] },
      {
        key: IMPORTED_FLASHCARDS_SETTING_KEY,
        value: capacityCards(MAX_IMPORTED_FLASHCARDS - 1),
      },
    ]);
    const peerDatabase = new StudyDatabase(databaseName);
    await peerDatabase.open();

    try {
      const results = await Promise.allSettled([
        addImportedPracticeFlashcard(
          capacityCard(MAX_IMPORTED_FLASHCARDS - 1),
          database,
        ),
        addImportedPracticeFlashcard(
          capacityCard(MAX_IMPORTED_FLASHCARDS),
          peerDatabase,
        ),
      ]);

      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
      expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
      expect(results.find((result) => result.status === "rejected"))
        .toMatchObject({ reason: { code: "practice-content-capacity-exceeded" } });
      await expect(storedCards()).resolves.toHaveLength(MAX_IMPORTED_FLASHCARDS);
      await expectBackupExportable();
    } finally {
      peerDatabase.close();
    }
  });

  it("removes a flashcard and its progress and operation records", async () => {
    await addImportedPracticeUnit(practiceUnit, database);
    await addImportedPracticeFlashcard(practiceCard, database);
    await database.cardProgress.add({
      cardId: practiceCard.id,
      score: 2,
      repetitions: 1,
      intervalDays: 1,
      nextReviewAt: "2026-08-15T00:00:00.000Z",
      lastReviewedAt: "2026-08-14T00:00:00.000Z",
      lapses: 0,
    });
    await database.studyOperations.add({
      id: "operation-1",
      kind: "card-rating",
      mode: "flashcards",
      sessionId: "session-1",
      cardId: practiceCard.id,
      rating: 2,
      committedAt: "2026-08-14T00:00:00.000Z",
      completesSession: false,
    });

    await removeImportedPracticeFlashcard(practiceCard.id, database);

    await expect(storedCards()).resolves.toEqual([]);
    await expect(database.cardProgress.get(practiceCard.id)).resolves.toBeUndefined();
    await expect(database.studyOperations.count()).resolves.toBe(0);
  });

  it("removes a practice chapter, connected cards, progress, and operations together", async () => {
    await addImportedPracticeUnit(practiceUnit, database);
    await addImportedPracticeFlashcard(practiceCard, database);
    await database.cardProgress.add({
      cardId: practiceCard.id,
      score: 1,
      repetitions: 2,
      intervalDays: 3,
      nextReviewAt: "2026-08-17T00:00:00.000Z",
      lastReviewedAt: "2026-08-14T00:00:00.000Z",
      lapses: 0,
    });
    await database.studyOperations.add({
      id: "operation-2",
      kind: "card-rating",
      mode: "review",
      sessionId: "session-2",
      cardId: practiceCard.id,
      rating: 1,
      committedAt: "2026-08-14T00:00:00.000Z",
      completesSession: false,
    });

    await expect(removeImportedPracticeUnit(practiceUnit.id, database)).resolves.toBe(1);

    await expect(storedUnits()).resolves.toEqual([]);
    await expect(storedCards()).resolves.toEqual([]);
    await expect(database.cardProgress.count()).resolves.toBe(0);
    await expect(database.studyOperations.count()).resolves.toBe(0);
  });

  it("rejects writes over corrupt stored content without overwriting it", async () => {
    const corruptValue = [{ id: "broken-unit" }];
    await database.settings.put({
      key: IMPORTED_UNITS_SETTING_KEY,
      value: corruptValue,
    });

    await expect(addImportedPracticeUnit(practiceUnit, database)).rejects.toThrow(
      "Saved practice chapters are invalid",
    );
    await expect(database.settings.get(IMPORTED_UNITS_SETTING_KEY)).resolves.toEqual({
      key: IMPORTED_UNITS_SETTING_KEY,
      value: corruptValue,
    });
  });

  it("preserves corrupt stored flashcards instead of treating them as empty", async () => {
    const corruptValue = [{ id: "broken-card" }];
    await database.settings.bulkPut([
      { key: IMPORTED_UNITS_SETTING_KEY, value: [practiceUnit] },
      { key: IMPORTED_FLASHCARDS_SETTING_KEY, value: corruptValue },
    ]);

    await expect(addImportedPracticeFlashcard(practiceCard, database))
      .rejects.toBeInstanceOf(StoredContentValidationError);
    await expect(database.settings.get(IMPORTED_FLASHCARDS_SETTING_KEY)).resolves.toEqual({
      key: IMPORTED_FLASHCARDS_SETTING_KEY,
      value: corruptValue,
    });
  });
});
