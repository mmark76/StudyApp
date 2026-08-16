export const CAPACITY_BENCHMARK_VERSION = "1.0.0";

export type CapacityMetricStatus =
  | "measured"
  | "timeout"
  | "unsupported"
  | "failed"
  | "environment-limited";

export interface TimingSummary {
  maximumMs: number;
  medianMs: number;
  minimumMs: number;
  samples: number;
}

export interface CapacityScenarioResult {
  accessibilityTree: Record<string, unknown> | null;
  chapterCount: number;
  dom: Record<string, number> | null;
  errors: string[];
  fixture: string;
  flashcardCount: number;
  keyboard: Record<string, number | boolean | string> | null;
  language: "en" | "el";
  longTasks: Record<string, number | string> | null;
  memory: Record<string, number | string> | null;
  milestones: Record<string, TimingSummary | null>;
  percentage: number;
  profile: string;
  sampleMetrics: Array<Record<string, unknown>>;
  status: CapacityMetricStatus;
  timeToInteraction: TimingSummary | null;
  watchdogMs: number;
}

export interface CapacityBenchmarkArtifact {
  benchmarkVersion: string;
  environment: Record<string, unknown>;
  generatedAt: string;
  git: {
    dirty: boolean;
    head: string;
  };
  importMeasurements: Array<Record<string, unknown>>;
  mode: "smoke" | "baseline" | "calibration" | "safety-smoke";
  offline: Record<string, unknown>;
  safetyCorrectness: Record<string, unknown>;
  safetyMaximums: {
    chapters: number;
    flashcards: number;
  };
  scenarios: CapacityScenarioResult[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMetricStatus(value: unknown): value is CapacityMetricStatus {
  return value === "measured"
    || value === "timeout"
    || value === "unsupported"
    || value === "failed"
    || value === "environment-limited";
}

export function parseCapacityBenchmarkArtifact(
  value: unknown,
): CapacityBenchmarkArtifact {
  if (!isRecord(value) || value.benchmarkVersion !== CAPACITY_BENCHMARK_VERSION) {
    throw new Error("Unsupported capacity benchmark artifact.");
  }
  if (
    value.mode !== "smoke"
    && value.mode !== "baseline"
    && value.mode !== "calibration"
    && value.mode !== "safety-smoke"
  ) {
    throw new Error("Invalid capacity benchmark mode.");
  }
  if (!isRecord(value.git) || typeof value.git.head !== "string" || typeof value.git.dirty !== "boolean") {
    throw new Error("Invalid capacity benchmark git metadata.");
  }
  if (
    !isRecord(value.safetyMaximums)
    || typeof value.safetyMaximums.chapters !== "number"
    || typeof value.safetyMaximums.flashcards !== "number"
  ) {
    throw new Error("Invalid capacity benchmark safety maxima.");
  }
  if (!Array.isArray(value.scenarios) || !Array.isArray(value.importMeasurements)) {
    throw new Error("Invalid capacity benchmark measurements.");
  }
  for (const scenario of value.scenarios) {
    if (!isRecord(scenario) || !isMetricStatus(scenario.status)) {
      throw new Error("Invalid capacity benchmark scenario.");
    }
  }
  if (!isRecord(value.environment) || !isRecord(value.offline) || !isRecord(value.safetyCorrectness)) {
    throw new Error("Invalid capacity benchmark supporting evidence.");
  }
  if (typeof value.generatedAt !== "string") {
    throw new Error("Invalid capacity benchmark timestamp.");
  }
  return value as unknown as CapacityBenchmarkArtifact;
}

export function summarizeTimings(values: readonly number[]): TimingSummary | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((first, second) => first - second);
  const middle = Math.floor(sorted.length / 2);
  const medianMs = sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
  return {
    maximumMs: Math.round(sorted.at(-1) ?? 0),
    medianMs: Math.round(medianMs),
    minimumMs: Math.round(sorted[0]),
    samples: sorted.length,
  };
}
