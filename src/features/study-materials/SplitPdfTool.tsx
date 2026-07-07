import { type FormEvent, useEffect, useMemo, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { LocalStudyFile } from "../../shared/types/models";
import { createId } from "../../shared/utils/id";
import { formatFileSize, MAX_LOCAL_FILE_SIZE } from "./localStudyFiles";
import { normalizeStudyMaterialTitle } from "./studyMaterials";

type SplitTab = "range" | "pages" | "size";
type RangeMode = "custom" | "fixed" | "smart";

interface RangeRow {
  id: string;
  from: string;
  to: string;
}

interface ValidatedRange {
  label: string;
  pageIndexes: number[];
}

const MAX_SPLIT_RANGES = 25;

function isPdfFile(file: LocalStudyFile): boolean {
  return file.fileKind === "pdf"
    || file.mimeType === "application/pdf"
    || file.fileName.toLowerCase().endsWith(".pdf");
}

function readPageNumber(value: string, fieldName: string): number {
  const pageNumber = Number(value.trim());
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    throw new Error(`${fieldName} must be a positive whole number.`);
  }
  return pageNumber;
}

function validateRanges(ranges: readonly RangeRow[], pageCount: number): ValidatedRange[] {
  if (ranges.length === 0) throw new Error("Add at least one range.");
  if (ranges.length > MAX_SPLIT_RANGES) throw new Error(`Use up to ${MAX_SPLIT_RANGES} ranges at a time.`);

  return ranges.map((range, index) => {
    const from = readPageNumber(range.from, `Range ${index + 1} start page`);
    const to = readPageNumber(range.to, `Range ${index + 1} end page`);

    if (to < from) throw new Error(`Range ${index + 1} ends before it starts.`);
    if (to > pageCount) throw new Error(`Range ${index + 1} is outside the PDF. This file has ${pageCount} pages.`);

    return {
      label: from === to ? `${from}` : `${from}-${to}`,
      pageIndexes: Array.from({ length: to - from + 1 }, (_, pageIndex) => from - 1 + pageIndex),
    };
  });
}

function makeSplitFileName(fileName: string, rangeLabel: string, index: number): string {
  const baseName = fileName.replace(/\.pdf$/i, "").trim() || "study-material";
  const safeRange = rangeLabel.replace(/\D+/g, "-").replace(/^-|-$/g, "") || `${index + 1}`;
  return `${baseName}-pages-${safeRange}.pdf`;
}

function makeTitle(value: string): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  const safeLength = normalized.length <= 160 ? normalized : `${normalized.slice(0, 157).trimEnd()}...`;
  return normalizeStudyMaterialTitle(safeLength);
}

function makeRangeId(): string {
  return createId("range");
}

function bytesToPdfBlob(bytes: Uint8Array): Blob {
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Blob([arrayBuffer], { type: "application/pdf" });
}

export function SplitPdfTool({
  files,
  onMessage,
}: {
  files: readonly LocalStudyFile[];
  onMessage: (message: string) => void;
}) {
  const pdfFiles = useMemo(() => files.filter(isPdfFile), [files]);
  const [selectedFileId, setSelectedFileId] = useState("");
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [pageCountError, setPageCountError] = useState("");
  const [activeTab, setActiveTab] = useState<SplitTab>("range");
  const [rangeMode, setRangeMode] = useState<RangeMode>("custom");
  const [ranges, setRanges] = useState<RangeRow[]>([{ id: makeRangeId(), from: "1", to: "1" }]);
  const [titlePrefix, setTitlePrefix] = useState("");
  const [isSplitting, setIsSplitting] = useState(false);

  const selectedFile = pdfFiles.find((file) => file.id === selectedFileId);

  useEffect(() => {
    let cancelled = false;
    setPageCount(null);
    setPageCountError("");

    async function readPageCount(fileToRead: LocalStudyFile) {
      try {
        const bytes = await fileToRead.data.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);
        if (!cancelled) {
          const count = pdf.getPageCount();
          setPageCount(count);
          setRanges((currentRanges) => currentRanges.map((range, index) => (
            index === 0 && range.to === "1" ? { ...range, to: String(Math.min(5, count)) } : range
          )));
        }
      } catch {
        if (!cancelled) setPageCountError("The page count could not be read. The PDF may be encrypted or damaged.");
      }
    }

    if (selectedFile) void readPageCount(selectedFile);

    return () => {
      cancelled = true;
    };
  }, [selectedFile]);

  function updateRange(id: string, field: "from" | "to", value: string) {
    setRanges((currentRanges) => currentRanges.map((range) => (
      range.id === id ? { ...range, [field]: value } : range
    )));
  }

  function addRange() {
    setRanges((currentRanges) => {
      const previous = currentRanges.at(-1);
      const nextFromNumber = previous ? Number(previous.to) + 1 : 1;
      const nextFrom = Number.isInteger(nextFromNumber) && nextFromNumber > 0 ? nextFromNumber : 1;
      const nextTo = pageCount ? Math.min(pageCount, nextFrom + 4) : nextFrom;
      return [...currentRanges, { id: makeRangeId(), from: String(nextFrom), to: String(nextTo) }];
    });
  }

  function removeRange(id: string) {
    setRanges((currentRanges) => currentRanges.length === 1
      ? currentRanges
      : currentRanges.filter((range) => range.id !== id));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile || isSplitting || activeTab !== "range" || rangeMode !== "custom") return;

    setIsSplitting(true);
    try {
      const sourceBytes = await selectedFile.data.arrayBuffer();
      const sourcePdf = await PDFDocument.load(sourceBytes);
      const validatedRanges = validateRanges(ranges, sourcePdf.getPageCount());
      const outputPrefix = titlePrefix.trim() || selectedFile.title;
      const splitFiles: LocalStudyFile[] = [];

      for (const [index, range] of validatedRanges.entries()) {
        const outputPdf = await PDFDocument.create();
        const copiedPages = await outputPdf.copyPages(sourcePdf, range.pageIndexes);
        for (const page of copiedPages) outputPdf.addPage(page);

        const outputBytes = await outputPdf.save();
        const outputBlob = bytesToPdfBlob(outputBytes);

        if (outputBlob.size > MAX_LOCAL_FILE_SIZE) {
          throw new Error(`The generated PDF for pages ${range.label} is larger than 50 MB.`);
        }

        splitFiles.push({
          id: createId("file"),
          title: makeTitle(`${outputPrefix} — pages ${range.label}`),
          fileName: makeSplitFileName(selectedFile.fileName, range.label, index),
          size: outputBlob.size,
          createdAt: new Date().toISOString(),
          data: outputBlob,
          mimeType: "application/pdf",
          fileKind: "pdf",
        });
      }

      await studyDatabase.studyFiles.bulkAdd(splitFiles);
      onMessage(splitFiles.length === 1
        ? `Created 1 split PDF: ${splitFiles[0].fileName}.`
        : `Created ${splitFiles.length} split PDFs from ${selectedFile.fileName}.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "The PDF could not be split.");
    } finally {
      setIsSplitting(false);
    }
  }

  return (
    <form className="material-form" onSubmit={(event) => void submit(event)}>
      <label className="field-label">
        PDF saved on this device
        <select required value={selectedFileId} onChange={(event) => setSelectedFileId(event.target.value)}>
          <option value="">Choose a local PDF</option>
          {pdfFiles.map((file) => (
            <option key={file.id} value={file.id}>{file.title} · {formatFileSize(file.size)}</option>
          ))}
        </select>
      </label>

      {selectedFile ? (
        <p className="field-help">
          {pageCount ? `Detected pages: ${pageCount}.` : "Reading page count..."}
          {pageCountError ? ` ${pageCountError}` : ""}
        </p>
      ) : null}

      <div aria-label="Split type" className="tag-row" role="tablist">
        {([
          ["range", "Range"],
          ["pages", "Pages"],
          ["size", "Size"],
        ] as const).map(([tab, label]) => (
          <button
            aria-selected={activeTab === tab}
            className={activeTab === tab ? "button primary" : "button secondary"}
            disabled={tab !== "range"}
            key={tab}
            onClick={() => setActiveTab(tab)}
            role="tab"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        <p className="eyebrow">Range mode</p>
        <div className="tag-row">
          {([
            ["custom", "Custom"],
            ["fixed", "Fixed"],
            ["smart", "Smart"],
          ] as const).map(([mode, label]) => (
            <button
              aria-pressed={rangeMode === mode}
              className={rangeMode === mode ? "button primary" : "button secondary"}
              disabled={mode !== "custom"}
              key={mode}
              onClick={() => setRangeMode(mode)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="stack-md">
        {ranges.map((range, index) => (
          <fieldset className="content-panel" key={range.id} style={{ padding: "1rem" }}>
            <legend>
              Range <span className="tag">{index + 1}</span>
            </legend>
            <div className="library-grid" style={{ alignItems: "end" }}>
              <label className="field-label">
                from page
                <input
                  min="1"
                  type="number"
                  value={range.from}
                  onChange={(event) => updateRange(range.id, "from", event.target.value)}
                />
              </label>
              <label className="field-label">
                to
                <input
                  min="1"
                  type="number"
                  value={range.to}
                  onChange={(event) => updateRange(range.id, "to", event.target.value)}
                />
              </label>
              <button className="button secondary" disabled={ranges.length === 1} onClick={() => removeRange(range.id)} type="button">
                Remove
              </button>
            </div>
          </fieldset>
        ))}
      </div>

      <button className="button secondary" disabled={ranges.length >= MAX_SPLIT_RANGES} onClick={addRange} type="button">
        Add Range
      </button>

      <label className="field-label">
        Output title prefix
        <input
          maxLength={120}
          type="text"
          value={titlePrefix}
          onChange={(event) => setTitlePrefix(event.target.value)}
          placeholder="Leave empty to use the original PDF title"
        />
      </label>

      <p className="field-help">
        Custom range mode creates one new local PDF for every range. Processing happens only in this browser.
      </p>

      {pdfFiles.length === 0 ? <p className="inline-message">Add a local PDF first, then return here to split it.</p> : null}

      <button className="button primary" disabled={!selectedFile || !pageCount || Boolean(pageCountError) || isSplitting} type="submit">
        {isSplitting ? "Splitting PDF..." : "Split PDF"}
      </button>
    </form>
  );
}
