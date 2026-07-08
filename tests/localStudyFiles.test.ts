import { describe, expect, it } from "vitest";
import {
  computeBlobSha256,
  findDuplicateLocalStudyFile,
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

  it("leaves source files unclassified when the user has not chosen a source type", () => {
    const file = makeFile({ fileSource: "source-material" });

    expect(getSourceMaterialType(file)).toBeNull();
  });

  it("routes explicitly typed source files to the matching Library card", () => {
    const file = makeFile({ fileSource: "source-material", materialType: "book" });

    expect(getSourceMaterialType(file)).toBe("book");
  });

  it("routes explicitly typed split PDFs to the matching Structured Study card", () => {
    const file = makeFile({ fileSource: "split-pdf", materialType: "contents" });

    expect(getStructuredStudyType(file)).toBe("contents");
  });

  it("leaves legacy split PDFs unclassified until the user chooses a structured type", () => {
    const file = makeFile({
      title: "Cognitive Psychology — pages 4-9",
      fileName: "Cognitive-Psychology-pages-4-9.pdf",
    });

    expect(getStructuredStudyType(file)).toBeNull();
  });

  it("computes a stable SHA-256 hash for local file content", async () => {
    const hash = await computeBlobSha256(new Blob(["hello"]));

    expect(hash).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
  });

  it("returns null when Web Crypto hashing is unavailable", async () => {
    await expect(computeBlobSha256(new Blob(["hello"]), null)).resolves.toBeNull();
  });

  it("prefers content hashes for duplicate detection", () => {
    const original = makeFile({
      id: "file-original",
      fileName: "first-name.pdf",
      size: 100,
      contentHash: "same-content",
    });
    const sameMetadataDifferentHash = makeFile({
      id: "file-different",
      fileName: "duplicate-name.pdf",
      size: 200,
      contentHash: "different-content",
    });

    expect(findDuplicateLocalStudyFile([original, sameMetadataDifferentHash], {
      fileName: "duplicate-name.pdf",
      size: 200,
      contentHash: "same-content",
    })).toBe(original);
  });

  it("uses name and size fallback for legacy files without hashes", () => {
    const legacy = makeFile({
      id: "legacy-file",
      fileName: "legacy.pdf",
      size: 200,
    });
    const hashedDifferentContent = makeFile({
      id: "hashed-file",
      fileName: "legacy.pdf",
      size: 200,
      contentHash: "different-content",
    });

    expect(findDuplicateLocalStudyFile([hashedDifferentContent, legacy], {
      fileName: "legacy.pdf",
      size: 200,
      contentHash: "new-content",
    })).toBe(legacy);
  });

  it("does not use name and size fallback against hashed files", () => {
    const hashedDifferentContent = makeFile({
      id: "hashed-file",
      fileName: "same-name.pdf",
      size: 200,
      contentHash: "different-content",
    });

    expect(findDuplicateLocalStudyFile([hashedDifferentContent], {
      fileName: "same-name.pdf",
      size: 200,
      contentHash: "new-content",
    })).toBeUndefined();
  });
});
