import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { StudyDatabase } from "../src/infrastructure/database/studyDatabase";
import type {
  CardProgress,
  StudySession,
} from "../src/shared/types/models";

describe("StudyDatabase version 3 migration", () => {
  const databaseNames: string[] = [];

  afterEach(async () => {
    for (const databaseName of databaseNames) {
      await Dexie.delete(databaseName);
    }
    databaseNames.length = 0;
  });

  it("adds idempotency storage without losing version 2 progress or sessions", async () => {
    const databaseName = `study-migration-${crypto.randomUUID()}`;
    const progress: CardProgress = {
      cardId: "legacy-card",
      score: 2,
      repetitions: 4,
      intervalDays: 10,
      nextReviewAt: "2026-08-09T10:00:00.000Z",
      lastReviewedAt: "2026-07-30T10:00:00.000Z",
      lapses: 1,
    };
    const session: StudySession = {
      id: "legacy-session",
      mode: "quiz",
      startedAt: "2026-07-30T09:00:00.000Z",
      completedAt: "2026-07-30T09:10:00.000Z",
      reviewedCards: 4,
      correctAnswers: 3,
    };
    const legacyDatabase = new Dexie(databaseName);
    databaseNames.push(databaseName);
    legacyDatabase.version(2).stores({
      cardProgress: "&cardId,nextReviewAt,score",
      studySessions: "&id,mode,startedAt,completedAt",
      settings: "&key",
      studyFiles: "&id,createdAt,title",
    });
    await legacyDatabase.open();
    await legacyDatabase.table<CardProgress>("cardProgress").add(progress);
    await legacyDatabase.table<StudySession>("studySessions").add(session);
    legacyDatabase.close();

    const migratedDatabase = new StudyDatabase(databaseName);
    await migratedDatabase.open();

    await expect(
      migratedDatabase.cardProgress.get(progress.cardId),
    ).resolves.toEqual(progress);
    await expect(
      migratedDatabase.studySessions.get(session.id),
    ).resolves.toEqual(session);
    await expect(migratedDatabase.studyOperations.count()).resolves.toBe(0);
    expect(migratedDatabase.verno).toBe(3);
  });
});
