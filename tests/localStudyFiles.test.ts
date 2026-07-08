import { describe, expect, it } from "vitest";
import {
  getSourceMaterialType,
  getStructuredStudyType,
  isSourceMaterialFile,
  isSplitPdfFile,
} from "../src/features/study-materials/localStudyFiles";
import type { LocalStudyFile } from "../src/shared/types/models";

function makeFile(overrides: Partial<LocalStudyFile>): LocalStudyFile {
  return {
    id: "file-1",
    title: "Source PDF",
    fileName: "source.pdf",
    size: 100,
    createdAt: "2026-01-01T00:00:00.000Z",
    data: new Blob([], { type: "application/pdf" }),
    mimeType: "application/pdf",
    fileKind: "pdf",
    ...overrides,
  };
}

describe("local study file classification", () => {
  it("treats explicitly marked split PDFs as Structured Study files", () => {
    const file = makeFile({ fileSource: "split-pdf" });

    expect(isSplitPdfFile(file)).toBe(true);
    expect(isSourceMaterialFile(file)).toBe(false);
  });

  it("recognises legacy split PDFs by generated filename", () => {
    const file = makeFile({
      title: "Cognitive Psychology — pages 4-9",
      fileName: "Cognitive-Psychology-pages-4-9.pdf",
    });

    expect(isSplitPdfFile(file)).toBe(true);
  });

  it("keeps normal source files in Library from Source", () => {
    const file = makeFile({
      title: "Cognitive Psychology",
      fileName: "Cognitive-Psychology.pdf",
      fileSource: "source-material",
    });

    expect(isSplitPdfFile(file)).toBe(false);
    expect(isSourceMaterialFile(file)).toBe(true);
  });

  it("routes source PDFs to Books by default", () => {
    const file = makeFile({ fileSource: "source-material" });

    expect(getSourceMaterialType(file)).toBe("book");
  });

  it("routes explicitly typed split PDFs to the matching Structured Study card", () => {
    const file = makeFile({ fileSource: "split-pdf", materialType: "contents" });

    expect(getStructuredStudyType(file)).toBe("contents");
  });

  it("routes legacy split PDFs without type to sections", () => {
    const file = makeFile({
      title: "Cognitive Psychology — pages 4-9",
      fileName: "Cognitive-Psychology-pages-4-9.pdf",
    });

    expect(getStructuredStudyType(file)).toBe("section");
  });
});
