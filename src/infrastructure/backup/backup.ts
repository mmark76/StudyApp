import {
  APPEARANCE_SETTINGS_KEY,
  backgroundToneOptions,
  colorSchemeOptions,
  fontChoiceOptions,
  textSizeOptions,
  uiDensityOptions,
  type AppearanceSettings,
} from "../../features/appearance/appearanceSettings";
import {
  IMPORTED_FLASHCARDS_SETTING_KEY,
  IMPORTED_UNITS_SETTING_KEY,
  parseImportedFlashcards,
  parseImportedUnits,
} from "../../features/content-import/importedContent";
import {
  parseStoredStudyMaterials,
  STUDY_MATERIALS_SETTING_KEY,
} from "../../features/study-materials/studyMaterials";
import {
  isSourceMaterialType,
  isStructuredStudyType,
} from "../../features/study-materials/localStudyFiles";
import { flashcards as builtInFlashcards } from "../../data/flashcards";
import { units as builtInUnits } from "../../data/units";
import type {
  AppSetting,
  CardProgress,
  Flashcard,
  StudyBackup,
  StudySession,
  StudyUnit,
} from "../../shared/types/models";
import { studyDatabase } from "../database/studyDatabase";

export const MAX_BACKUP_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_BACKUP_PROGRESS_RECORDS = 100_000;
export const MAX_BACKUP_SESSION_RECORDS = 100_000;
export const MAX_IMPORTED_UNIT_RECORDS = 10_000;
export const MAX_IMPORTED_FLASHCARD_RECORDS = 100_000;
export const MAX_STUDY_MATERIAL_LINK_RECORDS = 10_000;

const MAX_ID_LENGTH = 256;
const MAX_COUNTER_VALUE = 1_000_000;
const MAX_INTERVAL_DAYS = 365_000;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;
const TOP_LEVEL_KEYS = [
  "schemaVersion",
  "exportedAt",
  "cardProgress",
  "studySessions",
  "settings",
] as const;
const CARD_PROGRESS_KEYS = [
  "cardId",
  "score",
  "repetitions",
  "intervalDays",
  "nextReviewAt",
  "lastReviewedAt",
  "lapses",
] as const;
const STUDY_SESSION_KEYS = [
  "id",
  "mode",
  "startedAt",
  "completedAt",
  "reviewedCards",
  "correctAnswers",
] as const;
const SETTING_KEYS = ["key", "value"] as const;
const APPEARANCE_VALUE_KEYS = [
  "colorScheme",
  "backgroundTone",
  "fontChoice",
  "textSize",
  "uiDensity",
] as const;
const STUDY_MATERIAL_LINK_KEYS = [
  "id",
  "title",
  "url",
  "materialType",
  "structuredStudyType",
] as const;

const SUPPORTED_SETTING_LABELS: Readonly<Record<string, string>> = {
  [APPEARANCE_SETTINGS_KEY]: "Appearance",
  [IMPORTED_UNITS_SETTING_KEY]: "Imported chapters",
  [IMPORTED_FLASHCARDS_SETTING_KEY]: "Imported flashcards",
  [STUDY_MATERIALS_SETTING_KEY]: "Saved cloud links",
};

interface ValidatedSettings {
  settings: AppSetting[];
  importedUnits: StudyUnit[];
  importedFlashcards: Flashcard[];
}

export interface BackupPreview {
  exportedAt: string;
  progressRecords: number;
  studySessions: number;
  settingLabels: string[];
}

export class BackupValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackupValidationError";
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowedKeys: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowedKeys.includes(key));
}

function readId(value: unknown, label: string): string {
  if (
    typeof value !== "string"
    || value.length === 0
    || value.length > MAX_ID_LENGTH
    || value.trim() !== value
  ) {
    throw new BackupValidationError(`${label} is invalid.`);
  }
  return value;
}

function readIsoDate(value: unknown, label: string): string {
  if (
    typeof value !== "string"
    || !ISO_DATE_PATTERN.test(value)
    || Number.isNaN(Date.parse(value))
    || new Date(value).toISOString() !== value
  ) {
    throw new BackupValidationError(`${label} must be a valid ISO date.`);
  }
  return value;
}

function readNonNegativeInteger(
  value: unknown,
  label: string,
  maximum = MAX_COUNTER_VALUE,
): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > maximum) {
    throw new BackupValidationError(`${label} must be a non-negative whole number.`);
  }
  return value as number;
}

function readCardProgress(value: unknown): CardProgress {
  if (!isObject(value) || !hasOnlyKeys(value, CARD_PROGRESS_KEYS)) {
    throw new BackupValidationError("A progress record has an invalid structure.");
  }

  if (value.score !== 0 && value.score !== 1 && value.score !== 2) {
    throw new BackupValidationError("A progress record has an unsupported rating.");
  }

  return {
    cardId: readId(value.cardId, "Progress card ID"),
    score: value.score,
    repetitions: readNonNegativeInteger(value.repetitions, "Progress repetitions"),
    intervalDays: readNonNegativeInteger(
      value.intervalDays,
      "Progress interval",
      MAX_INTERVAL_DAYS,
    ),
    nextReviewAt: readIsoDate(value.nextReviewAt, "Next review date"),
    lastReviewedAt: readIsoDate(value.lastReviewedAt, "Last reviewed date"),
    lapses: readNonNegativeInteger(value.lapses, "Progress lapses"),
  };
}

function readStudySession(value: unknown): StudySession {
  if (!isObject(value) || !hasOnlyKeys(value, STUDY_SESSION_KEYS)) {
    throw new BackupValidationError("A study session has an invalid structure.");
  }
  if (value.mode !== "flashcards" && value.mode !== "quiz" && value.mode !== "review") {
    throw new BackupValidationError("A study session has an unsupported activity mode.");
  }

  const startedAt = readIsoDate(value.startedAt, "Session start date");
  const completedAt = "completedAt" in value
    ? readIsoDate(value.completedAt, "Session completion date")
    : undefined;
  if (completedAt && completedAt < startedAt) {
    throw new BackupValidationError("A study session ends before it starts.");
  }

  const reviewedCards = readNonNegativeInteger(value.reviewedCards, "Reviewed card count");
  const correctAnswers = readNonNegativeInteger(value.correctAnswers, "Correct answer count");
  if (correctAnswers > reviewedCards) {
    throw new BackupValidationError(
      "A study session has more correct answers than reviewed cards.",
    );
  }

  return {
    id: readId(value.id, "Study session ID"),
    mode: value.mode,
    startedAt,
    ...(completedAt ? { completedAt } : {}),
    reviewedCards,
    correctAnswers,
  };
}

function optionIsSupported<T extends string>(
  value: unknown,
  options: readonly { value: T }[],
): value is T {
  return typeof value === "string" && options.some((option) => option.value === value);
}

function readAppearanceSettings(value: unknown): AppearanceSettings {
  if (
    !isObject(value)
    || !hasOnlyKeys(value, APPEARANCE_VALUE_KEYS)
    || Object.keys(value).length !== APPEARANCE_VALUE_KEYS.length
    || !optionIsSupported(value.colorScheme, colorSchemeOptions)
    || !optionIsSupported(value.backgroundTone, backgroundToneOptions)
    || !optionIsSupported(value.fontChoice, fontChoiceOptions)
    || !optionIsSupported(value.textSize, textSizeOptions)
    || !optionIsSupported(value.uiDensity, uiDensityOptions)
  ) {
    throw new BackupValidationError("The backup contains unsupported appearance settings.");
  }

  return {
    colorScheme: value.colorScheme,
    backgroundTone: value.backgroundTone,
    fontChoice: value.fontChoice,
    textSize: value.textSize,
    uiDensity: value.uiDensity,
  };
}

function readSettings(values: unknown[]): ValidatedSettings {
  if (values.length > Object.keys(SUPPORTED_SETTING_LABELS).length) {
    throw new BackupValidationError("The backup contains too many settings records.");
  }

  const seenKeys = new Set<string>();
  const settings: AppSetting[] = [];
  let importedUnits: StudyUnit[] = [];
  let importedFlashcards: Flashcard[] = [];

  for (const value of values) {
    if (
      !isObject(value)
      || !hasOnlyKeys(value, SETTING_KEYS)
      || Object.keys(value).length !== SETTING_KEYS.length
    ) {
      throw new BackupValidationError("A settings record has an invalid structure.");
    }

    const key = readId(value.key, "Setting key");
    if (!Object.hasOwn(SUPPORTED_SETTING_LABELS, key)) {
      throw new BackupValidationError(`The backup contains an unsupported setting: ${key}.`);
    }
    if (seenKeys.has(key)) {
      throw new BackupValidationError(`The backup contains a duplicate setting: ${key}.`);
    }
    seenKeys.add(key);

    let validatedValue: unknown;
    try {
      if (key === APPEARANCE_SETTINGS_KEY) {
        validatedValue = readAppearanceSettings(value.value);
      } else if (key === IMPORTED_UNITS_SETTING_KEY) {
        if (!Array.isArray(value.value) || value.value.length > MAX_IMPORTED_UNIT_RECORDS) {
          throw new BackupValidationError("The backup contains too many imported chapters.");
        }
        importedUnits = parseImportedUnits(value.value);
        validatedValue = importedUnits;
      } else if (key === IMPORTED_FLASHCARDS_SETTING_KEY) {
        if (!Array.isArray(value.value) || value.value.length > MAX_IMPORTED_FLASHCARD_RECORDS) {
          throw new BackupValidationError("The backup contains too many imported flashcards.");
        }
        importedFlashcards = parseImportedFlashcards(value.value);
        validatedValue = importedFlashcards;
      } else {
        if (!Array.isArray(value.value) || value.value.length > MAX_STUDY_MATERIAL_LINK_RECORDS) {
          throw new BackupValidationError("The backup contains too many saved cloud links.");
        }
        for (const link of value.value) {
          if (
            !isObject(link)
            || !hasOnlyKeys(link, STUDY_MATERIAL_LINK_KEYS)
            || ("materialType" in link && !isSourceMaterialType(link.materialType))
            || (
              "structuredStudyType" in link
              && !isStructuredStudyType(link.structuredStudyType)
            )
          ) {
            throw new BackupValidationError("The backup contains an invalid saved cloud link.");
          }
        }
        const links = parseStoredStudyMaterials(value.value);
        if (links.length !== value.value.length) {
          throw new BackupValidationError("The backup contains an invalid saved cloud link.");
        }
        validatedValue = links;
      }
    } catch (error) {
      if (error instanceof BackupValidationError) throw error;
      throw new BackupValidationError(
        `The backup contains invalid data for ${SUPPORTED_SETTING_LABELS[key]}.`,
      );
    }

    settings.push({ key, value: validatedValue });
  }

  return { settings, importedUnits, importedFlashcards };
}

function assertUniqueIds(values: readonly string[], label: string): void {
  const ids = new Set<string>();
  for (const value of values) {
    if (ids.has(value)) {
      throw new BackupValidationError(`The backup contains a duplicate ${label}: ${value}.`);
    }
    ids.add(value);
  }
}

function assertRelationships(
  progress: readonly CardProgress[],
  importedUnits: readonly StudyUnit[],
  importedFlashcards: readonly Flashcard[],
): void {
  const unitIds = new Set([
    ...builtInUnits.map((unit) => unit.id),
    ...importedUnits.map((unit) => unit.id),
  ]);
  for (const card of importedFlashcards) {
    if (!unitIds.has(card.unitId)) {
      throw new BackupValidationError(
        `Flashcard ${card.id} refers to a chapter that is not included in the backup.`,
      );
    }
  }

  const cardIds = new Set([
    ...builtInFlashcards.map((card) => card.id),
    ...importedFlashcards.map((card) => card.id),
  ]);
  for (const item of progress) {
    if (!cardIds.has(item.cardId)) {
      throw new BackupValidationError(
        `Progress for ${item.cardId} refers to a flashcard that is not included in the backup.`,
      );
    }
  }
}

export function parseBackup(value: unknown): StudyBackup {
  if (!isObject(value) || !hasOnlyKeys(value, TOP_LEVEL_KEYS)) {
    throw new BackupValidationError("The backup has an invalid structure.");
  }
  if (value.schemaVersion !== 1) {
    throw new BackupValidationError("This backup version is not supported.");
  }
  if (!Array.isArray(value.cardProgress)) {
    throw new BackupValidationError("The backup progress records are missing.");
  }
  if (!Array.isArray(value.studySessions)) {
    throw new BackupValidationError("The backup study sessions are missing.");
  }
  if (!Array.isArray(value.settings)) {
    throw new BackupValidationError("The backup settings are missing.");
  }
  if (value.cardProgress.length > MAX_BACKUP_PROGRESS_RECORDS) {
    throw new BackupValidationError("The backup contains too many progress records.");
  }
  if (value.studySessions.length > MAX_BACKUP_SESSION_RECORDS) {
    throw new BackupValidationError("The backup contains too many study sessions.");
  }

  const exportedAt = readIsoDate(value.exportedAt, "Backup creation date");
  const cardProgress = value.cardProgress.map(readCardProgress);
  const studySessions = value.studySessions.map(readStudySession);
  const {
    settings,
    importedUnits,
    importedFlashcards,
  } = readSettings(value.settings);

  assertUniqueIds(cardProgress.map((item) => item.cardId), "progress card ID");
  assertUniqueIds(studySessions.map((session) => session.id), "study session ID");
  assertRelationships(cardProgress, importedUnits, importedFlashcards);

  return {
    schemaVersion: 1,
    exportedAt,
    cardProgress,
    studySessions,
    settings,
  };
}

export function parseBackupJson(
  text: string,
  fileSize = new TextEncoder().encode(text).byteLength,
): StudyBackup {
  if (fileSize > MAX_BACKUP_FILE_SIZE) {
    throw new BackupValidationError("The backup file is larger than the 10 MB limit.");
  }

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new BackupValidationError("The selected file is not valid JSON.");
  }
  return parseBackup(value);
}

export function createBackupPreview(backup: StudyBackup): BackupPreview {
  return {
    exportedAt: backup.exportedAt,
    progressRecords: backup.cardProgress.length,
    studySessions: backup.studySessions.length,
    settingLabels: backup.settings.map(
      (setting) => SUPPORTED_SETTING_LABELS[setting.key] ?? setting.key,
    ),
  };
}

export async function exportBackup(): Promise<StudyBackup> {
  const [cardProgress, studySessions, settings] = await Promise.all([
    studyDatabase.cardProgress.toArray(),
    studyDatabase.studySessions.toArray(),
    studyDatabase.settings.toArray(),
  ]);
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    cardProgress,
    studySessions,
    settings,
  };
}

export async function importBackup(value: unknown): Promise<void> {
  const backup = parseBackup(value);
  await studyDatabase.transaction(
    "rw",
    studyDatabase.cardProgress,
    studyDatabase.studySessions,
    studyDatabase.settings,
    async () => {
      await studyDatabase.cardProgress.clear();
      await studyDatabase.studySessions.clear();
      await studyDatabase.settings.clear();
      await studyDatabase.cardProgress.bulkAdd(backup.cardProgress);
      await studyDatabase.studySessions.bulkAdd(backup.studySessions);
      await studyDatabase.settings.bulkAdd(backup.settings);
    },
  );
}
