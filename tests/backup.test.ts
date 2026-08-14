import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BackupValidationError,
  createBackupPreview,
  exportBackup,
  importBackup,
  MAX_BACKUP_FILE_SIZE,
  parseBackup,
  parseBackupJson,
  serializeBackup,
} from "../src/infrastructure/backup/backup";
import { studyDatabase } from "../src/infrastructure/database/studyDatabase";
import type {
  AppSetting,
  CardProgress,
  StudyBackup,
  StudyOperation,
  StudySession,
} from "../src/shared/types/models";

const exportedAt = "2026-07-28T10:00:00.000Z";

function makeValidBackup(): StudyBackup {
  return {
    schemaVersion: 1,
    exportedAt,
    cardProgress: [
      {
        cardId: "card-imported-1",
        score: 2,
        repetitions: 3,
        intervalDays: 7,
        nextReviewAt: "2026-08-04T10:00:00.000Z",
        lastReviewedAt: "2026-07-28T10:00:00.000Z",
        lapses: 1,
      },
    ],
    studySessions: [
      {
        id: "session-1",
        mode: "quiz",
        startedAt: "2026-07-28T09:00:00.000Z",
        completedAt: "2026-07-28T09:15:00.000Z",
        reviewedCards: 10,
        correctAnswers: 8,
      },
    ],
    settings: [
      {
        key: "appearance-settings",
        value: {
          colorScheme: "amber",
          backgroundTone: "warm",
          fontChoice: "system",
          textSize: "comfortable",
          uiDensity: "comfortable",
        },
      },
      {
        key: "imported-study-units",
        value: [
          {
            id: "unit-imported-1",
            number: 1,
            title: "Imported chapter",
            objectives: ["Understand the topic"],
            summary: ["Key point"],
            keyTerms: ["term"],
          },
        ],
      },
      {
        key: "imported-flashcards",
        value: [
          {
            id: "card-imported-1",
            unitId: "unit-imported-1",
            number: 1,
            question: "Question?",
            answer: "Answer.",
            tags: ["topic"],
          },
        ],
      },
      {
        key: "study-material-links",
        value: [
          {
            id: "link-1",
            title: "Reference",
            url: "https://example.com/reference",
            materialType: "book",
          },
        ],
      },
    ],
  };
}

describe("backup validation", () => {
  it("accepts a complete valid backup and creates its preview", () => {
    const backup = parseBackup(makeValidBackup());

    expect(createBackupPreview(backup)).toEqual({
      exportedAt,
      progressRecords: 1,
      studySessions: 1,
      settingLabels: [
        "Appearance",
        "Imported chapters",
        "Imported flashcards",
        "Saved cloud links",
      ],
    });
  });

  it("rejects invalid JSON", () => {
    expect(() => parseBackupJson("{not-json")).toThrow("not valid JSON");
  });

  it("rejects an unsupported backup version", () => {
    expect(() => parseBackup({ ...makeValidBackup(), schemaVersion: 2 })).toThrow(
      "backup version is not supported",
    );
  });

  it("rejects invalid ISO dates", () => {
    const backup = makeValidBackup();

    expect(() => parseBackup({
      ...backup,
      cardProgress: [
        {
          ...backup.cardProgress[0],
          nextReviewAt: "28 July 2026",
        },
      ],
    })).toThrow("must be a valid ISO date");
  });

  it("rejects duplicate IDs", () => {
    const backup = makeValidBackup();

    expect(() => parseBackup({
      ...backup,
      studySessions: [
        backup.studySessions[0],
        { ...backup.studySessions[0] },
      ],
    })).toThrow("duplicate study session ID");
  });

  it("rejects unsupported ratings and activity modes", () => {
    const backup = makeValidBackup();

    expect(() => parseBackup({
      ...backup,
      cardProgress: [{ ...backup.cardProgress[0], score: 3 }],
    })).toThrow("unsupported rating");

    expect(() => parseBackup({
      ...backup,
      studySessions: [{ ...backup.studySessions[0], mode: "reading" }],
    })).toThrow("unsupported activity mode");
  });

  it("rejects negative numeric values", () => {
    const backup = makeValidBackup();

    expect(() => parseBackup({
      ...backup,
      cardProgress: [{ ...backup.cardProgress[0], repetitions: -1 }],
    })).toThrow("must be a non-negative whole number");
  });

  it("rejects invalid record relationships", () => {
    const backup = makeValidBackup();

    expect(() => parseBackup({
      ...backup,
      cardProgress: [{ ...backup.cardProgress[0], cardId: "missing-card" }],
    })).toThrow("refers to a flashcard that is not included");

    expect(() => parseBackup({
      ...backup,
      settings: backup.settings.map((setting) => (
        setting.key === "imported-flashcards"
          ? {
            ...setting,
            value: [{
              id: "card-imported-1",
              unitId: "missing-unit",
              number: 1,
              question: "Question?",
              answer: "Answer.",
              tags: [],
            }],
          }
          : setting
      )),
    })).toThrow("refers to a chapter that is not included");
  });

  it("rejects unsupported appearance values", () => {
    const backup = makeValidBackup();

    expect(() => parseBackup({
      ...backup,
      settings: backup.settings.map((setting) => (
        setting.key === "appearance-settings"
          ? {
            ...setting,
            value: {
              colorScheme: "neon",
              backgroundTone: "warm",
              fontChoice: "system",
              textSize: "comfortable",
              uiDensity: "comfortable",
            },
          }
          : setting
      )),
    })).toThrow("unsupported appearance settings");
  });

  it("rejects unsupported or duplicate setting records", () => {
    const backup = makeValidBackup();

    expect(() => parseBackup({
      ...backup,
      settings: [{ key: "unknown-setting", value: true }],
    })).toThrow("unsupported setting");

    expect(() => parseBackup({
      ...backup,
      settings: [
        backup.settings[0],
        { ...backup.settings[0] },
      ],
    })).toThrow("duplicate setting");
  });

  it("rejects oversized files before parsing their contents", () => {
    expect(() => parseBackupJson(
      JSON.stringify(makeValidBackup()),
      MAX_BACKUP_FILE_SIZE + 1,
    )).toThrow("larger than the 10 MB limit");
  });

  it("rejects unexpected local-file data outside the backup schema", () => {
    expect(() => parseBackup({
      ...makeValidBackup(),
      studyFiles: [{ data: "not-supported" }],
    })).toThrow("invalid structure");
  });

  it("refuses to serialize an otherwise valid backup above the file limit", () => {
    const flashcards = Array.from({ length: 600 }, (_, index) => ({
      id: `large-card-${index}`,
      unitId: "large-unit",
      number: index + 1,
      question: `${"q".repeat(19_000)}-${index}`,
      answer: "Answer",
      tags: [],
    }));
    expect(() => serializeBackup({
      schemaVersion: 1,
      exportedAt,
      cardProgress: [],
      studySessions: [],
      settings: [
        {
          key: "imported-study-units",
          value: [{
            id: "large-unit",
            number: 999,
            title: "Large unit",
            objectives: [],
            summary: [],
            keyTerms: [],
          }],
        },
        { key: "imported-flashcards", value: flashcards },
      ],
    })).toThrow("larger than the 10 MB limit");
  });
});

describe("transactional backup restore", () => {
  const existingProgress: CardProgress = {
    cardId: "existing-card",
    score: 1,
    repetitions: 2,
    intervalDays: 3,
    nextReviewAt: "2026-07-31T10:00:00.000Z",
    lastReviewedAt: "2026-07-28T10:00:00.000Z",
    lapses: 0,
  };
  const existingSession: StudySession = {
    id: "existing-session",
    mode: "flashcards",
    startedAt: "2026-07-27T10:00:00.000Z",
    completedAt: "2026-07-27T10:10:00.000Z",
    reviewedCards: 5,
    correctAnswers: 0,
  };
  const existingSetting: AppSetting = {
    key: "appearance-settings",
    value: {
      colorScheme: "blue",
      backgroundTone: "sky",
      fontChoice: "serif",
      textSize: "large",
      uiDensity: "spacious",
    },
  };
  const existingOperation: StudyOperation = {
    id: "existing-operation",
    kind: "quiz-completion",
    mode: "quiz",
    sessionId: existingSession.id,
    committedAt: existingSession.completedAt ?? existingSession.startedAt,
    completesSession: true,
    reviewedCards: existingSession.reviewedCards,
    correctAnswers: existingSession.correctAnswers,
  };

  beforeEach(async () => {
    await studyDatabase.delete();
    await studyDatabase.open();
    await studyDatabase.cardProgress.add(existingProgress);
    await studyDatabase.studyOperations.add(existingOperation);
    await studyDatabase.studySessions.add(existingSession);
    await studyDatabase.settings.add(existingSetting);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await studyDatabase.delete();
  });

  it("replaces all supported records after full validation", async () => {
    const backup = makeValidBackup();

    await importBackup(backup);

    await expect(studyDatabase.cardProgress.toArray()).resolves.toEqual(
      backup.cardProgress,
    );
    await expect(studyDatabase.studySessions.toArray()).resolves.toEqual(
      backup.studySessions,
    );
    await expect(studyDatabase.studyOperations.count()).resolves.toBe(0);
    await expect(studyDatabase.settings.count()).resolves.toBe(
      backup.settings.length,
    );
    await expect(studyDatabase.settings.get("appearance-settings")).resolves.toEqual(
      backup.settings[0],
    );
  });

  it("exports a validated snapshot of the supported records", async () => {
    await studyDatabase.cardProgress.clear();
    const backup = await exportBackup();

    expect(backup.cardProgress).toEqual([]);
    expect(backup.studySessions).toEqual([existingSession]);
    expect(backup.settings).toEqual([existingSetting]);
    expect(() => serializeBackup(backup)).not.toThrow();
  });

  it("refuses to export corrupt stored settings", async () => {
    await studyDatabase.settings.put({
      key: "imported-study-units",
      value: [{ id: "broken" }],
    });

    await expect(exportBackup()).rejects.toBeInstanceOf(BackupValidationError);
    await expect(studyDatabase.cardProgress.toArray()).resolves.toEqual([existingProgress]);
  });

  it("does not start replacement when validation fails", async () => {
    await expect(importBackup({
      ...makeValidBackup(),
      exportedAt: "invalid-date",
    })).rejects.toBeInstanceOf(BackupValidationError);

    await expect(studyDatabase.cardProgress.toArray()).resolves.toEqual([
      existingProgress,
    ]);
    await expect(studyDatabase.studySessions.toArray()).resolves.toEqual([
      existingSession,
    ]);
    await expect(studyDatabase.studyOperations.toArray()).resolves.toEqual([
      existingOperation,
    ]);
    await expect(studyDatabase.settings.toArray()).resolves.toEqual([
      existingSetting,
    ]);
  });

  it("rolls back every cleared table when a write fails", async () => {
    vi.spyOn(studyDatabase.studySessions, "bulkAdd")
      .mockRejectedValueOnce(new Error("Injected transaction failure"));

    await expect(importBackup(makeValidBackup())).rejects.toThrow(
      "Injected transaction failure",
    );

    await expect(studyDatabase.cardProgress.toArray()).resolves.toEqual([
      existingProgress,
    ]);
    await expect(studyDatabase.studySessions.toArray()).resolves.toEqual([
      existingSession,
    ]);
    await expect(studyDatabase.studyOperations.toArray()).resolves.toEqual([
      existingOperation,
    ]);
    await expect(studyDatabase.settings.toArray()).resolves.toEqual([
      existingSetting,
    ]);
  });
});
