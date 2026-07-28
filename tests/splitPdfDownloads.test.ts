import { describe, expect, it, vi } from "vitest";
import {
  createLatestSplitDownloadBatch,
  downloadSplitPdfBatch,
  downloadSplitPdfFile,
  getSplitPdfDownloadFileName,
  getSplitPdfDownloadTarget,
  makeSplitPdfFileName,
  replaceLatestSplitDownloadBatch,
  type BlobDownloadEnvironment,
} from "../src/features/study-materials/splitPdfDownloads";
import type { LocalStudyFile } from "../src/shared/types/models";

function makeFile(overrides: Partial<LocalStudyFile> = {}): LocalStudyFile {
  return {
    id: "split-1",
    title: "Chapter 1",
    fileName: "source-pages-1-2.pdf",
    size: 8,
    createdAt: "2026-07-28T10:00:00.000Z",
    data: new Blob(["%PDF-1.7"], { type: "application/pdf" }),
    mimeType: "application/pdf",
    fileKind: "pdf",
    fileSource: "split-pdf",
    sourceFileId: "source-1",
    pageRangeLabel: "1-2",
    materialType: "chapter",
    ...overrides,
  };
}

function makeDownloadEnvironment() {
  const anchors: Array<{
    download: string;
    href: string;
    rel: string;
    click: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  }> = [];
  const blobs: Blob[] = [];
  const scheduledCallbacks: Array<() => void> = [];
  const revokeObjectUrl = vi.fn();

  const environment: BlobDownloadEnvironment = {
    appendAnchor: vi.fn(),
    createAnchor: () => {
      const anchor = {
        download: "",
        href: "",
        rel: "",
        click: vi.fn(),
        remove: vi.fn(),
      };
      anchors.push(anchor);
      return anchor;
    },
    createObjectUrl: (blob) => {
      blobs.push(blob);
      return `blob:split-${blobs.length}`;
    },
    revokeObjectUrl,
    scheduleRevoke: (callback) => scheduledCallbacks.push(callback),
  };

  return {
    anchors,
    blobs,
    environment,
    revokeObjectUrl,
    scheduledCallbacks,
  };
}

describe("split PDF download filenames and selection", () => {
  it("creates the stored output filename from the source PDF and page range", () => {
    expect(makeSplitPdfFileName("Cognitive Psychology.pdf", "12-18", 0))
      .toBe("Cognitive Psychology-pages-12-18.pdf");
  });

  it("uses a safe PDF filename for a split output", () => {
    const file = makeFile({ fileName: String.raw`folder\Chapter: One?.pdf` });

    expect(getSplitPdfDownloadFileName(file)).toBe("Chapter- One-.pdf");
  });

  it("selects only the requested split PDF", () => {
    const requested = makeFile({ id: "split-requested" });
    const other = makeFile({ id: "split-other" });
    const source = makeFile({
      id: "source",
      title: "Original source",
      fileName: "source.pdf",
      fileSource: "source-material",
    });

    expect(getSplitPdfDownloadTarget([other, source, requested], "split-requested")).toBe(requested);
    expect(getSplitPdfDownloadTarget([source], "source")).toBeNull();
  });

  it("deduplicates the latest output list and excludes non-split files", () => {
    const first = makeFile({ id: "split-new-1" });
    const second = makeFile({ id: "split-new-2" });
    const source = makeFile({
      id: "source",
      title: "Original source",
      fileName: "source.pdf",
      fileSource: "source-material",
    });

    expect(createLatestSplitDownloadBatch([first, source, first, second])).toEqual([first, second]);
  });

  it("replaces older outputs instead of appending them to Download all", () => {
    const oldOutput = makeFile({ id: "split-old" });
    const latestFirst = makeFile({ id: "split-new-1" });
    const latestSecond = makeFile({ id: "split-new-2" });

    expect(replaceLatestSplitDownloadBatch(
      [oldOutput],
      [latestFirst, latestSecond],
    )).toEqual([latestFirst, latestSecond]);
  });
});

describe("split PDF Blob downloads", () => {
  it("downloads the selected PDF and revokes its Blob URL after the click turn", async () => {
    const file = makeFile();
    const context = makeDownloadEnvironment();

    await expect(downloadSplitPdfFile(file, context.environment))
      .resolves.toBe("source-pages-1-2.pdf");

    expect(context.blobs).toHaveLength(1);
    expect(context.blobs[0].type).toBe("application/pdf");
    expect(context.anchors[0]).toMatchObject({
      download: "source-pages-1-2.pdf",
      href: "blob:split-1",
      rel: "noopener noreferrer",
    });
    expect(context.anchors[0].click).toHaveBeenCalledOnce();
    expect(context.anchors[0].remove).toHaveBeenCalledOnce();
    expect(context.revokeObjectUrl).not.toHaveBeenCalled();

    context.scheduledCallbacks[0]();
    expect(context.revokeObjectUrl).toHaveBeenCalledWith("blob:split-1");
  });

  it("downloads exactly the latest unique split outputs", async () => {
    const latestFirst = makeFile({
      id: "split-new-1",
      fileName: "source-pages-1.pdf",
    });
    const latestSecond = makeFile({
      id: "split-new-2",
      fileName: "source-pages-2.pdf",
    });
    const context = makeDownloadEnvironment();

    await expect(downloadSplitPdfBatch(
      [latestFirst, latestFirst, latestSecond],
      context.environment,
    )).resolves.toEqual(["source-pages-1.pdf", "source-pages-2.pdf"]);

    expect(context.anchors.map((anchor) => anchor.download)).toEqual([
      "source-pages-1.pdf",
      "source-pages-2.pdf",
    ]);
    expect(context.anchors.every((anchor) => anchor.click.mock.calls.length === 1)).toBe(true);
  });

  it("rejects a source PDF passed to the split-output action", async () => {
    const source = makeFile({
      title: "Original source",
      fileName: "source.pdf",
      fileSource: "source-material",
    });
    const context = makeDownloadEnvironment();

    await expect(downloadSplitPdfFile(source, context.environment))
      .rejects.toThrow("not a valid PDF");
    expect(context.anchors).toHaveLength(0);
  });
});
