import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PDFDocument } from "pdf-lib";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { LocalStudyFile } from "../../shared/types/models";
import { createId } from "../../shared/utils/id";
import { formatFileSize, MAX_LOCAL_FILE_SIZE, titleFromFileName } from "./localStudyFiles";
import { normalizeStudyMaterialTitle } from "./studyMaterials";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;


interface RangeRow {
  id: string;
  from: string;
  to: string;
}

interface ValidatedRange {
  label: string;
  pageIndexes: number[];
}

const MAX_SPLIT_RANGES = 50;
const PDF_RENDER_SCALE = 2;
const RENDERED_SPLIT_NOTE = "Saved as a new PDF in StudyApp. You can split each new PDF again if needed.";

function isPdfFile(file: LocalStudyFile): boolean {
  return file.fileKind === "pdf"
    || file.mimeType === "application/pdf"
    || file.fileName.toLowerCase().endsWith(".pdf");
}

function isPdfUpload(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function readPdfText(bytes: ArrayBuffer): string {
  return new TextDecoder("latin1").decode(bytes);
}

function countPdfPageObjects(pdfText: string): number | null {
  const matches = pdfText.match(/\/Type\s*\/Page\b/g);
  return matches?.length ? matches.length : null;
}

function countPdfPageTree(pdfText: string): number | null {
  const counts = Array.from(pdfText.matchAll(/\/Count\s+(\d+)/g), (match) => Number(match[1]))
    .filter((count) => Number.isInteger(count) && count > 0 && count < 100000);
  return counts.length ? Math.max(...counts) : null;
}

function getBestPageCount(
  pdfJsPageCount: number | null,
  pdfLibPageCount: number | null,
  pageTreeCount: number | null,
  objectPageCount: number | null,
): number | null {
  if (pdfJsPageCount) return pdfJsPageCount;
  if (pageTreeCount && pdfLibPageCount && pageTreeCount >= pdfLibPageCount) return pageTreeCount;
  if (objectPageCount && pdfLibPageCount && objectPageCount > pdfLibPageCount) return objectPageCount;
  return pdfLibPageCount ?? pageTreeCount ?? objectPageCount;
}

async function readPdfJsPageCount(bytes: ArrayBuffer): Promise<number | null> {
  try {
    const loadingTask = getDocument({ data: new Uint8Array(bytes.slice(0)) });
    const pdfDocument = await loadingTask.promise;
    const pageCount = pdfDocument.numPages;
    await pdfDocument.destroy();
    return pageCount;
  } catch {
    return null;
  }
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
  if (ranges.length > MAX_SPLIT_RANGES) throw new Error(`Use up to ${MAX_SPLIT_RANGES} chunks at a time.`);

  return ranges.map((range, index) => {
    const from = readPageNumber(range.from, `Chunk ${index + 1} start page`);
    const to = readPageNumber(range.to, `Chunk ${index + 1} end page`);

    if (to < from) throw new Error(`Chunk ${index + 1} ends before it starts.`);
    if (to > pageCount) throw new Error(`Chunk ${index + 1} is outside the PDF. This file has ${pageCount} pages.`);

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

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The page could not be rendered for compatibility splitting."));
    }, type, quality);
  });
}

async function createVectorSplitFiles(
  sourcePdf: PDFDocument,
  validatedRanges: readonly ValidatedRange[],
  outputPrefix: string,
  sourceFileName: string,
): Promise<LocalStudyFile[]> {
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
      fileName: makeSplitFileName(sourceFileName, range.label, index),
      size: outputBlob.size,
      createdAt: new Date().toISOString(),
      data: outputBlob,
      mimeType: "application/pdf",
      fileKind: "pdf",
    });
  }

  return splitFiles;
}

async function createRenderedSplitFiles(
  sourceBytes: ArrayBuffer,
  validatedRanges: readonly ValidatedRange[],
  outputPrefix: string,
  sourceFileName: string,
): Promise<LocalStudyFile[]> {
  const loadingTask = getDocument({ data: new Uint8Array(sourceBytes.slice(0)) });
  const pdfJsDocument = await loadingTask.promise;
  const splitFiles: LocalStudyFile[] = [];

  try {
    for (const [rangeIndex, range] of validatedRanges.entries()) {
      const outputPdf = await PDFDocument.create();

      for (const pageIndex of range.pageIndexes) {
        const sourcePage = await pdfJsDocument.getPage(pageIndex + 1);
        const displayViewport = sourcePage.getViewport({ scale: 1 });
        const renderViewport = sourcePage.getViewport({ scale: PDF_RENDER_SCALE });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(renderViewport.width);
        canvas.height = Math.ceil(renderViewport.height);
        const canvasContext = canvas.getContext("2d", { alpha: false });
        if (!canvasContext) throw new Error("The browser could not create a PDF rendering surface.");
        canvasContext.fillStyle = "white";
        canvasContext.fillRect(0, 0, canvas.width, canvas.height);

        await sourcePage.render({ canvas, canvasContext, viewport: renderViewport }).promise;
        const imageBlob = await canvasToBlob(canvas, "image/jpeg", 0.92);
        const imageBytes = new Uint8Array(await imageBlob.arrayBuffer());
        const image = await outputPdf.embedJpg(imageBytes);
        const outputPage = outputPdf.addPage([displayViewport.width, displayViewport.height]);
        outputPage.drawImage(image, {
          x: 0,
          y: 0,
          width: displayViewport.width,
          height: displayViewport.height,
        });
        sourcePage.cleanup();
        canvas.width = 0;
        canvas.height = 0;
      }

      const outputBytes = await outputPdf.save();
      const outputBlob = bytesToPdfBlob(outputBytes);

      if (outputBlob.size > MAX_LOCAL_FILE_SIZE) {
        throw new Error(`The compatibility output for pages ${range.label} is larger than 50 MB. Try a smaller page range.`);
      }

      splitFiles.push({
        id: createId("file"),
        title: makeTitle(`${outputPrefix} — pages ${range.label}`),
        fileName: makeSplitFileName(sourceFileName, range.label, rangeIndex),
        size: outputBlob.size,
        createdAt: new Date().toISOString(),
        data: outputBlob,
        mimeType: "application/pdf",
        fileKind: "pdf",
      });
    }
  } finally {
    await pdfJsDocument.destroy();
  }

  return splitFiles;
}

export function SplitPdfTool({
  files,
  onMessage,
}: {
  files: readonly LocalStudyFile[];
  onMessage: (message: string) => void;
}) {
  const pdfFiles = useMemo(() => files.filter(isPdfFile), [files]);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileId, setSelectedFileId] = useState("");
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [splitEnginePageCount, setSplitEnginePageCount] = useState<number | null>(null);
  const [pageCountError, setPageCountError] = useState("");
  const [ranges, setRanges] = useState<RangeRow[]>([{ id: makeRangeId(), from: "1", to: "1" }]);
  const [titlePrefix, setTitlePrefix] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [recentSplitCount, setRecentSplitCount] = useState(0);

  const selectedFile = pdfFiles.find((file) => file.id === selectedFileId);
  const hasSplitEngineLimit = Boolean(splitEnginePageCount && pageCount && pageCount > splitEnginePageCount);

  useEffect(() => {
    let cancelled = false;
    setPageCount(null);
    setSplitEnginePageCount(null);
    setPageCountError("");

    async function readPageCount(fileToRead: LocalStudyFile) {
      try {
        const bytes = await fileToRead.data.arrayBuffer();
        let pdfLibPageCount: number | null = null;
        try {
          const pdf = await PDFDocument.load(bytes);
          pdfLibPageCount = pdf.getPageCount();
        } catch {
          pdfLibPageCount = null;
        }

        const pdfJsPageCount = await readPdfJsPageCount(bytes);
        const pdfText = readPdfText(bytes);
        const pageTreeCount = countPdfPageTree(pdfText);
        const objectPageCount = countPdfPageObjects(pdfText);
        const bestPageCount = getBestPageCount(pdfJsPageCount, pdfLibPageCount, pageTreeCount, objectPageCount);
        if (!bestPageCount) throw new Error("No page count could be detected.");

        if (!cancelled) {
          setPageCount(bestPageCount);
          setSplitEnginePageCount(pdfLibPageCount);
          setRanges((currentRanges) => currentRanges.map((range, index) => (
            index === 0 && range.to === "1" ? { ...range, to: String(Math.min(5, bestPageCount)) } : range
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

  async function uploadPdf(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file || isUploading) return;

    if (!isPdfUpload(file)) {
      onMessage("Choose a PDF file to upload for splitting.");
      return;
    }
    if (file.size > MAX_LOCAL_FILE_SIZE) {
      onMessage("The PDF is larger than 50 MB. Split PDF Tool supports local PDFs up to 50 MB.");
      return;
    }
    if (files.some((item) => item.fileName === file.name && item.size === file.size)) {
      const existingFile = files.find((item) => item.fileName === file.name && item.size === file.size && isPdfFile(item));
      if (existingFile) setSelectedFileId(existingFile.id);
      onMessage("This PDF has already been uploaded. It is selected for splitting.");
      return;
    }

    setIsUploading(true);
    try {
      const item: LocalStudyFile = {
        id: createId("file"),
        title: normalizeStudyMaterialTitle(titleFromFileName(file.name)),
        fileName: file.name,
        size: file.size,
        createdAt: new Date().toISOString(),
        data: file.slice(0, file.size, file.type || "application/pdf"),
        mimeType: file.type || "application/pdf",
        fileKind: "pdf",
      };
      await studyDatabase.studyFiles.add(item);
      setSelectedFileId(item.id);
      onMessage("The PDF was uploaded locally and selected for splitting.");
    } catch {
      onMessage("The PDF could not be saved. Your browser may not have enough storage space.");
    } finally {
      setIsUploading(false);
    }
  }

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
    if (!selectedFile || isSplitting) return;

    setRecentSplitCount(0);
    setIsSplitting(true);
    try {
      const sourceBytes = await selectedFile.data.arrayBuffer();
      let sourcePdf: PDFDocument | null = null;
      let enginePageCount = 0;
      try {
        sourcePdf = await PDFDocument.load(sourceBytes);
        enginePageCount = sourcePdf.getPageCount();
      } catch {
        sourcePdf = null;
      }

      const displayPageCount = pageCount ?? enginePageCount;
      if (!displayPageCount) throw new Error("The PDF page count could not be read.");
      const validatedRanges = validateRanges(ranges, displayPageCount);
      const highestRequestedPage = Math.max(...validatedRanges.flatMap((range) => range.pageIndexes)) + 1;
      const canUseVectorEngine = Boolean(sourcePdf && highestRequestedPage <= enginePageCount);
      const outputPrefix = titlePrefix.trim() || selectedFile.title;
      const splitFiles = canUseVectorEngine && sourcePdf
        ? await createVectorSplitFiles(sourcePdf, validatedRanges, outputPrefix, selectedFile.fileName)
        : await createRenderedSplitFiles(sourceBytes, validatedRanges, outputPrefix, selectedFile.fileName);

      await studyDatabase.studyFiles.bulkAdd(splitFiles);
      setRecentSplitCount(splitFiles.length);
      const compatibilityNote = canUseVectorEngine ? "" : ` ${RENDERED_SPLIT_NOTE}`;
      onMessage(splitFiles.length === 1
        ? `Created 1 split PDF: ${splitFiles[0].fileName}.${compatibilityNote}`
        : `Created ${splitFiles.length} split PDFs from ${selectedFile.fileName}.${compatibilityNote}`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "The PDF could not be split.");
    } finally {
      setIsSplitting(false);
    }
  }

  return (
    <form className="material-form" onSubmit={(event) => void submit(event)}>
      <div className="button-row">
        <button className="button secondary" disabled={isUploading} onClick={() => uploadInputRef.current?.click()} type="button">
          {isUploading ? "Uploading PDF..." : "Upload PDF"}
        </button>
        <input
          ref={uploadInputRef}
          accept=".pdf,application/pdf"
          aria-label="Upload PDF for splitting"
          type="file"
          onChange={(event) => void uploadPdf(event)}
          style={{
            blockSize: 1,
            border: 0,
            clipPath: "inset(50%)",
            inlineSize: 1,
            overflow: "hidden",
            padding: 0,
            position: "absolute",
            whiteSpace: "nowrap",
          }}
        />
      </div>

      <label className="field-label">
        PDF saved in StudyApp
        <select required value={selectedFileId} onChange={(event) => { setSelectedFileId(event.target.value); setRecentSplitCount(0); }}>
          <option value="">Choose a local PDF</option>
          {pdfFiles.map((file) => (
            <option key={file.id} value={file.id}>{file.title} · {file.fileName} · {formatFileSize(file.size)}</option>
          ))}
        </select>
      </label>

      {selectedFile ? (
        <div className="stack-md">
          <p className="field-help">
            {pageCount ? `Detected pages: ${pageCount}.` : "Reading page count..."}
            {pageCountError ? ` ${pageCountError}` : ""}
          </p>
          {hasSplitEngineLimit ? (
            <p className="inline-message">
              This PDF has {pageCount} pages. You can split it into up to {MAX_SPLIT_RANGES} chunks at a time. First split the book into chapters. Then choose a chapter PDF and split it again into sections or subchapters.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="stack-md">
        {ranges.map((range, index) => (
          <fieldset className="content-panel" key={range.id} style={{ padding: "1rem" }}>
            <legend>
              Chunk <span className="tag">{index + 1}</span>
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
        Add Chunk
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
        Each chunk creates one new PDF. For a textbook, split by chapters first. Then choose a chapter PDF and split it again by sections or subchapters.
      </p>

      {pdfFiles.length === 0 ? <p className="inline-message">Upload a PDF here or add one in Add / Remove Material, then split it.</p> : null}

      <button className="button primary" disabled={!selectedFile || !pageCount || Boolean(pageCountError) || isSplitting} type="submit">
        {isSplitting ? "Splitting PDF..." : "Split PDF"}
      </button>

      {recentSplitCount > 0 ? (
        <div className="stack-md">
          <Link className="button secondary" to="/library">
            View split PDFs
          </Link>
          <p className="field-help">
            {recentSplitCount} new {recentSplitCount === 1 ? "PDF was" : "PDFs were"} saved in Library.
          </p>
        </div>
      ) : null}
    </form>
  );
}
