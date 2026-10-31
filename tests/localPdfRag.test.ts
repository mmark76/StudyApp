import { describe, expect, it } from "vitest";
import { rankPdfPassages, splitPageIntoChunks, tokenizeStudyText, type PdfChunk } from "../src/features/assistant/localPdfRag";

function chunk(sourceId: string, page: number, text: string): PdfChunk {
  return {
    sourceId,
    documentId: "doc-1",
    documentTitle: "Study notes.pdf",
    page,
    text,
    terms: tokenizeStudyText(text),
  };
}

describe("local PDF retrieval", () => {
  it("splits long pages into bounded overlapping chunks", () => {
    const text = Array.from({ length: 110 }, (_, index) => `word${index}`).join(" ");
    const chunks = splitPageIntoChunks(text, 120, 20);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((part) => part.length <= 120)).toBe(true);
    expect(chunks[0].slice(-20)).toBe(chunks[1].slice(0, 20));
    expect(splitPageIntoChunks("   ")).toEqual([]);
  });

  it("ranks matching passages and preserves source and page references", () => {
    const passages = rankPdfPassages("mitochondria energy", [
      chunk("S1", 2, "The mitochondria produces energy for the cell."),
      chunk("S2", 9, "The history chapter discusses ancient trade routes."),
    ]);

    expect(passages).toHaveLength(1);
    expect(passages[0]).toMatchObject({ sourceId: "S1", documentId: "doc-1", documentTitle: "Study notes.pdf", page: 2 });
  });

  it("returns no evidence for unmatched or stopword-only questions", () => {
    expect(rankPdfPassages("quantum", [chunk("S1", 1, "Classical mechanics")])).toEqual([]);
    expect(rankPdfPassages("what is this", [chunk("S1", 1, "Classical mechanics")])).toEqual([]);
  });

  it("bounds the number and total size of passages returned", () => {
    const chunks = Array.from({ length: 12 }, (_, index) => chunk(`S${index + 1}`, index + 1, `energy cell chemistry ${index} ${"detail ".repeat(250)}`));
    const passages = rankPdfPassages("energy cell", chunks);

    expect(passages.length).toBeLessThanOrEqual(6);
    expect(passages.reduce((total, passage) => total + passage.text.length, 0)).toBeLessThanOrEqual(10_000);
  });
});
