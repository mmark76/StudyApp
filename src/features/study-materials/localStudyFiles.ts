import type { LocalStudyFile, LocalStudyFileKind } from "../../shared/types/models";

export const MAX_LOCAL_FILE_SIZE = 50 * 1024 * 1024;

export const SUPPORTED_LOCAL_FILE_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".md",
  ".csv",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
] as const;

const GENERATED_SPLIT_PDF_FILENAME_PATTERN = /-pages-\d+(?:-\d+)?\.pdf$/i;
const GENERATED_SPLIT_PDF_TITLE_PATTERN = /[—-]\s*pages\s+\d+(?:-\d+)?$/i;

export function getLocalStudyFileKind(fileName: string, mimeType = ""): LocalStudyFileKind {
  const lowerName = fileName.toLowerCase();
  const lowerType = mimeType.toLowerCase();

  if (lowerType === "application/pdf" || lowerName.endsWith(".pdf")) return "pdf";
  if (lowerName.endsWith(".doc") || lowerName.endsWith(".docx")) return "document";
  if (lowerType.startsWith("text/") || lowerName.endsWith(".txt") || lowerName.endsWith(".md")) return "text";
  if (lowerType.startsWith("image/") || [".jpg", ".jpeg", ".png", ".gif", ".webp"].some((extension) => lowerName.endsWith(extension))) return "image";
  if (lowerName.endsWith(".csv")) return "spreadsheet";
  return "other";
}

export function isSupportedStudyFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return SUPPORTED_LOCAL_FILE_EXTENSIONS.some((extension) => lowerName.endsWith(extension))
    || file.type === "application/pdf"
    || file.type.startsWith("text/")
    || file.type.startsWith("image/");
}

export function isPdfStudyFile(file: LocalStudyFile): boolean {
  return file.fileKind === "pdf"
    || file.mimeType === "application/pdf"
    || file.fileName.toLowerCase().endsWith(".pdf");
}

export function isSplitPdfFile(file: LocalStudyFile): boolean {
  return file.fileSource === "split-pdf"
    || (isPdfStudyFile(file)
      && (GENERATED_SPLIT_PDF_FILENAME_PATTERN.test(file.fileName)
        || GENERATED_SPLIT_PDF_TITLE_PATTERN.test(file.title)));
}

export function isSourceMaterialFile(file: LocalStudyFile): boolean {
  return !isSplitPdfFile(file);
}

export function formatFileKind(kind?: LocalStudyFileKind): string {
  switch (kind) {
    case "pdf": return "PDF";
    case "document": return "Document";
    case "text": return "Text";
    case "image": return "Image";
    case "spreadsheet": return "Spreadsheet";
    default: return "File";
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function titleFromFileName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/i, "").replace(/[-_]+/g, " ").trim() || "Study file";
}

export function openLocalFile(file: LocalStudyFile): void {
  const blob = file.mimeType ? file.data.slice(0, file.data.size, file.mimeType) : file.data;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.download = file.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
