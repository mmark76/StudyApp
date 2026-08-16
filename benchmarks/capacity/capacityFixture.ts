import { createHash } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  MAX_IMPORTED_FLASHCARDS,
  MAX_IMPORTED_UNITS,
  parseImportedFlashcards,
  parseImportedUnits,
} from "../../src/features/content-import/importedContent";
import type { Flashcard, StudyUnit } from "../../src/shared/types/models";

export const CAPACITY_FIXTURE_VERSION = "1.0.0";
export const CAPACITY_PERCENTAGES = [25, 50, 100] as const;
export const PERSONAL_USE_CALIBRATION = {
  chapterCount: 150,
  flashcardCount: 1_500,
  label: "personal-use-150-1500",
  percentage: 1.5,
  shape: "mixed",
} as const;
export const CAPACITY_FIXTURE_SHAPES = [
  "chapter-heavy",
  "flashcard-heavy",
  "mixed",
] as const;

export type CapacityPercentage = (typeof CAPACITY_PERCENTAGES)[number];
export type CapacityFixtureShape = (typeof CAPACITY_FIXTURE_SHAPES)[number];

export interface ScaledCapacityFixtureRequest {
  percentage: CapacityPercentage;
  shape: CapacityFixtureShape;
}

export interface ExplicitCapacityFixtureRequest {
  chapterCount: number;
  flashcardCount: number;
  label: string;
  percentage: number;
  shape: CapacityFixtureShape;
}

export type CapacityFixtureRequest =
  | ExplicitCapacityFixtureRequest
  | ScaledCapacityFixtureRequest;

export interface CapacityFixturePlan {
  chapterCount: number;
  flashcardCount: number;
  label?: string;
  percentage: number;
  shape: CapacityFixtureShape;
}

export interface CapacityFixtureManifest extends CapacityFixturePlan {
  fingerprint: string;
  generatorVersion: string;
  safetyMaximums: {
    chapters: number;
    flashcards: number;
  };
}

export interface CapacityFixture {
  flashcards: Flashcard[];
  manifest: CapacityFixtureManifest;
  units: StudyUnit[];
}

export interface CapacityFixtureFiles {
  chaptersCsvPath: string;
  directory: string;
  flashcardsCsvPath: string;
  manifestPath: string;
}

function percentageOf(maximum: number, percentage: CapacityPercentage): number {
  return Math.floor((maximum * percentage) / 100);
}

export function getCapacityFixturePlan(
  request: CapacityFixtureRequest,
): CapacityFixturePlan {
  if ("chapterCount" in request) {
    if (
      !Number.isSafeInteger(request.chapterCount)
      || request.chapterCount < 1
      || request.chapterCount > MAX_IMPORTED_UNITS
      || !Number.isSafeInteger(request.flashcardCount)
      || request.flashcardCount < 1
      || request.flashcardCount > MAX_IMPORTED_FLASHCARDS
    ) {
      throw new Error("Explicit capacity fixture counts are outside the production safety maximum.");
    }
    return { ...request };
  }

  const scaledChapters = percentageOf(MAX_IMPORTED_UNITS, request.percentage);
  const scaledFlashcards = percentageOf(
    MAX_IMPORTED_FLASHCARDS,
    request.percentage,
  );

  if (request.shape === "chapter-heavy") {
    return {
      ...request,
      chapterCount: scaledChapters,
      flashcardCount: scaledChapters,
    };
  }
  if (request.shape === "flashcard-heavy") {
    return {
      ...request,
      chapterCount: Math.min(100, scaledChapters),
      flashcardCount: scaledFlashcards,
    };
  }
  return {
    ...request,
    chapterCount: scaledChapters,
    flashcardCount: scaledFlashcards,
  };
}

function createUnits(count: number): StudyUnit[] {
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    return {
      id: `benchmark-unit-${number}`,
      number,
      title: `Benchmark chapter ${number}`,
      objectives: [`Objective ${number}`],
      summary: [`Summary ${number}`],
      keyTerms: [`term-${number}`],
    };
  });
}

function createFlashcards(count: number, units: readonly StudyUnit[]): Flashcard[] {
  return Array.from({ length: count }, (_, index) => {
    const sequence = index + 1;
    const unitIndex = index % units.length;
    return {
      id: `benchmark-card-${sequence}`,
      unitId: units[unitIndex].id,
      number: Math.floor(index / units.length) + 1,
      question: `Benchmark question ${sequence}?`,
      answer: `Benchmark answer ${sequence}.`,
      tags: ["benchmark"],
    };
  });
}

function fingerprintFixture(
  plan: CapacityFixturePlan,
  units: readonly StudyUnit[],
  flashcards: readonly Flashcard[],
): string {
  const hash = createHash("sha256");
  hash.update(
    `${CAPACITY_FIXTURE_VERSION}\n${plan.label ?? "scaled"}\n${plan.shape}\n${plan.percentage}\n`,
  );
  for (const unit of units) hash.update(`${JSON.stringify(unit)}\n`);
  for (const card of flashcards) hash.update(`${JSON.stringify(card)}\n`);
  return `sha256:${hash.digest("hex")}`;
}

export function createCapacityFixture(
  request: CapacityFixtureRequest,
): CapacityFixture {
  const plan = getCapacityFixturePlan(request);
  const units = createUnits(plan.chapterCount);
  const flashcards = createFlashcards(plan.flashcardCount, units);

  if (
    units.length > MAX_IMPORTED_UNITS
    || flashcards.length > MAX_IMPORTED_FLASHCARDS
  ) {
    throw new Error("Capacity fixture exceeds the production safety maximum.");
  }

  return {
    units,
    flashcards,
    manifest: {
      ...plan,
      fingerprint: fingerprintFixture(plan, units, flashcards),
      generatorVersion: CAPACITY_FIXTURE_VERSION,
      safetyMaximums: {
        chapters: MAX_IMPORTED_UNITS,
        flashcards: MAX_IMPORTED_FLASHCARDS,
      },
    },
  };
}

function escapeCsv(value: string | number): string {
  const text = String(value);
  return /[",\r\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function createCapacityFixtureCsv(fixture: CapacityFixture): {
  chapters: string;
  flashcards: string;
} {
  const unitNumberById = new Map(
    fixture.units.map((unit) => [unit.id, unit.number] as const),
  );
  const chapters = [
    "Chapter number,Chapter title,What should you learn?,Key points,Important terms",
    ...fixture.units.map((unit) => [
      unit.number,
      unit.title,
      unit.objectives.join(" | "),
      unit.summary.join(" | "),
      unit.keyTerms.join(" | "),
    ].map(escapeCsv).join(",")),
  ].join("\n");
  const flashcards = [
    "Chapter number,Question,Answer,Keywords",
    ...fixture.flashcards.map((card) => [
      unitNumberById.get(card.unitId) ?? "",
      card.question,
      card.answer,
      card.tags.join(" | "),
    ].map(escapeCsv).join(",")),
  ].join("\n");
  return { chapters, flashcards };
}

export function validateCapacityFixture(fixture: CapacityFixture): void {
  const units = parseImportedUnits(fixture.units);
  const flashcards = parseImportedFlashcards(fixture.flashcards);
  if (
    units.length !== fixture.manifest.chapterCount
    || flashcards.length !== fixture.manifest.flashcardCount
  ) {
    throw new Error("Capacity fixture manifest counts do not match its content.");
  }
}

export async function writeCapacityFixtureFiles(
  parentDirectory: string,
  request: CapacityFixtureRequest,
): Promise<CapacityFixtureFiles> {
  const fixture = createCapacityFixture(request);
  validateCapacityFixture(fixture);
  const directory = join(
    parentDirectory,
    fixture.manifest.label
      ?? `${fixture.manifest.shape}-${fixture.manifest.percentage}`,
  );
  const manifestPath = join(directory, "manifest.json");
  const chaptersCsvPath = join(directory, "chapters.csv");
  const flashcardsCsvPath = join(directory, "flashcards.csv");
  const csv = createCapacityFixtureCsv(fixture);

  await mkdir(directory, { recursive: true });
  await Promise.all([
    writeFile(manifestPath, `${JSON.stringify(fixture.manifest, null, 2)}\n`, "utf8"),
    writeFile(chaptersCsvPath, csv.chapters, "utf8"),
    writeFile(flashcardsCsvPath, csv.flashcards, "utf8"),
  ]);
  return { chaptersCsvPath, directory, flashcardsCsvPath, manifestPath };
}

export async function removeCapacityFixtureFiles(directory: string): Promise<void> {
  await rm(directory, { force: true, recursive: true });
}
