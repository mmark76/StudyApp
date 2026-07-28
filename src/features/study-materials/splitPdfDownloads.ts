import type { LocalStudyFile } from "../../shared/types/models";
import {
  LocalFilePolicyError,
  validateStoredLocalStudyFile,
} from "./localFilePolicy";
import { isSplitPdfFile } from "./localStudyFiles";

interface DownloadAnchor {
  download: string;
  href: string;
  rel: string;
  click: () => void;
  remove: () => void;
}

export interface BlobDownloadEnvironment {
  appendAnchor: (anchor: DownloadAnchor) => void;
  createAnchor: () => DownloadAnchor;
  createObjectUrl: (blob: Blob) => string;
  revokeObjectUrl: (url: string) => void;
  scheduleRevoke: (callback: () => void) => void;
}

interface PreparedSplitPdfDownload {
  blob: Blob;
  fileName: string;
}

function getDefaultDownloadEnvironment(): BlobDownloadEnvironment {
  return {
    appendAnchor: (anchor) => document.body.appendChild(anchor as HTMLAnchorElement),
    createAnchor: () => document.createElement("a"),
    createObjectUrl: (blob) => URL.createObjectURL(blob),
    revokeObjectUrl: (url) => URL.revokeObjectURL(url),
    scheduleRevoke: (callback) => window.setTimeout(callback, 0),
  };
}

function sanitizeDownloadFileName(value: string): string {
  return value
    .split(/[\\/]/u)
    .at(-1)
    ?.replace(/[\u0000-\u001f<>:"|?*]/gu, "-")
    .trim() ?? "";
}

export function makeSplitPdfFileName(
  sourceFileName: string,
  rangeLabel: string,
  index: number,
): string {
  const safeSourceName = sanitizeDownloadFileName(sourceFileName);
  const baseName = safeSourceName.replace(/\.pdf$/iu, "").trim() || "study-material";
  const safeRange = rangeLabel.replace(/\D+/gu, "-").replace(/^-|-$/gu, "") || `${index + 1}`;
  return `${baseName}-pages-${safeRange}.pdf`;
}

export function getSplitPdfDownloadFileName(file: LocalStudyFile): string {
  if (!isSplitPdfFile(file)) {
    throw new LocalFilePolicyError("Only split PDF files can be downloaded from this action.");
  }

  const storedName = sanitizeDownloadFileName(file.fileName);
  if (/\.pdf$/iu.test(storedName)) return storedName;

  const fallbackTitle = sanitizeDownloadFileName(file.title).replace(/\.pdf$/iu, "").trim();
  return `${fallbackTitle || "split-pdf"}.pdf`;
}

export function getSplitPdfDownloadTarget(
  files: readonly LocalStudyFile[],
  fileId: string,
): LocalStudyFile | null {
  return files.find((file) => file.id === fileId && isSplitPdfFile(file)) ?? null;
}

export function createLatestSplitDownloadBatch(
  createdFiles: readonly LocalStudyFile[],
): LocalStudyFile[] {
  const seenIds = new Set<string>();
  return createdFiles.filter((file) => {
    if (!isSplitPdfFile(file) || seenIds.has(file.id)) return false;
    seenIds.add(file.id);
    return true;
  });
}

export function replaceLatestSplitDownloadBatch(
  _previousFiles: readonly LocalStudyFile[],
  createdFiles: readonly LocalStudyFile[],
): LocalStudyFile[] {
  return createLatestSplitDownloadBatch(createdFiles);
}

async function prepareSplitPdfDownload(file: LocalStudyFile): Promise<PreparedSplitPdfDownload> {
  const validatedFile = await validateStoredLocalStudyFile(file);
  if (!isSplitPdfFile(file) || validatedFile.format !== "pdf") {
    throw new LocalFilePolicyError("The selected split output is not a valid PDF.");
  }

  return {
    blob: file.data.slice(0, file.data.size, "application/pdf"),
    fileName: getSplitPdfDownloadFileName(file),
  };
}

function triggerBlobDownload(
  preparedDownload: PreparedSplitPdfDownload,
  environment: BlobDownloadEnvironment,
): void {
  const url = environment.createObjectUrl(preparedDownload.blob);

  try {
    const anchor = environment.createAnchor();
    anchor.href = url;
    anchor.download = preparedDownload.fileName;
    anchor.rel = "noopener noreferrer";
    environment.appendAnchor(anchor);
    anchor.click();
    anchor.remove();
  } catch (error) {
    environment.revokeObjectUrl(url);
    throw error;
  }

  environment.scheduleRevoke(() => environment.revokeObjectUrl(url));
}

export async function downloadSplitPdfFile(
  file: LocalStudyFile,
  environment = getDefaultDownloadEnvironment(),
): Promise<string> {
  const preparedDownload = await prepareSplitPdfDownload(file);
  triggerBlobDownload(preparedDownload, environment);
  return preparedDownload.fileName;
}

export async function downloadSplitPdfBatch(
  files: readonly LocalStudyFile[],
  environment = getDefaultDownloadEnvironment(),
): Promise<string[]> {
  const latestFiles = createLatestSplitDownloadBatch(files);
  const preparedDownloads = await Promise.all(latestFiles.map(prepareSplitPdfDownload));
  for (const preparedDownload of preparedDownloads) {
    triggerBlobDownload(preparedDownload, environment);
  }
  return preparedDownloads.map((download) => download.fileName);
}
