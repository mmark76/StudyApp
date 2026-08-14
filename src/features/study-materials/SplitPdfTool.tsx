import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PDFDocument } from "pdf-lib";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { getStructuredStudyTypeLabel } from "../../i18n/domainLabels";
import { useLanguage } from "../../i18n/LanguageContext";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { LocalStudyFile, StructuredStudyType } from "../../shared/types/models";
import { createId } from "../../shared/utils/id";
import {
  LocalFilePolicyError,
  validateLocalStudyFile,
  validateStoredLocalStudyFile,
} from "./localFilePolicy";
import {
  computeBlobSha256,
  findDuplicateLocalStudyFile,
  formatFileSize,
  isPdfStudyFile,
  isStructuredStudyType,
  MAX_LOCAL_FILE_SIZE,
  structuredStudyTypeOptions,
  titleFromFileName,
} from "./localStudyFiles";
import {
  downloadSplitPdfBatch,
  downloadSplitPdfFile,
  makeSplitPdfFileName,
  replaceLatestSplitDownloadBatch,
} from "./splitPdfDownloads";
import { normalizeStudyMaterialTitle } from "./studyMaterials";
import {
  addRenderedPixelCount,
  addSplitOutputSize,
  assertSplitPageBudget,
} from "./splitPdfLimits";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface RangeRow {
  id: string;
  from: string;
  to: string;
  name: string;
  materialType: StructuredStudyType | "";
}

interface ValidatedRange {
  label: string;
  pageIndexes: number[];
  name: string;
  materialType: StructuredStudyType;
}

const MAX_SPLIT_RANGES = 50;
const PDF_RENDER_SCALE = 2;

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
  const loadingTask = getDocument({ data: new Uint8Array(bytes.slice(0)) });
  let pdfDocument: Awaited<typeof loadingTask.promise> | null = null;
  try {
    pdfDocument = await loadingTask.promise;
    return pdfDocument.numPages;
  } catch {
    return null;
  } finally {
    if (pdfDocument) await pdfDocument.destroy();
    else await loadingTask.destroy();
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

  const validatedRanges = ranges.map((range, index) => {
    const from = readPageNumber(range.from, `Chunk ${index + 1} start page`);
    const to = readPageNumber(range.to, `Chunk ${index + 1} end page`);
    const name = range.name.trim();

    if (to < from) throw new Error(`Chunk ${index + 1} ends before it starts.`);
    if (to > pageCount) throw new Error(`Chunk ${index + 1} is outside the PDF. This file has ${pageCount} pages.`);
    if (name.length === 0) throw new Error(`Chunk ${index + 1} needs a name.`);
    if (!isStructuredStudyType(range.materialType)) throw new Error(`Chunk ${index + 1} needs a structured type.`);

    return {
      label: from === to ? `${from}` : `${from}-${to}`,
      pageIndexes: Array.from({ length: to - from + 1 }, (_, pageIndex) => from - 1 + pageIndex),
      name,
      materialType: range.materialType,
    };
  });
  assertSplitPageBudget(validatedRanges);
  return validatedRanges;
}

function makeTitle(value: string): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  const safeLength = normalized.length <= 160 ? normalized : `${normalized.slice(0, 157).trimEnd()}...`;
  return normalizeStudyMaterialTitle(safeLength);
}

function makeRangeId(): string {
  return createId("range");
}

function makeRangeRow(from = "1", to = "1", materialType: StructuredStudyType | "" = ""): RangeRow {
  return { id: makeRangeId(), from, to, name: "", materialType };
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
  sourceFileName: string,
  sourceFileId: string,
): Promise<LocalStudyFile[]> {
  const splitFiles: LocalStudyFile[] = [];
  let totalOutputSize = 0;

  for (const [index, range] of validatedRanges.entries()) {
    const outputPdf = await PDFDocument.create();
    const copiedPages = await outputPdf.copyPages(sourcePdf, range.pageIndexes);
    for (const page of copiedPages) outputPdf.addPage(page);

    const outputBytes = await outputPdf.save();
    const outputBlob = bytesToPdfBlob(outputBytes);
    if (outputBlob.size > MAX_LOCAL_FILE_SIZE) throw new Error(`The generated PDF for pages ${range.label} is larger than 50 MB.`);
    totalOutputSize = addSplitOutputSize(totalOutputSize, outputBlob.size);

    const contentHash = await computeBlobSha256(outputBlob);
    splitFiles.push({
      id: createId("file"),
      title: makeTitle(range.name),
      fileName: makeSplitPdfFileName(sourceFileName, range.label, index),
      size: outputBlob.size,
      createdAt: new Date().toISOString(),
      data: outputBlob,
      mimeType: "application/pdf",
      fileKind: "pdf",
      fileSource: "split-pdf",
      materialType: range.materialType,
      sourceFileId,
      pageRangeLabel: range.label,
      ...(contentHash ? { contentHash } : {}),
    });
  }

  return splitFiles;
}

async function createRenderedSplitFiles(
  sourceBytes: ArrayBuffer,
  validatedRanges: readonly ValidatedRange[],
  sourceFileName: string,
  sourceFileId: string,
): Promise<LocalStudyFile[]> {
  const loadingTask = getDocument({ data: new Uint8Array(sourceBytes.slice(0)) });
  const pdfJsDocument = await loadingTask.promise;
  const splitFiles: LocalStudyFile[] = [];
  let totalOutputSize = 0;
  let totalRenderedPixels = 0;

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
        totalRenderedPixels = addRenderedPixelCount(
          totalRenderedPixels,
          canvas.width,
          canvas.height,
        );
        const canvasContext = canvas.getContext("2d", { alpha: false });
        if (!canvasContext) throw new Error("The browser could not create a PDF rendering surface.");
        try {
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
        } finally {
          sourcePage.cleanup();
          canvas.width = 0;
          canvas.height = 0;
        }
      }

      const outputBytes = await outputPdf.save();
      const outputBlob = bytesToPdfBlob(outputBytes);
      if (outputBlob.size > MAX_LOCAL_FILE_SIZE) throw new Error(`The compatibility output for pages ${range.label} is larger than 50 MB.`);
      totalOutputSize = addSplitOutputSize(totalOutputSize, outputBlob.size);

      const contentHash = await computeBlobSha256(outputBlob);
      splitFiles.push({
        id: createId("file"),
        title: makeTitle(range.name),
        fileName: makeSplitPdfFileName(sourceFileName, range.label, rangeIndex),
        size: outputBlob.size,
        createdAt: new Date().toISOString(),
        data: outputBlob,
        mimeType: "application/pdf",
        fileKind: "pdf",
        fileSource: "split-pdf",
        materialType: range.materialType,
        sourceFileId,
        pageRangeLabel: range.label,
        ...(contentHash ? { contentHash } : {}),
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
  const { language, text } = useLanguage();
  const pdfFiles = useMemo(() => files.filter(isPdfStudyFile), [files]);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileId, setSelectedFileId] = useState("");
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [splitEnginePageCount, setSplitEnginePageCount] = useState<number | null>(null);
  const [pageCountError, setPageCountError] = useState("");
  const [ranges, setRanges] = useState<RangeRow[]>([makeRangeRow()]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [recentSplitFiles, setRecentSplitFiles] = useState<LocalStudyFile[]>([]);
  const [downloadError, setDownloadError] = useState("");

  const selectedFile = pdfFiles.find((file) => file.id === selectedFileId);
  const hasSplitEngineLimit = Boolean(splitEnginePageCount && pageCount && pageCount > splitEnginePageCount);

  useEffect(() => {
    let cancelled = false;
    setPageCount(null);
    setSplitEnginePageCount(null);
    setPageCountError("");

    async function readPageCount(fileToRead: LocalStudyFile) {
      try {
        const validatedFile = await validateStoredLocalStudyFile(fileToRead);
        if (validatedFile.format !== "pdf") throw new Error("The saved file is not a valid PDF.");
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
        if (!cancelled) setPageCountError(text("The page count could not be read.", "Δεν ήταν δυνατή η ανάγνωση των σελίδων."));
      }
    }

    if (selectedFile) void readPageCount(selectedFile);
    return () => { cancelled = true; };
  }, [selectedFile, text]);

  async function uploadPdf(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file || isUploading) return;

    if (file.size > MAX_LOCAL_FILE_SIZE) {
      onMessage(text("The PDF is larger than 50 MB.", "Το PDF είναι μεγαλύτερο από 50 MB."));
      return;
    }

    setIsUploading(true);
    try {
      const validatedFile = await validateLocalStudyFile(file);
      if (validatedFile.format !== "pdf") {
        onMessage(text("Choose a PDF file.", "Επίλεξε αρχείο PDF."));
        return;
      }
      const contentHash = await computeBlobSha256(file);
      const existingFile = findDuplicateLocalStudyFile(files.filter(isPdfStudyFile), {
        fileName: file.name,
        size: file.size,
        contentHash,
      });
      if (existingFile) {
        setSelectedFileId(existingFile.id);
        onMessage(text("This PDF is already saved and has been selected.", "Το PDF είναι ήδη αποθηκευμένο και επιλέχθηκε."));
        return;
      }

      const item: LocalStudyFile = {
        id: createId("file"),
        title: normalizeStudyMaterialTitle(titleFromFileName(file.name)),
        fileName: file.name,
        size: file.size,
        createdAt: new Date().toISOString(),
        data: file.slice(0, file.size, validatedFile.canonicalMimeType),
        mimeType: validatedFile.canonicalMimeType,
        fileKind: validatedFile.fileKind,
        fileSource: "source-material",
        ...(contentHash ? { contentHash } : {}),
      };
      await studyDatabase.studyFiles.add(item);
      setSelectedFileId(item.id);
      onMessage(text("PDF added and selected.", "Το PDF προστέθηκε και επιλέχθηκε."));
    } catch (error) {
      onMessage(
        language === "en" && error instanceof LocalFilePolicyError
          ? error.message
          : text("The PDF could not be saved.", "Το PDF δεν μπορεί να αποθηκευτεί."),
      );
    } finally {
      setIsUploading(false);
    }
  }

  function updateRange(id: string, field: "from" | "to" | "name" | "materialType", value: string) {
    setRanges((currentRanges) => currentRanges.map((range) => {
      if (range.id !== id) return range;
      if (field === "materialType") return { ...range, materialType: isStructuredStudyType(value) ? value : "" };
      return { ...range, [field]: value };
    }));
  }

  function addRange() {
    setRanges((currentRanges) => {
      const previous = currentRanges.at(-1);
      const nextFromNumber = previous ? Number(previous.to) + 1 : 1;
      const nextFrom = Number.isInteger(nextFromNumber) && nextFromNumber > 0 ? nextFromNumber : 1;
      const nextTo = pageCount ? Math.min(pageCount, nextFrom + 4) : nextFrom;
      return [...currentRanges, makeRangeRow(String(nextFrom), String(nextTo), previous?.materialType ?? "")];
    });
  }

  function removeRange(id: string) {
    setRanges((currentRanges) => currentRanges.length === 1 ? currentRanges : currentRanges.filter((range) => range.id !== id));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile || isSplitting) return;

    setRecentSplitFiles([]);
    setDownloadError("");
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
      const splitFiles = canUseVectorEngine && sourcePdf
        ? await createVectorSplitFiles(sourcePdf, validatedRanges, selectedFile.fileName, selectedFile.id)
        : await createRenderedSplitFiles(sourceBytes, validatedRanges, selectedFile.fileName, selectedFile.id);

      await studyDatabase.studyFiles.bulkAdd(splitFiles);
      setRecentSplitFiles((previousFiles) => replaceLatestSplitDownloadBatch(previousFiles, splitFiles));
      onMessage(text(
        `Created ${splitFiles.length} split PDF${splitFiles.length === 1 ? "" : "s"}.`,
        `Δημιουργήθηκαν ${splitFiles.length} χωρισμένα PDF.`,
      ));
    } catch (error) {
      onMessage(
        language === "en" && error instanceof Error
          ? error.message
          : text("The PDF could not be split.", "Το PDF δεν μπορεί να διαχωριστεί."),
      );
    } finally {
      setIsSplitting(false);
    }
  }

  async function downloadRecentSplit(file: LocalStudyFile) {
    setDownloadError("");
    try {
      await downloadSplitPdfFile(file);
      onMessage(text("Download started.", "Η λήψη ξεκίνησε."));
    } catch {
      setDownloadError(text("The PDF could not be downloaded.", "Το PDF δεν μπορεί να κατέβει."));
    }
  }

  async function downloadAllRecentSplits() {
    setDownloadError("");
    try {
      const fileNames = await downloadSplitPdfBatch(recentSplitFiles);
      onMessage(text(`Started ${fileNames.length} downloads.`, `Ξεκίνησαν ${fileNames.length} λήψεις.`));
    } catch {
      setDownloadError(text("The PDFs could not be downloaded.", "Τα PDF δεν μπορούν να κατέβουν."));
    }
  }

  return (
    <form className="material-form" onSubmit={(event) => void submit(event)}>
      <div className="button-row">
        <button className="button secondary" disabled={isUploading} onClick={() => uploadInputRef.current?.click()} type="button">
          {isUploading ? text("Adding PDF...", "Προσθήκη PDF...") : text("Add PDF from device", "Προσθήκη PDF από τη συσκευή")}
        </button>
        <input
          ref={uploadInputRef}
          accept=".pdf,application/pdf"
          aria-label={text("Add a PDF for splitting", "Προσθήκη PDF για διαχωρισμό")}
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
        {text("PDF stored in this browser", "PDF αποθηκευμένο στον browser")}
        <select required value={selectedFileId} onChange={(event) => {
          setSelectedFileId(event.target.value);
          setRecentSplitFiles([]);
          setDownloadError("");
        }}>
          <option value="">{text("Choose a PDF", "Επίλεξε PDF")}</option>
          {pdfFiles.map((file) => (
            <option key={file.id} value={file.id}>{file.title} · {file.fileName} · {formatFileSize(file.size)}</option>
          ))}
        </select>
      </label>

      {selectedFile ? (
        <div className="stack-md">
          <p className="field-help">
            {pageCount ? text(`Detected pages: ${pageCount}.`, `Σελίδες: ${pageCount}.`) : text("Reading pages...", "Ανάγνωση σελίδων...")}
            {pageCountError ? ` ${pageCountError}` : ""}
          </p>
          {hasSplitEngineLimit ? <p className="inline-message">{text("Split the PDF into smaller chunks first.", "Διαχώρισε πρώτα το PDF σε μικρότερα μέρη.")}</p> : null}
        </div>
      ) : null}

      <div className="stack-md">
        {ranges.map((range, index) => (
          <fieldset className="content-panel" key={range.id} style={{ padding: "1rem" }}>
            <legend>{text("Chunk", "Μέρος")} <span className="tag">{index + 1}</span></legend>
            <div className="library-grid" style={{ alignItems: "end" }}>
              <label className="field-label">
                {text("From page", "Από σελίδα")}
                <input min="1" type="number" value={range.from} onChange={(event) => updateRange(range.id, "from", event.target.value)} />
              </label>
              <label className="field-label">
                {text("To page", "Έως σελίδα")}
                <input min="1" type="number" value={range.to} onChange={(event) => updateRange(range.id, "to", event.target.value)} />
              </label>
              <label className="field-label">
                {text("Name", "Όνομα")}
                <input
                  required
                  maxLength={160}
                  type="text"
                  value={range.name}
                  onChange={(event) => updateRange(range.id, "name", event.target.value)}
                  placeholder={text("Example: Chapter 1", "Παράδειγμα: Κεφάλαιο 1")}
                />
              </label>
              <label className="field-label">
                {text("Type", "Τύπος")}
                <select required value={range.materialType} onChange={(event) => updateRange(range.id, "materialType", event.target.value)}>
                  <option value="">{text("Choose type", "Επίλεξε τύπο")}</option>
                  {structuredStudyTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{getStructuredStudyTypeLabel(option.value, language)}</option>
                  ))}
                </select>
              </label>
              <button className="button secondary" disabled={ranges.length === 1} onClick={() => removeRange(range.id)} type="button">
                {text("Remove", "Αφαίρεση")}
              </button>
            </div>
          </fieldset>
        ))}
      </div>

      <button className="button secondary" disabled={ranges.length >= MAX_SPLIT_RANGES} onClick={addRange} type="button">
        {text("Add chunk", "Προσθήκη μέρους")}
      </button>

      {pdfFiles.length === 0 ? <p className="inline-message">{text("Add a PDF to begin.", "Πρόσθεσε PDF για να ξεκινήσεις.")}</p> : null}

      <button className="button primary" disabled={!selectedFile || !pageCount || Boolean(pageCountError) || isSplitting} type="submit">
        {isSplitting ? text("Splitting PDF...", "Διαχωρισμός PDF...") : text("Split PDF", "Διαχωρισμός PDF")}
      </button>

      {recentSplitFiles.length > 0 ? (
        <section className="template-card stack-md" aria-labelledby="latest-split-downloads-title">
          <div>
            <p className="eyebrow">{text("Latest split", "Τελευταίος διαχωρισμός")}</p>
            <h4 id="latest-split-downloads-title">{text("Download new PDFs", "Λήψη νέων PDF")}</h4>
          </div>
          <ul className="local-file-list">
            {recentSplitFiles.map((file) => (
              <li className="local-file-row" key={file.id}>
                <div>
                  <strong>{file.title}</strong>
                  <span>{file.fileName}{file.pageRangeLabel ? ` · ${text("pages", "σελίδες")} ${file.pageRangeLabel}` : ""}</span>
                </div>
                <div className="local-file-actions">
                  <button className="button secondary compact-square" onClick={() => void downloadRecentSplit(file)} type="button">
                    {text("Download", "Λήψη")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {recentSplitFiles.length > 1 ? (
            <button className="button primary" onClick={() => void downloadAllRecentSplits()} type="button">
              {text("Download all", "Λήψη όλων")}
            </button>
          ) : null}
          <Link className="button secondary" to="/study/theory">{text("View split PDFs", "Προβολή χωρισμένων PDF")}</Link>
          {downloadError ? <p className="inline-message" role="alert">{downloadError}</p> : null}
        </section>
      ) : null}
    </form>
  );
}
