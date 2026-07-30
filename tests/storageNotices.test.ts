import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  STORAGE_NOTICE_LABEL,
  StorageNotice,
  storageNoticePlacements,
  type StorageNoticeKind,
  type StorageNoticeVariant,
} from "../src/shared/components/StorageNotice";

function renderNotice(
  kind: StorageNoticeKind,
  variant?: StorageNoticeVariant,
): string {
  return renderToStaticMarkup(createElement(StorageNotice, { kind, variant }));
}

describe("local storage notices", () => {
  it("assigns a notice to every important storage entry point", () => {
    expect(storageNoticePlacements).toEqual({
      home: "central",
      materialUpload: "upload",
      contentImport: "contentImport",
      pdfSplitter: "splitter",
      progressBackup: "backup",
    });
  });

  it("renders important storage notices as compact expandable asides by default", () => {
    for (const kind of Object.values(storageNoticePlacements)) {
      const markup = renderNotice(kind);
      expect(markup).toContain("<aside");
      expect(markup).toContain(`aria-label="${STORAGE_NOTICE_LABEL}"`);
      expect(markup).toContain("storage-notice--compact");
      expect(markup).toContain("<details>");
      expect(markup).toContain("Learn more");
    }
  });

  it("keeps the full panel variant available when explicitly requested", () => {
    const markup = renderNotice("upload", "panel");

    expect(markup).not.toContain("storage-notice--compact");
    expect(markup).not.toContain("<details");
    expect(markup).toContain("Files are added to this browser");
  });

  it("renders a short context-specific summary with expandable details", () => {
    expect(renderNotice("upload")).toContain("Files are stored only in this browser.");
    expect(renderNotice("contentImport")).toContain("Study content is stored only in this browser.");
    expect(renderNotice("splitter")).toContain("Split PDFs are stored only in this browser.");
    expect(renderNotice("backup")).toContain("The backup does not include uploaded files.");
  });

  it("states the central storage limitation without calling files temporary", () => {
    const markup = renderNotice("central");

    expect(markup).toContain("not a permanent-storage or backup service");
    expect(markup).toContain("only in this browser");
    expect(markup).not.toContain("temporar");
  });

  it("distinguishes browser import from a server upload", () => {
    const markup = renderNotice("upload");

    expect(markup).toContain("imports a private copy into this browser");
    expect(markup).toContain("not sent to a server");
  });

  it("states that users provide study content", () => {
    const markup = renderNotice("contentImport");

    expect(markup).toContain("You create or import");
    expect(markup).toContain("does not generate study content automatically");
  });

  it("describes persistent local split outputs and the download action", () => {
    const markup = renderNotice("splitter");

    expect(markup).toContain("remain stored here until you remove them");
    expect(markup).toContain("Download any split PDF");
  });

  it("lists the backup boundary in semantic phrases", () => {
    const markup = renderNotice("backup");

    expect(markup).toContain("includes progress");
    expect(markup).toContain("does not include uploaded or generated file copies");
  });
});
