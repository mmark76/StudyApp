import { validateLocalStudyFile } from "../study-materials/localFilePolicy";

export const MAX_ASSISTANT_MATERIAL_LENGTH = 12_000;
export const MAX_ASSISTANT_IMPORT_FILE_SIZE = 50 * 1024 * 1024;
export const ASSISTANT_IMPORT_ACCEPT = [
  ".pdf",
  ".txt",
  ".md",
  ".markdown",
  ".csv",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
].join(",");

const MAX_PDF_EXTRACTION_LENGTH = MAX_ASSISTANT_MATERIAL_LENGTH + 4_000;

export interface AssistantMaterialImportResult {
  text: string;
  truncated: boolean;
  preparedInstructionsRemoved?: boolean;
}

export interface PreparedInstructionsUnwrapResult {
  text: string;
  removed: boolean;
}

interface PdfLoadingTaskLike {
  destroy?: () => Promise<void> | void;
}

export class AssistantMaterialImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssistantMaterialImportError";
  }
}

function normalizeAssistantMaterialText(text: string): string {
  return text
    .replace(/\r\n?/gu, "\n")
    .replace(/\u0000/gu, "")
    .trim();
}

export function unwrapStudyAppPreparedInstructions(text: string): PreparedInstructionsUnwrapResult {
  const normalized = normalizeAssistantMaterialText(text);
  const wrappers = [
    {
      heading: /STUDY\s+MATERIAL\s*:\s*/u,
      markers: ["Answer in English", "Use only the study material below"],
    },
    {
      heading: /ΥΛΙΚΟ\s+ΜΕΛΕΤΗΣ\s*:\s*/u,
      markers: ["Απάντησε στα ελληνικά", "Χρησιμοποίησε μόνο το παρακάτω υλικό"],
    },
  ] as const;

  for (const wrapper of wrappers) {
    const headingMatch = wrapper.heading.exec(normalized);
    if (!headingMatch || headingMatch.index === undefined) continue;

    const prefix = normalized.slice(0, headingMatch.index);
    if (!wrapper.markers.every((marker) => prefix.includes(marker))) continue;

    const materialStart = headingMatch.index + headingMatch[0].length;
    const unwrappedMaterial = normalized.slice(materialStart).trim();
    if (!unwrappedMaterial) continue;

    return {
      text: unwrappedMaterial,
      removed: true,
    };
  }

  return {
    text: normalized,
    removed: false,
  };
}

export function limitAssistantMaterialText(text: string): AssistantMaterialImportResult {
  const normalized = normalizeAssistantMaterialText(text);

  return {
    text: normalized.slice(0, MAX_ASSISTANT_MATERIAL_LENGTH),
    truncated: normalized.length > MAX_ASSISTANT_MATERIAL_LENGTH,
  };
}

export async function disposePdfLoadingTask(loadingTask: PdfLoadingTaskLike): Promise<void> {
  if (typeof loadingTask.destroy !== "function") return;

  try {
    await loadingTask.destroy();
  } catch {
    // Cleanup must not replace a successful text extraction with an internal PDF.js error.
  }
}

async function loadPdfReader() {
  const [pdfJs, workerModule] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfJs.GlobalWorkerOptions.workerSrc = workerModule.default;
  return pdfJs.getDocument;
}

async function extractPdfText(file: File): Promise<string> {
  const getDocument = await loadPdfReader();
  const loadingTask = getDocument({ data: new Uint8Array(await file.arrayBuffer()) });

  try {
    const pdfDocument = await loadingTask.promise;
    const pages: string[] = [];
    let extractedLength = 0;

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/gu, " ")
        .trim();

      if (pageText) {
        pages.push(pageText);
        extractedLength += pageText.length + 2;
      }

      if (extractedLength > MAX_PDF_EXTRACTION_LENGTH) break;
    }

    return pages.join("\n\n");
  } finally {
    await disposePdfLoadingTask(loadingTask);
  }
}

export async function extractAssistantMaterial(file: File): Promise<AssistantMaterialImportResult> {
  if (file.size > MAX_ASSISTANT_IMPORT_FILE_SIZE) {
    throw new AssistantMaterialImportError("The selected file is larger than 50 MB.");
  }

  const validated = await validateLocalStudyFile(file);
  let extractedText: string;

  if (validated.format === "pdf") {
    extractedText = await extractPdfText(file);
  } else if (
    validated.format === "txt"
    || validated.format === "markdown"
    || validated.format === "csv"
  ) {
    extractedText = await file.text();
  } else {
    throw new AssistantMaterialImportError(
      "Choose a PDF, TXT, Markdown, or CSV file for text import.",
    );
  }

  const unwrapped = unwrapStudyAppPreparedInstructions(extractedText);
  const result = limitAssistantMaterialText(unwrapped.text);
  if (!result.text) {
    throw new AssistantMaterialImportError(
      "No readable text was found in this file. Paste the text manually instead.",
    );
  }

  return {
    ...result,
    preparedInstructionsRemoved: unwrapped.removed,
  };
}
