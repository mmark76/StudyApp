import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { flashcards as builtInFlashcards } from "../src/data/flashcards";
import {
  IMPORTED_FLASHCARDS_SETTING_KEY,
  IMPORTED_UNITS_SETTING_KEY,
  StoredContentValidationError,
} from "../src/features/content-import/importedContent";
import {
  removeImportedPracticeFlashcard,
} from "../src/features/content-import/practiceContentRepository";
import { exportBackup } from "../src/infrastructure/backup/backup";
import { StudyDatabase } from "../src/infrastructure/database/studyDatabase";
import {
  commitCardRatingOperation,
  commitQuizCompletionOperation,
  StudyCardUnavailableError,
  StudyOperationConflictError,
  type CardRatingOperationInput,
  type StudyOperationFailureInjector,
  type StudyOperationWriteStage,
} from "../src/features/learn/studyOperationService";
import type {
  CardProgress,
  Flashcard,
  StudyUnit,
} from "../src/shared/types/models";

const startedAt = "2026-07-30T10:00:00.000Z";
const committedAt = "2026-07-30T10:05:00.000Z";
const originalBuiltInFlashcards = [...builtInFlashcards];

const importedUnit: StudyUnit = {
  id: "unit-1",
  number: 1,
  title: "Imported unit",
  objectives: [],
  summary: [],
  keyTerms: [],
};

const importedCards: Flashcard[] = [
  {
    id: "card-1",
    unitId: importedUnit.id,
    number: 1,
    question: "Question one?",
    answer: "Answer one.",
    tags: [],
  },
  {
    id: "card-2",
    unitId: importedUnit.id,
    number: 2,
    question: "Question two?",
    answer: "Answer two.",
    tags: [],
  },
];

function existingProgress(): CardProgress {
  return {
    cardId: "card-1",
    score: 1,
    repetitions: 2,
    intervalDays: 3,
    nextReviewAt: "2026-08-02T10:00:00.000Z",
    lastReviewedAt: "2026-07-27T10:00:00.000Z",
    lapses: 0,
  };
}

function cardOperation(
  overrides: Partial<CardRatingOperationInput> = {},
): CardRatingOperationInput {
  return {
    operationId: "operation-1",
    sessionId: "session-1",
    mode: "flashcards",
    cardId: "card-1",
    rating: 2,
    startedAt,
    committedAt,
    reviewedCards: 1,
    correctAnswers: 0,
    completesSession: false,
    ...overrides,
  };
}

function failAt(stage: StudyOperationWriteStage): StudyOperationFailureInjector {
  return {
    beforeWrite(currentStage) {
      if (currentStage === stage) {
        throw new Error(`Injected ${stage} failure`);
      }
    },
  };
}

describe("transactional and idempotent study operations", () => {
  let database: StudyDatabase;
  let peerDatabase: StudyDatabase;

  beforeEach(async () => {
    const databaseName = `study-operation-${crypto.randomUUID()}`;
    database = new StudyDatabase(databaseName);
    peerDatabase = new StudyDatabase(databaseName);
    await Promise.all([database.open(), peerDatabase.open()]);
    await database.settings.bulkPut([
      {
        key: IMPORTED_UNITS_SETTING_KEY,
        value: [importedUnit],
      },
      {
        key: IMPORTED_FLASHCARDS_SETTING_KEY,
        value: importedCards,
      },
    ]);
  });

  afterEach(async () => {
    peerDatabase.close();
    builtInFlashcards.splice(
      0,
      builtInFlashcards.length,
      ...originalBuiltInFlashcards,
    );
    await database.delete();
  });

  it("commits a valid imported card rating", async () => {
    const result = await commitCardRatingOperation(cardOperation(), database);

    expect(result.alreadyCommitted).toBe(false);
    await expect(database.cardProgress.get("card-1")).resolves.toMatchObject({
      cardId: "card-1",
      score: 2,
      repetitions: 1,
    });
    await expect(database.studySessions.count()).resolves.toBe(1);
    await expect(database.studyOperations.count()).resolves.toBe(1);
  });

  it("commits a valid built-in card rating", async () => {
    const builtInCard: Flashcard = {
      id: "built-in-card",
      unitId: "built-in-unit",
      number: 1,
      question: "Built-in question?",
      answer: "Built-in answer.",
      tags: [],
    };
    builtInFlashcards.push(builtInCard);
    await database.settings.put({
      key: IMPORTED_FLASHCARDS_SETTING_KEY,
      value: [{ id: "broken-imported-card" }],
    });

    await expect(
      commitCardRatingOperation(
        cardOperation({ cardId: builtInCard.id }),
        database,
      ),
    ).resolves.toMatchObject({ alreadyCommitted: false });
    await expect(database.cardProgress.get(builtInCard.id)).resolves.toMatchObject(
      { cardId: builtInCard.id, score: 2 },
    );
  });

  it("rejects a card deleted through another database connection", async () => {
    const staleOperation = cardOperation();
    await removeImportedPracticeFlashcard("card-1", peerDatabase);

    await expect(
      commitCardRatingOperation(staleOperation, database),
    ).rejects.toBeInstanceOf(StudyCardUnavailableError);

    await expect(database.cardProgress.count()).resolves.toBe(0);
    await expect(database.studySessions.count()).resolves.toBe(0);
    await expect(database.studyOperations.count()).resolves.toBe(0);
    await expect(exportBackup(database)).resolves.toMatchObject({
      cardProgress: [],
      studySessions: [],
    });
  });

  it("rejects malformed authoritative card settings without partial writes", async () => {
    await database.settings.put({
      key: IMPORTED_FLASHCARDS_SETTING_KEY,
      value: [{ id: "broken-card" }],
    });

    await expect(
      commitCardRatingOperation(cardOperation(), database),
    ).rejects.toBeInstanceOf(StoredContentValidationError);

    await expect(database.cardProgress.count()).resolves.toBe(0);
    await expect(database.studySessions.count()).resolves.toBe(0);
    await expect(database.studyOperations.count()).resolves.toBe(0);
  });

  it("rolls back when the progress write fails", async () => {
    const before = existingProgress();
    await database.cardProgress.add(before);

    await expect(
      commitCardRatingOperation(
        cardOperation(),
        database,
        failAt("progress"),
      ),
    ).rejects.toThrow("Injected progress failure");

    await expect(database.cardProgress.toArray()).resolves.toEqual([before]);
    await expect(database.studySessions.count()).resolves.toBe(0);
    await expect(database.studyOperations.count()).resolves.toBe(0);
  });

  it("rolls back progress when the final session write fails", async () => {
    const before = existingProgress();
    await database.cardProgress.add(before);

    await expect(
      commitCardRatingOperation(
        cardOperation({
          completesSession: true,
        }),
        database,
        failAt("session"),
      ),
    ).rejects.toThrow("Injected session failure");

    await expect(database.cardProgress.toArray()).resolves.toEqual([before]);
    await expect(database.studySessions.count()).resolves.toBe(0);
    await expect(database.studyOperations.count()).resolves.toBe(0);
  });

  it("preserves the last committed active session when a later final card fails", async () => {
    await commitCardRatingOperation(cardOperation(), database);
    const committedSession = await database.studySessions.get("session-1");

    await expect(
      commitCardRatingOperation(
        cardOperation({
          operationId: "operation-2",
          cardId: "card-2",
          reviewedCards: 2,
          completesSession: true,
        }),
        database,
        failAt("session"),
      ),
    ).rejects.toThrow("Injected session failure");

    await expect(database.cardProgress.get("card-2")).resolves.toBeUndefined();
    await expect(database.studySessions.get("session-1")).resolves.toEqual(
      committedSession,
    );
    await expect(database.studyOperations.count()).resolves.toBe(1);
  });

  it("rolls back progress and session when the final operation write fails", async () => {
    const before = existingProgress();
    await database.cardProgress.add(before);

    await expect(
      commitCardRatingOperation(
        cardOperation({
          completesSession: true,
        }),
        database,
        failAt("operation"),
      ),
    ).rejects.toThrow("Injected operation failure");

    await expect(database.cardProgress.toArray()).resolves.toEqual([before]);
    await expect(database.studySessions.count()).resolves.toBe(0);
    await expect(database.studyOperations.count()).resolves.toBe(0);
  });

  it("rolls back a failed final quiz persistence", async () => {
    await expect(
      commitQuizCompletionOperation(
        {
          operationId: "quiz-operation",
          sessionId: "quiz-session",
          startedAt,
          committedAt,
          reviewedCards: 4,
          correctAnswers: 3,
        },
        database,
        failAt("operation"),
      ),
    ).rejects.toThrow("Injected operation failure");

    await expect(database.studySessions.count()).resolves.toBe(0);
    await expect(database.studyOperations.count()).resolves.toBe(0);
  });

  it("rolls back a failed review completion", async () => {
    const before = existingProgress();
    await database.cardProgress.add(before);

    await expect(
      commitCardRatingOperation(
        cardOperation({
          mode: "review",
          completesSession: true,
        }),
        database,
        failAt("session"),
      ),
    ).rejects.toThrow("Injected session failure");

    await expect(database.cardProgress.toArray()).resolves.toEqual([before]);
    await expect(database.studySessions.count()).resolves.toBe(0);
    await expect(database.studyOperations.count()).resolves.toBe(0);
  });

  it("applies scheduling once for two calls with the same operation ID", async () => {
    await database.cardProgress.add(existingProgress());
    const operation = cardOperation();

    const first = await commitCardRatingOperation(operation, database);
    const retry = await commitCardRatingOperation(operation, database);

    expect(first.alreadyCommitted).toBe(false);
    expect(retry.alreadyCommitted).toBe(true);
    await expect(database.studyOperations.count()).resolves.toBe(1);
    await expect(database.studySessions.count()).resolves.toBe(1);
    await expect(database.cardProgress.get("card-1")).resolves.toMatchObject({
      repetitions: 3,
      score: 2,
    });
  });

  it("safely retries an ambiguous final card result without a second session", async () => {
    await database.cardProgress.add(existingProgress());
    const operation = cardOperation({
      completesSession: true,
    });

    await commitCardRatingOperation(operation, database);
    const retry = await commitCardRatingOperation(operation, database);

    expect(retry.alreadyCommitted).toBe(true);
    await expect(database.studySessions.count()).resolves.toBe(1);
    await expect(database.studyOperations.count()).resolves.toBe(1);
    await expect(database.cardProgress.get("card-1")).resolves.toMatchObject({
      repetitions: 3,
    });
  });

  it("retries the final quiz result once and preserves valid counters", async () => {
    const operation = {
      operationId: "quiz-operation",
      sessionId: "quiz-session",
      startedAt,
      committedAt,
      reviewedCards: 4,
      correctAnswers: 4,
    };

    const first = await commitQuizCompletionOperation(operation, database);
    const retry = await commitQuizCompletionOperation(operation, database);

    expect(first.alreadyCommitted).toBe(false);
    expect(retry.alreadyCommitted).toBe(true);
    expect(retry.session?.correctAnswers).toBeLessThanOrEqual(
      retry.session?.reviewedCards ?? -1,
    );
    await expect(database.studySessions.count()).resolves.toBe(1);
    await expect(database.studyOperations.count()).resolves.toBe(1);
  });

  it("rejects invalid quiz totals before writing anything", async () => {
    await expect(
      commitQuizCompletionOperation(
        {
          operationId: "quiz-operation",
          sessionId: "quiz-session",
          startedAt,
          committedAt,
          reviewedCards: 4,
          correctAnswers: 5,
        },
        database,
      ),
    ).rejects.toThrow("totals are invalid");

    await expect(database.studySessions.count()).resolves.toBe(0);
    await expect(database.studyOperations.count()).resolves.toBe(0);
  });

  it("rejects reuse of an operation ID for different data", async () => {
    await commitCardRatingOperation(cardOperation(), database);

    await expect(
      commitCardRatingOperation(
        cardOperation({ rating: 0 }),
        database,
      ),
    ).rejects.toBeInstanceOf(StudyOperationConflictError);
    await expect(database.studyOperations.count()).resolves.toBe(1);
  });

  it("does not reopen a completed card session", async () => {
    await commitCardRatingOperation(
      cardOperation({ completesSession: true }),
      database,
    );

    await expect(
      commitCardRatingOperation(
        cardOperation({
          operationId: "operation-2",
          cardId: "card-2",
          reviewedCards: 2,
        }),
        database,
      ),
    ).rejects.toThrow("cannot be reopened");
    await expect(database.cardProgress.get("card-2")).resolves.toBeUndefined();
    await expect(database.studySessions.count()).resolves.toBe(1);
  });
});
