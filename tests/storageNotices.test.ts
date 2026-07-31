import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  STORAGE_NOTICE_LABEL,
  StorageNotice,
  greekStorageNoticeText,
  storageNoticePlacements,
  storageNoticeText,
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

  it("renders equivalent context-specific summaries", () => {
    expect(renderNotice("upload")).toContain(
      "Files are stored locally in this browser and device.",
    );
    expect(renderNotice("contentImport")).toContain(
      "Study content is stored locally in this browser and device.",
    );
    expect(renderNotice("splitter")).toContain(
      "Split PDFs are stored locally in this browser and device.",
    );
    expect(renderNotice("backup")).toContain(
      "The JSON backup excludes uploaded and generated files.",
    );
  });

  it("states the central storage limitation without implying a security problem", () => {
    const markup = renderNotice("central");

    expect(markup).toContain(
      "not a permanent-storage service or a complete backup service",
    );
    expect(markup).toContain("locally in this browser and device");
    expect(markup).not.toContain("temporar");
    expect(markup).not.toContain("unsafe");
  });

  it("distinguishes browser import from a server upload", () => {
    const markup = renderNotice("upload");

    expect(markup).toContain("imports a private copy into this browser");
    expect(markup).toContain("not sent to a server");
  });

  it("states that users provide study content", () => {
    const markup = renderNotice("contentImport");

    expect(markup).toContain("you create or import");
    expect(markup).toContain("does not generate content automatically");
  });

  it("describes persistent local split outputs and the download action", () => {
    const markup = renderNotice("splitter");

    expect(markup).toContain("remain here until you remove them");
    expect(markup).toContain("Download split PDFs");
  });

  it("lists the backup boundary in semantic phrases", () => {
    const markup = renderNotice("backup");

    expect(markup).toContain("includes progress");
    expect(markup).toContain(
      "does not include uploaded or generated file copies",
    );
  });

  it("keeps every material storage limitation equivalent in English and Greek", () => {
    for (const kind of Object.values(storageNoticePlacements)) {
      const english = storageNoticeText[kind].body
        .replaceAll("-", " ")
        .toLowerCase();
      const greek = greekStorageNoticeText[kind].body;

      expect(english).toContain("browser and device");
      expect(english).toContain("site data is cleared");
      expect(english).toContain("browser or device fails");
      expect(english).toContain("permanent storage");
      expect(english).toContain("complete backup");
      expect(english).toContain("json backup");
      expect(english).toContain("available storage");
      expect(english).toContain("outside studyapp");

      expect(greek).toContain("browser και τη συσκευή");
      expect(greek).toContain("δεδομένα ιστοτόπου");
      expect(greek).toContain("βλάβη");
      expect(greek).toContain("μόνιμης αποθήκευσης");
      expect(greek).toContain("πλήρ");
      expect(greek).toContain("JSON backup");
      expect(greek).toContain("διαθέσιμος χώρος");
      expect(greek).toContain("εκτός StudyApp");
    }
  });
});
