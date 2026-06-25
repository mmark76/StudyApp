import type { Flashcard, StudyUnit } from "../../shared/types/models";

function parseDelimitedText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (character === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(value.trim());
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  row.push(value.trim());
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  return rows;
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
  if (rows.length < 2) throw new Error("The file contains no units");

  const units = rows.slice(1).map((row) => {
    const [numberValue = "", title = "", objectives = "", summary = "", keyTerms = ""] = row;
    const number = readNumber(numberValue, "Unit number");
    return {
      id: `unit-${number}`,
      number,
      title: requireText(title, "Unit title"),
      objectives: splitList(objectives),
      summary: splitList(summary),
      keyTerms: splitList(keyTerms),
    } satisfies StudyUnit;
  });

  if (new Set(units.map((unit) => unit.number)).size !== units.length) {
    throw new Error("Each unit number must be unique");
  }

  return units;
}

export function parseFlashcardsSpreadsheet(text: string, units: readonly StudyUnit[]): Flashcard[] {
  const rows = parseDelimitedText(text);
  if (rows.length < 2) throw new Error("The file contains no flashcards");

  const unitsByNumber = new Map(units.map((unit) => [unit.number, unit]));
  const counters = new Map<number, number>();

  return rows.slice(1).map((row, rowIndex) => {
    const [unitNumberValue = "", question = "", answer = "", tags = ""] = row;
    const unitNumber = readNumber(unitNumberValue, "Unit number");
    const unit = unitsByNumber.get(unitNumber);
    if (!unit) throw new Error(`Unit ${unitNumber} has not been added yet`);

    const number = (counters.get(unitNumber) ?? 0) + 1;
    counters.set(unitNumber, number);

    return {
      id: `card-${unitNumber}-${rowIndex + 1}`,
      unitId: unit.id,
      number,
      question: requireText(question, "Question"),
      answer: requireText(answer, "Answer"),
      tags: splitList(tags),
    } satisfies Flashcard;
  });
}
