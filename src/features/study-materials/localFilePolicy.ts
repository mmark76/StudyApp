import type { LocalStudyFile, LocalStudyFileKind } from "../../shared/types/models";

export type SupportedLocalFileFormat =
  | "pdf"
  | "doc"
  | "docx"
  | "txt"
  | "markdown"
  | "csv"
  | "png"
  | "jpeg"
  | "webp"
  | "gif";

export type LocalFileOpenMode = "preview" | "download";

interface LocalFileTypePolicy {
  format: SupportedLocalFileFormat;
  label: string;
  extensions: readonly string[];
  mimeTypes: readonly string[];
  canonicalMimeType: string;
  fileKind: LocalStudyFileKind;
  openMode: LocalFileOpenMode;
  signature?: (bytes: Uint8Array) => boolean;
  rejectActiveText?: boolean;
}

export interface ValidatedLocalStudyFile {
  format: SupportedLocalFileFormat;
  canonicalMimeType: string;
  fileKind: LocalStudyFileKind;
  openMode: LocalFileOpenMode;
}

type LocalFileCandidate = Pick<Blob, "size" | "slice"> & {
  name: string;
  type: string;
};

const SIGNATURE_READ_SIZE = 8192;
const GENERIC_MIME_TYPES = new Set(["", "application/octet-stream", "binary/octet-stream"]);
const BLOCKED_EXTENSIONS = new Set([
  ".app",
  ".bat",
  ".cmd",
  ".com",
  ".cpl",
  ".exe",
  ".hta",
  ".html",
  ".htm",
  ".js",
  ".jse",
  ".mjs",
  ".msi",
  ".ps1",
  ".scr",
  ".svg",
  ".xhtml",
  ".xml",
  ".xsl",
  ".xslt",
]);
const BLOCKED_MIME_TYPES = new Set([
  "application/ecmascript",
  "application/javascript",
  "application/xhtml+xml",
  "application/xml",
  "application/x-msdownload",
  "application/x-sh",
  "image/svg+xml",
  "text/ecmascript",
  "text/html",
  "text/javascript",
  "text/xml",
]);

function hasBytes(bytes: Uint8Array, expected: readonly number[], offset = 0): boolean {
  return expected.every((byte, index) => bytes[offset + index] === byte);
}

function hasPdfHeader(bytes: Uint8Array): boolean {
  const header = [0x25, 0x50, 0x44, 0x46, 0x2d];
  const searchLimit = Math.min(bytes.length - header.length, 1024);
  for (let offset = 0; offset <= searchLimit; offset += 1) {
    if (hasBytes(bytes, header, offset)) return true;
  }
  return false;
}

function hasZipHeader(bytes: Uint8Array): boolean {
  return hasBytes(bytes, [0x50, 0x4b, 0x03, 0x04])
    || hasBytes(bytes, [0x50, 0x4b, 0x05, 0x06])
    || hasBytes(bytes, [0x50, 0x4b, 0x07, 0x08]);
}

const LOCAL_FILE_TYPE_POLICIES: readonly LocalFileTypePolicy[] = [
  {
    format: "pdf",
    label: "PDF",
    extensions: [".pdf"],
    mimeTypes: ["application/pdf", "application/x-pdf"],
    canonicalMimeType: "application/pdf",
    fileKind: "pdf",
    openMode: "preview",
    signature: hasPdfHeader,
  },
  {
    format: "doc",
    label: "Word document",
    extensions: [".doc"],
    mimeTypes: ["application/msword", "application/x-ole-storage"],
    canonicalMimeType: "application/msword",
    fileKind: "document",
    openMode: "download",
    signature: (bytes) => hasBytes(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  },
  {
    format: "docx",
    label: "Word document",
    extensions: [".docx"],
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
      "application/x-zip-compressed",
    ],
    canonicalMimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    fileKind: "document",
    openMode: "download",
    signature: hasZipHeader,
  },
  {
    format: "txt",
    label: "TXT",
    extensions: [".txt"],
    mimeTypes: ["text/plain"],
    canonicalMimeType: "text/plain",
    fileKind: "text",
    openMode: "preview",
    rejectActiveText: true,
  },
  {
    format: "markdown",
    label: "Markdown",
    extensions: [".md"],
    mimeTypes: ["text/markdown", "text/plain"],
    canonicalMimeType: "text/plain",
    fileKind: "text",
    openMode: "preview",
    rejectActiveText: true,
  },
  {
    format: "csv",
    label: "CSV",
    extensions: [".csv"],
    mimeTypes: ["text/csv", "application/csv", "text/plain", "application/vnd.ms-excel"],
    canonicalMimeType: "text/csv",
    fileKind: "spreadsheet",
    openMode: "preview",
    rejectActiveText: true,
  },
  {
    format: "png",
    label: "PNG image",
    extensions: [".png"],
    mimeTypes: ["image/png"],
    canonicalMimeType: "image/png",
    fileKind: "image",
    openMode: "preview",
    signature: (bytes) => hasBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  {
    format: "jpeg",
    label: "JPEG image",
    extensions: [".jpg", ".jpeg"],
    mimeTypes: ["image/jpeg", "image/jpg"],
    canonicalMimeType: "image/jpeg",
    fileKind: "image",
    openMode: "preview",
    signature: (bytes) => hasBytes(bytes, [0xff, 0xd8, 0xff]),
  },
  {
    format: "webp",
    label: "WebP image",
    extensions: [".webp"],
    mimeTypes: ["image/webp"],
    canonicalMimeType: "image/webp",
    fileKind: "image",
    openMode: "preview",
    signature: (bytes) => hasBytes(bytes, [0x52, 0x49, 0x46, 0x46])
      && hasBytes(bytes, [0x57, 0x45, 0x42, 0x50], 8),
  },
  {
    format: "gif",
    label: "GIF image",
    extensions: [".gif"],
    mimeTypes: ["image/gif"],
    canonicalMimeType: "image/gif",
    fileKind: "image",
    openMode: "preview",
    signature: (bytes) => hasBytes(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61])
      || hasBytes(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]),
  },
];

export const SUPPORTED_LOCAL_FILE_EXTENSIONS = LOCAL_FILE_TYPE_POLICIES.flatMap(
  (policy) => [...policy.extensions],
);

export const LOCAL_STUDY_FILE_ACCEPT = SUPPORTED_LOCAL_FILE_EXTENSIONS.join(",");

export class LocalFilePolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocalFilePolicyError";
  }
}

function getFileExtension(fileName: string): string {
  return /\.[^./\\]+$/u.exec(fileName.trim().toLowerCase())?.[0] ?? "";
}

function normalizeMimeType(mimeType: string): string {
  return mimeType.split(";", 1)[0].trim().toLowerCase();
}

function findPolicyByExtension(fileName: string): LocalFileTypePolicy | undefined {
  const extension = getFileExtension(fileName);
  return LOCAL_FILE_TYPE_POLICIES.find((policy) => policy.extensions.includes(extension));
}

function looksLikeActiveWebContent(bytes: Uint8Array): boolean {
  const start = new TextDecoder("utf-8")
    .decode(bytes)
    .replace(/\u0000/gu, "")
    .replace(/^\uFEFF/u, "")
    .trimStart()
    .toLowerCase();

  return /^<!doctype\s+(?:html|svg)\b/u.test(start)
    || /^<\?xml\b/u.test(start)
    || /^<(?:html|svg|script|xsl:stylesheet|xsl:transform)\b/u.test(start);
}

function looksLikeExecutable(bytes: Uint8Array): boolean {
  return hasBytes(bytes, [0x4d, 0x5a])
    || hasBytes(bytes, [0x7f, 0x45, 0x4c, 0x46])
    || hasBytes(bytes, [0xfe, 0xed, 0xfa, 0xce])
    || hasBytes(bytes, [0xfe, 0xed, 0xfa, 0xcf])
    || hasBytes(bytes, [0xcf, 0xfa, 0xed, 0xfe])
    || hasBytes(bytes, [0xce, 0xfa, 0xed, 0xfe]);
}

export async function validateLocalStudyFile(file: LocalFileCandidate): Promise<ValidatedLocalStudyFile> {
  const extension = getFileExtension(file.name);
  const mimeType = normalizeMimeType(file.type);

  if (BLOCKED_EXTENSIONS.has(extension) || BLOCKED_MIME_TYPES.has(mimeType)) {
    throw new LocalFilePolicyError(
      "This file type is not allowed because it may contain executable web content.",
    );
  }

  const policy = findPolicyByExtension(file.name);
  if (!policy) {
    throw new LocalFilePolicyError(
      "Choose a supported study file: PDF, Word, TXT, Markdown, CSV, PNG, JPEG, WebP, or GIF.",
    );
  }

  if (!GENERIC_MIME_TYPES.has(mimeType) && !policy.mimeTypes.includes(mimeType)) {
    throw new LocalFilePolicyError(
      `The file extension and detected browser type do not match for "${file.name}". Choose the original file without renaming it.`,
    );
  }

  const bytes = new Uint8Array(
    await file.slice(0, Math.min(file.size, SIGNATURE_READ_SIZE)).arrayBuffer(),
  );

  if (looksLikeExecutable(bytes)) {
    throw new LocalFilePolicyError("Executable files cannot be stored in StudyApp.");
  }

  if (policy.rejectActiveText && looksLikeActiveWebContent(bytes)) {
    throw new LocalFilePolicyError(
      "This file appears to contain HTML, SVG, or XML and cannot be stored in StudyApp.",
    );
  }

  if (policy.signature && !policy.signature(bytes)) {
    throw new LocalFilePolicyError(
      `The contents of "${file.name}" do not match a ${policy.label} file. Choose the original file without renaming it.`,
    );
  }

  return {
    format: policy.format,
    canonicalMimeType: policy.canonicalMimeType,
    fileKind: policy.fileKind,
    openMode: policy.openMode,
  };
}

export function validateStoredLocalStudyFile(file: LocalStudyFile): Promise<ValidatedLocalStudyFile> {
  return validateLocalStudyFile({
    name: file.fileName,
    type: file.mimeType ?? file.data.type,
    size: file.data.size,
    slice: file.data.slice.bind(file.data),
  });
}

export async function openLocalStudyFile(file: LocalStudyFile): Promise<LocalFileOpenMode> {
  const validatedFile = await validateStoredLocalStudyFile(file);
  const outputMimeType = validatedFile.openMode === "preview"
    ? validatedFile.canonicalMimeType
    : "application/octet-stream";
  const blob = file.data.slice(0, file.data.size, outputMimeType);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.rel = "noopener noreferrer";

  if (validatedFile.openMode === "preview") {
    anchor.target = "_blank";
  } else {
    anchor.download = file.fileName;
  }

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return validatedFile.openMode;
}
