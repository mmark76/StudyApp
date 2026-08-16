import type { Flashcard, StudyUnit } from "../../shared/types/models";

export const IMPORTED_UNITS_SETTING_KEY = "imported-study-units";
export const IMPORTED_FLASHCARDS_SETTING_KEY = "imported-flashcards";
export const MAX_IMPORTED_UNITS = 10_000;
export const MAX_IMPORTED_FLASHCARDS = 100_000;
export const MAX_IMPORTED_TEXT_LENGTH = 20_000;
const MAX_IMPORTED_LIST_ITEMS = 1_000;
const MAX_IMPORTED_ID_LENGTH = 256;
const MAX_IMPORTED_NUMBER = 1_000_000;
const UNIT_KEYS = ["id", "number", "title", "objectives", "summary", "keyTerms"] as const;
const FLASHCARD_KEYS = ["id", "unitId", "number", "question", "answer", "tags"] as const;

export class StoredContentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoredContentValidationError";
  }
}

export type PracticeContentCollection = "chapters" | "flashcards";

export class PracticeContentCapacityError extends Error {
  readonly code = "practice-content-capacity-exceeded";

  constructor(
    readonly collection: PracticeContentCollection,
    readonly maximum: number,
  ) {
    super(
      `The ${collection} collection exceeds the maximum total of ${maximum.toLocaleString("en-US")}. Existing content was not changed.`,
    );
    this.name = "PracticeContentCapacityError";
  }
}

export function getPracticeContentCapacityMessage(
  error: unknown,
  language: "en" | "el",
): string | null {
  if (!(error instanceof PracticeContentCapacityError)) return null;
  const maximum = error.maximum.toLocaleString(
    language === "el" ? "el-GR" : "en-US",
  );
  if (language === "el") {
    const collection = error.collection === "chapters"
      ? "κεφαλαίων εξάσκησης"
      : "flashcards";
    return `Δεν αποθηκεύτηκε. Συμπληρώθηκε το μέγιστο σύνολο των ${maximum} ${collection}. Το υπάρχον περιεχόμενο δεν άλλαξε.`;
  }
  const collection = error.collection === "chapters"
    ? "practice chapters"
    : "flashcards";
  return `Not saved. The maximum total of ${maximum} ${collection} has been reached. Existing content is unchanged.`;
}

function assertImportedCollectionCapacity(
  collection: PracticeContentCollection,
  count: number,
  maximum: number,
): void {
  if (count > maximum) {
    throw new PracticeContentCapacityError(collection, maximum);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length && actualKeys.every((key) => keys.includes(key));
}

function readString(value: unknown, field: string): string {
  if (
    typeof value !== "string"
    || value.trim().length === 0
    || value.trim().length > MAX_IMPORTED_TEXT_LENGTH
  ) {
    throw new Error(`Invalid ${field}`);
  }
  return value.trim();
}

function readId(value: unknown, field: string): string {
  const id = readString(value, field);
  if (id.length > MAX_IMPORTED_ID_LENGTH) throw new Error(`Invalid ${field}`);
  return id;
}

function readPositiveInteger(value: unknown, field: string): number {
  if (
    typeof value !== "number"
    || !Number.isSafeInteger(value)
    || value < 1
    || value > MAX_IMPORTED_NUMBER
  ) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

function readStringArray(value: unknown, field: string): string[] {
  if (
    !Array.isArray(value)
    || value.length > MAX_IMPORTED_LIST_ITEMS
    || !value.every(
      (item) => typeof item === "string" && item.trim().length <= MAX_IMPORTED_TEXT_LENGTH,
    )
  ) {
    throw new Error(`Invalid ${field}`);
  }
  return value.map((item) => item.trim()).filter(Boolean);
}

function extractArray(value: unknown, property: "units" | "flashcards"): unknown[] {
  const candidate = isRecord(value) ? value[property] : value;
  if (!Array.isArray(candidate)) throw new Error(`Expected a ${property} array`);
  return candidate;
}

export function parseImportedUnits(value: unknown): StudyUnit[] {
  const rows = extractArray(value, "units");
  assertImportedCollectionCapacity("chapters", rows.length, MAX_IMPORTED_UNITS);
  const ids = new Set<string>();
  const numbers = new Set<number>();

  return rows.map((row) => {
    if (!isRecord(row) || !hasExactKeys(row, UNIT_KEYS)) throw new Error("Invalid unit record");
    const unit: StudyUnit = {
      id: readId(row.id, "unit id"),
      number: readPositiveInteger(row.number, "unit number"),
      title: readString(row.title, "unit title"),
      objectives: readStringArray(row.objectives, "unit objectives"),
      summary: readStringArray(row.summary, "unit summary"),
      keyTerms: readStringArray(row.keyTerms, "unit key terms"),
    };
    if (ids.has(unit.id)) throw new Error(`Duplicate unit id: ${unit.id}`);
    if (numbers.has(unit.number)) throw new Error(`Duplicate unit number: ${unit.number}`);
    ids.add(unit.id);
    numbers.add(unit.number);
    return unit;
  });
}

export function parseImportedFlashcards(value: unknown): Flashcard[] {
  const rows = extractArray(value, "flashcards");
  assertImportedCollectionCapacity(
    "flashcards",
    rows.length,
    MAX_IMPORTED_FLASHCARDS,
  );
  const ids = new Set<string>();

  return rows.map((row) => {
    if (!isRecord(row) || !hasExactKeys(row, FLASHCARD_KEYS)) throw new Error("Invalid flashcard record");
    const card: Flashcard = {
      id: readId(row.id, "flashcard id"),
      unitId: readId(row.unitId, "flashcard unit id"),
      number: readPositiveInteger(row.number, "flashcard number"),
      question: readString(row.question, "flashcard question"),
      answer: readString(row.answer, "flashcard answer"),
      tags: readStringArray(row.tags, "flashcard tags"),
    };
    if (ids.has(card.id)) throw new Error(`Duplicate flashcard id: ${card.id}`);
    ids.add(card.id);
    return card;
  });
}

export function parseStoredUnits(value: unknown): StudyUnit[] {
  if (value === undefined || value === null) return [];
  try {
    return parseImportedUnits(value);
  } catch (error) {
    throw new StoredContentValidationError(
      `Saved practice chapters are invalid: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
}

export function parseStoredFlashcards(value: unknown): Flashcard[] {
  if (value === undefined || value === null) return [];
  try {
    return parseImportedFlashcards(value);
  } catch (error) {
    throw new StoredContentValidationError(
      `Saved flashcards are invalid: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
}

export function mergeById<T extends { id: string }>(builtIn: readonly T[], imported: readonly T[]): T[] {
  const merged = new Map<string, T>();
  for (const item of builtIn) merged.set(item.id, item);
  for (const item of imported) merged.set(item.id, item);
  return [...merged.values()];
}
