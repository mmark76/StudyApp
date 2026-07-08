import type {
  LocalStudyFile,
  LocalStudyFileKind,
  LocalStudyMaterialType,
  SourceMaterialType,
  StructuredStudyType,
} from "../../shared/types/models";

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

export interface MaterialTypeOption<T extends LocalStudyMaterialType> {
  value: T;
  label: string;
  description: string;
}

export const sourceMaterialTypeOptions = [
  { value: "book", label: "Book", description: "A textbook, manual, chapter collection or longer reference work." },
  { value: "article", label: "Article", description: "A web article, magazine piece or focused explanatory resource." },
  { value: "paper", label: "Paper", description: "A research paper, report or evidence-based document." },
  { value: "outsource-note", label: "Outsource Note", description: "External lecture notes, shared notes or imported source notes." },
  { value: "my-note", label: "My Note", description: "Personal notes, observations or working material." },
  { value: "summary", label: "Summary", description: "A condensed summary or overview of study material." },
] as const satisfies readonly MaterialTypeOption<SourceMaterialType>[];

export const structuredStudyTypeOptions = [
  { value: "contents", label: "Contents", description: "The table of contents or high-level map of the material." },
  { value: "chapter", label: "Chapter", description: "A major learning block inside a book, paper or PDF." },
  { value: "section", label: "Section / Paragraph", description: "A smaller focused part inside a chapter." },
  { value: "key-concept", label: "Key Concept", description: "An important idea, definition or principle." },
  { value: "bibliography-reference", label: "Bibliography / Reference", description: "A reference list, bibliography or source trail." },
  { value: "image-diagram", label: "Image / Diagram", description: "A visual, figure, image, diagram or chart." },
] as const satisfies readonly MaterialTypeOption<StructuredStudyType>[];

const GENERATED_SPLIT_PDF_FILENAME_PATTERN = /-pages-\d+(?:-\d+)?\.pdf$/i;
const GENERATED_SPLIT_PDF_TITLE_PATTERN = /[—-]\s*pages\s+\d+(?:-\d+)?$/i;

export function isSourceMaterialType(value: unknown): value is SourceMaterialType {
  return typeof value === "string" && sourceMaterialTypeOptions.some((option) => option.value === value);
}

export function isStructuredStudyType(value: unknown): value is StructuredStudyType {
  return typeof value === "string" && structuredStudyTypeOptions.some((option) => option.value === value);
}

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

export function getSourceMaterialType(file: LocalStudyFile): SourceMaterialType | null {
  return isSourceMaterialType(file.materialType) ? file.materialType : null;
}

export function getStructuredStudyType(file: LocalStudyFile): StructuredStudyType | null {
  return isStructuredStudyType(file.materialType) ? file.materialType : null;
}

export function formatMaterialTypeLabel(type?: LocalStudyMaterialType | null): string {
  if (!type) return "Unclassified";
  return [...sourceMaterialTypeOptions, ...structuredStudyTypeOptions].find((option) => option.value === type)?.label ?? "Unclassified";
}

export function isSupportedStudyFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return SUPPORTED_LOCAL_FILE_EXTENSIONS.some((extension) => lowerName.endsWith(extension))
    || file.type === "application/pdf"
    || file.type.startsWith("text/")
    || file.type.startsWith("image/");
}

export async function computeBlobSha256(blob: Blob, cryptoProvider: Crypto | null | undefined = globalThis.crypto): Promise<string | null> {
  try {
    const subtle = cryptoProvider?.subtle;
    if (!subtle) return null;

    const hash = await subtle.digest("SHA-256", await blob.arrayBuffer());
    return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}

export function findDuplicateLocalStudyFile(
  files: readonly LocalStudyFile[],
  candidate: Pick<LocalStudyFile, "fileName" | "size"> & { contentHash?: string | null },
): LocalStudyFile | undefined {
  if (candidate.contentHash) {
    const hashMatch = files.find((file) => file.contentHash === candidate.contentHash);
    if (hashMatch) return hashMatch;
    return files.find((file) => !file.contentHash && file.fileName === candidate.fileName && file.size === candidate.size);
  }

  return files.find((file) => !file.contentHash && file.fileName === candidate.fileName && file.size === candidate.size);
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
