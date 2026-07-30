import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { validateLocalStudyFile } from "../study-materials/localFilePolicy";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

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

export interface AssistantMaterialImportResult {
  text: string;
  truncated: boolean;
}

export class AssistantMaterialImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssistantMaterialImportError";
  }
}

export function limitAssistantMaterialText(text: string): AssistantMaterialImportResult {
  const normalized = text
    .replace(/\r\n?/gu, "\n")
    .replace(/\u0000/gu, "")
    .trim();

  return {
    text: normalized.slice(0, MAX_ASSISTANT_MATERIAL_LENGTH),
    truncated: normalized.length > MAX_ASSISTANT_MATERIAL_LENGTH,
  };
}

async function extractPdfText(file: File): Promise<string> {
  const loadingTask = getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdfDocument = await loadingTask.promise;
  const pages: string[] = [];
  let extractedLength = 0;

  try {
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

      if (extractedLength > MAX_ASSISTANT_MATERIAL_LENGTH) break;
    }
  } finally {
    await pdfDocument.destroy();
  }

  return pages.join("\n\n");
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

  const result = limitAssistantMaterialText(extractedText);
  if (!result.text) {
    throw new AssistantMaterialImportError(
      "No readable text was found in this file. Paste the text manually instead.",
    );
  }

  return result;
}
