import { describe, expect, it } from "vitest";
import {
  findRelatedSplitPdfFiles,
  getLocalFileDeletionIds,
} from "../src/features/library/localFileDeletion";
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
    fileSource: "source-material",
    ...overrides,
  };
}

describe("local file deletion", () => {
  it("finds no related split PDFs for a source file without children", () => {
    const files = [
      makeFile({ id: "source-1" }),
      makeFile({ id: "other-source" }),
    ];

    expect(findRelatedSplitPdfFiles("source-1", files)).toEqual([]);
  });

  it("detects one or more split PDFs linked to the source file", () => {
    const firstSplit = makeFile({
      id: "split-1",
      title: "Chapter 1",
      fileName: "chapter-1.pdf",
      fileSource: "split-pdf",
      sourceFileId: "source-1",
    });
    const secondSplit = makeFile({
      id: "split-2",
      title: "Chapter 2",
      fileName: "chapter-2.pdf",
      fileSource: "split-pdf",
      sourceFileId: "source-1",
    });
    const unrelatedSplit = makeFile({
      id: "split-3",
      fileSource: "split-pdf",
      sourceFileId: "other-source",
    });

    expect(findRelatedSplitPdfFiles("source-1", [firstSplit, unrelatedSplit, secondSplit])).toEqual([
      firstSplit,
      secondSplit,
    ]);
  });

  it("returns no deletion IDs when the user cancels", () => {
    const split = makeFile({ id: "split-1", fileSource: "split-pdf", sourceFileId: "source-1" });

    expect(getLocalFileDeletionIds("source-1", [split], "cancel")).toEqual([]);
  });

  it("keeps related split PDFs when the user chooses source-only deletion", () => {
    const split = makeFile({ id: "split-1", fileSource: "split-pdf", sourceFileId: "source-1" });

    expect(getLocalFileDeletionIds("source-1", [split], "delete-source-only")).toEqual(["source-1"]);
  });

  it("includes related split PDFs when the user chooses to delete them together", () => {
    const splits = [
      makeFile({ id: "split-1", fileSource: "split-pdf", sourceFileId: "source-1" }),
      makeFile({ id: "split-2", fileSource: "split-pdf", sourceFileId: "source-1" }),
    ];

    expect(getLocalFileDeletionIds("source-1", splits, "delete-source-and-splits")).toEqual([
      "source-1",
      "split-1",
      "split-2",
    ]);
  });
});
