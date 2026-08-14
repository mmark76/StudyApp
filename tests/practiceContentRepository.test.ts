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
  IMPORTED_FLASHCARDS_SETTING_KEY,
  IMPORTED_UNITS_SETTING_KEY,
  parseStoredFlashcards,
  parseStoredUnits,
} from "../src/features/content-import/importedContent";
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

describe("practice content repository", () => {
  let database: StudyDatabase;

  beforeEach(async () => {
    database = new StudyDatabase(`practice-content-${crypto.randomUUID()}`);
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
});
