import { describe, expect, it } from "vitest";
import {
  addRenderedPixelCount,
  addSplitOutputSize,
  assertSplitPageBudget,
  MAX_SPLIT_TOTAL_OUTPUT_SIZE,
} from "../src/features/study-materials/splitPdfLimits";

describe("split PDF resource limits", () => {
  it("rejects overlapping chunks whose total exceeds the page budget", () => {
    expect(() => assertSplitPageBudget([
      { pageIndexes: Array.from({ length: 300 }, (_, index) => index) },
      { pageIndexes: Array.from({ length: 201 }, (_, index) => index) },
    ])).toThrow("more than 500 pages");
  });

  it("rejects aggregate output beyond 100 MB", () => {
    expect(() => addSplitOutputSize(
      MAX_SPLIT_TOTAL_OUTPUT_SIZE - 10,
      11,
    )).toThrow("100 MB total limit");
  });

  it("rejects a single oversized canvas and an oversized render batch", () => {
    expect(() => addRenderedPixelCount(0, 10_000, 3_000)).toThrow("page is too large");
    expect(() => addRenderedPixelCount(99_000_000, 1_001, 1_000)).toThrow(
      "selected pages are too large",
    );
  });
});
