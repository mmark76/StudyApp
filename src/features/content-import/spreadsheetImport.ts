import type { Flashcard, StudyUnit } from "../../shared/types/models";
import {
  buildFlashcardIdentity,
  createFlashcardContentId,
} from "./flashcardIdentity";
import {
  MAX_IMPORTED_FLASHCARDS,
  MAX_IMPORTED_TEXT_LENGTH,
  MAX_IMPORTED_UNITS,
} from "./importedContent";

const UNITS_HEADERS = ["Chapter number", "Chapter title", "What should you learn?", "Key points", "Important terms"];
const FLASHCARDS_HEADERS = ["Chapter number", "Question", "Answer", "Keywords"];
export const MAX_SPREADSHEET_FILE_SIZE = 10 * 1024 * 1024;

function assertSpreadsheetTextSize(text: string): void {
  if (new TextEncoder().encode(text).byteLength > MAX_SPREADSHEET_FILE_SIZE) {
    throw new Error("The CSV file is larger than the 10 MB limit.");
  }
}

function parseDelimitedText(text: string): string[][] {
  assertSpreadsheetTextSize(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  let quoteClosed = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (character === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (character === '"' && !quoted && value.length === 0) {
      quoted = true;
      quoteClosed = false;
    } else if (character === '"' && quoted) {
      quoted = false;
      quoteClosed = true;
    } else if (quoteClosed && character !== "," && character !== "\n" && character !== "\r") {
      throw new Error("The CSV file has text after a closing quote.");
    } else if (character === '"') {
      throw new Error("The CSV file contains an invalid quote.");
    } else if (character === "," && !quoted) {
      row.push(value.trim());
      value = "";
      quoteClosed = false;
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(value.trim());
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = "";
      quoteClosed = false;
    } else {
      value += character;
      if (value.length > MAX_IMPORTED_TEXT_LENGTH) {
        throw new Error("A CSV cell is too long.");
      }
    }
  }

  if (quoted) throw new Error("The CSV file contains an unclosed quote.");

  row.push(value.trim());
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  return rows;
}

function validateHeaders(actual: readonly string[], expected: readonly string[], label: string): void {
  const matches = actual.length === expected.length
    && expected.every((header, index) => actual[index] === header);

  if (!matches) {
    throw new Error(`The ${label} file must start with these column headings: ${expected.join(", ")}`);
  }
}

function splitList(value: string): string[] {
  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readNumber(value: string, label: string): number {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) throw new Error(`${label} must be a positive whole number`);
  return number;
}

function requireText(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} is required`);
  return trimmed;
}

export function parseUnitsSpreadsheet(text: string): StudyUnit[] {
  const rows = parseDelimitedText(text);
  if (rows.length === 0) throw new Error("The file contains no chapters");
  validateHeaders(rows[0], UNITS_HEADERS, "chapters");
  if (rows.length < 2) throw new Error("The file contains no chapters");
  if (rows.length - 1 > MAX_IMPORTED_UNITS) throw new Error("The file contains too many chapters");

  const units = rows.slice(1).map((row) => {
    if (row.length !== UNITS_HEADERS.length) throw new Error("Each chapter row must contain exactly 5 columns");
    const [numberValue = "", title = "", objectives = "", summary = "", keyTerms = ""] = row;
    const number = readNumber(numberValue, "Chapter number");
    return {
      id: `unit-${number}`,
      number,
      title: requireText(title, "Chapter title"),
      objectives: splitList(objectives),
      summary: splitList(summary),
      keyTerms: splitList(keyTerms),
    } satisfies StudyUnit;
  });

  if (new Set(units.map((unit) => unit.number)).size !== units.length) {
    throw new Error("Each chapter number must be unique");
  }

  return units;
}

export async function parseFlashcardsSpreadsheet(
  text: string,
  units: readonly StudyUnit[],
  cryptoProvider: Crypto | null | undefined = globalThis.crypto,
): Promise<Flashcard[]> {
  const rows = parseDelimitedText(text);
  if (rows.length === 0) throw new Error("The file contains no flashcards");
  validateHeaders(rows[0], FLASHCARDS_HEADERS, "flashcards");
  if (rows.length < 2) throw new Error("The file contains no flashcards");
  if (rows.length - 1 > MAX_IMPORTED_FLASHCARDS) throw new Error("The file contains too many flashcards");

  const unitsByNumber = new Map<number, StudyUnit>(
    units.map((unit) => [unit.number, unit] as const),
  );
  const counters = new Map<number, number>();
  const firstRowByIdentity = new Map<string, number>();

  const drafts = rows.slice(1).map((row, rowIndex) => {
    if (row.length !== FLASHCARDS_HEADERS.length) {
      throw new Error(`Flashcard row ${rowIndex + 2} must contain exactly 4 columns`);
    }
    const [unitNumberValue = "", question = "", answer = "", tags = ""] = row;
    const unitNumber = readNumber(unitNumberValue, "Chapter number");
    const unit = unitsByNumber.get(unitNumber);
    if (!unit) throw new Error(`Chapter ${unitNumber} has not been added yet`);

    const number = (counters.get(unitNumber) ?? 0) + 1;
    counters.set(unitNumber, number);
    const parsedQuestion = requireText(question, "Question");
    const parsedAnswer = requireText(answer, "Answer");
    const identity = buildFlashcardIdentity(unit.id, parsedQuestion, parsedAnswer);
    const sourceRow = rowIndex + 2;
    const firstSourceRow = firstRowByIdentity.get(identity);
    if (firstSourceRow !== undefined) {
      throw new Error(
        `Flashcard rows ${firstSourceRow} and ${sourceRow} have the same chapter, question and answer.`,
      );
    }
    firstRowByIdentity.set(identity, sourceRow);

    return {
      unitId: unit.id,
      number,
      question: parsedQuestion,
      answer: parsedAnswer,
      tags: splitList(tags),
      identity,
    };
  });

  const identitiesById = new Map<string, string>();
  const flashcards: Flashcard[] = [];
  for (const draft of drafts) {
    const id = await createFlashcardContentId(
      draft.unitId,
      draft.question,
      draft.answer,
      cryptoProvider,
    );
    const existingIdentity = identitiesById.get(id);
    if (existingIdentity !== undefined && existingIdentity !== draft.identity) {
      throw new Error("Two different flashcards produced the same stable ID. No cards were imported.");
    }
    identitiesById.set(id, draft.identity);
    flashcards.push({
      id,
      unitId: draft.unitId,
      number: draft.number,
      question: draft.question,
      answer: draft.answer,
      tags: draft.tags,
    });
  }
  return flashcards;
}
