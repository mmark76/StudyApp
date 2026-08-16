import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CAPACITY_FIXTURE_SHAPES,
  CAPACITY_PERCENTAGES,
  createCapacityFixture,
  getCapacityFixturePlan,
  PERSONAL_USE_CALIBRATION,
  removeCapacityFixtureFiles,
  validateCapacityFixture,
  writeCapacityFixtureFiles,
} from "../benchmarks/capacity/capacityFixture";
import {
  CAPACITY_BENCHMARK_VERSION,
  parseCapacityBenchmarkArtifact,
  summarizeTimings,
} from "../benchmarks/capacity/capacityResult";
import {
  MAX_IMPORTED_FLASHCARDS,
  MAX_IMPORTED_UNITS,
} from "../src/features/content-import/importedContent";
import {
  MAX_IMPORTED_FLASHCARD_RECORDS,
  MAX_IMPORTED_UNIT_RECORDS,
} from "../src/infrastructure/backup/backup";

describe("capacity benchmark fixtures", () => {
  it("tracks the authoritative parser and backup safety maxima", () => {
    expect(MAX_IMPORTED_UNITS).toBe(10_000);
    expect(MAX_IMPORTED_FLASHCARDS).toBe(100_000);
    expect(MAX_IMPORTED_UNIT_RECORDS).toBe(MAX_IMPORTED_UNITS);
    expect(MAX_IMPORTED_FLASHCARD_RECORDS).toBe(MAX_IMPORTED_FLASHCARDS);
  });

  it("plans every shape at 25, 50, and 100 percent without exceeding safety capacity", () => {
    for (const shape of CAPACITY_FIXTURE_SHAPES) {
      for (const percentage of CAPACITY_PERCENTAGES) {
        const plan = getCapacityFixturePlan({ percentage, shape });
        expect(plan.chapterCount).toBeLessThanOrEqual(MAX_IMPORTED_UNITS);
        expect(plan.flashcardCount).toBeLessThanOrEqual(
          MAX_IMPORTED_FLASHCARDS,
        );
      }
    }

    expect(getCapacityFixturePlan({ percentage: 25, shape: "mixed" })).toMatchObject({
      chapterCount: 2_500,
      flashcardCount: 25_000,
    });
    expect(getCapacityFixturePlan({ percentage: 50, shape: "mixed" })).toMatchObject({
      chapterCount: 5_000,
      flashcardCount: 50_000,
    });
    expect(getCapacityFixturePlan({ percentage: 100, shape: "mixed" })).toMatchObject({
      chapterCount: MAX_IMPORTED_UNITS,
      flashcardCount: MAX_IMPORTED_FLASHCARDS,
    });
  });

  it("generates deterministic unique content accepted by the runtime parsers at 100 percent", () => {
    const first = createCapacityFixture({ percentage: 100, shape: "mixed" });
    const second = createCapacityFixture({ percentage: 100, shape: "mixed" });

    validateCapacityFixture(first);
    expect(first.manifest).toEqual(second.manifest);
    expect(first.units[0]).toEqual(second.units[0]);
    expect(first.units.at(-1)).toEqual(second.units.at(-1));
    expect(first.flashcards[0]).toEqual(second.flashcards[0]);
    expect(first.flashcards.at(-1)).toEqual(second.flashcards.at(-1));
    expect(new Set(first.units.map((unit) => unit.id))).toHaveLength(
      first.units.length,
    );
    expect(new Set(first.flashcards.map((card) => card.id))).toHaveLength(
      first.flashcards.length,
    );
    expect(first.manifest).toMatchObject({
      chapterCount: MAX_IMPORTED_UNITS,
      flashcardCount: MAX_IMPORTED_FLASHCARDS,
      percentage: 100,
      shape: "mixed",
      safetyMaximums: {
        chapters: MAX_IMPORTED_UNITS,
        flashcards: MAX_IMPORTED_FLASHCARDS,
      },
    });
    expect(first.manifest.fingerprint).toMatch(/^sha256:[0-9a-f]{64}$/u);
  });

  it("generates the exact deterministic personal-use calibration fixture", () => {
    const first = createCapacityFixture(PERSONAL_USE_CALIBRATION);
    const second = createCapacityFixture(PERSONAL_USE_CALIBRATION);

    validateCapacityFixture(first);
    expect(first.manifest).toEqual(second.manifest);
    expect(first.manifest).toMatchObject({
      chapterCount: 150,
      flashcardCount: 1_500,
      label: "personal-use-150-1500",
      percentage: 1.5,
      shape: "mixed",
    });
    expect(first.manifest.fingerprint).toMatch(/^sha256:[0-9a-f]{64}$/u);
    expect(new Set(first.flashcards.map((card) => card.unitId))).toHaveLength(150);
    expect(first.flashcards.filter((card) => card.unitId === first.units[0].id))
      .toHaveLength(10);
  });

  it("writes a truthful manifest and removes generated fixture files", async () => {
    const parent = await mkdtemp(join(tmpdir(), "studyapp-capacity-"));
    try {
      const files = await writeCapacityFixtureFiles(parent, {
        percentage: 25,
        shape: "chapter-heavy",
      });
      const manifest = JSON.parse(await readFile(files.manifestPath, "utf8")) as {
        chapterCount: number;
        flashcardCount: number;
      };
      expect(manifest).toMatchObject({
        chapterCount: 2_500,
        flashcardCount: 2_500,
      });
      await expect(access(files.chaptersCsvPath)).resolves.toBeUndefined();
      await expect(access(files.flashcardsCsvPath)).resolves.toBeUndefined();

      await removeCapacityFixtureFiles(files.directory);
      await expect(access(files.directory)).rejects.toThrow();
    } finally {
      await rm(parent, { force: true, recursive: true });
    }
  });
});

describe("capacity benchmark results", () => {
  it("summarizes repeat samples without machine-sensitive assertions", () => {
    expect(summarizeTimings([18, 10, 14])).toEqual({
      maximumMs: 18,
      medianMs: 14,
      minimumMs: 10,
      samples: 3,
    });
  });

  it("accepts explicitly unsupported optional metrics", () => {
    expect(parseCapacityBenchmarkArtifact({
      benchmarkVersion: CAPACITY_BENCHMARK_VERSION,
      environment: { profile: "test" },
      generatedAt: "2026-08-16T00:00:00.000Z",
      git: { dirty: true, head: "test" },
      importMeasurements: [],
      mode: "smoke",
      offline: { status: "environment-limited" },
      safetyCorrectness: { serialization: "unsupported" },
      safetyMaximums: {
        chapters: MAX_IMPORTED_UNITS,
        flashcards: MAX_IMPORTED_FLASHCARDS,
      },
      scenarios: [{
        accessibilityTree: { status: "unsupported" },
        chapterCount: 1,
        dom: null,
        errors: [],
        fixture: "mixed",
        flashcardCount: 1,
        keyboard: null,
        language: "en",
        longTasks: { status: "unsupported" },
        memory: { status: "unsupported" },
        milestones: {},
        percentage: 25,
        profile: "test",
        sampleMetrics: [],
        status: "measured",
        timeToInteraction: null,
        watchdogMs: 1_000,
      }],
    })).toMatchObject({ mode: "smoke" });
  });
});
