import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { validateStoredLocalStudyFile } from "../study-materials/localFilePolicy";
import { isPdfStudyFile } from "../study-materials/localStudyFiles";
import type { LocalStudyFile } from "../../shared/types/models";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const MAX_RAG_PDF_PAGES = 800;
export const MAX_RAG_SELECTED_PDFS = 8;
export const MAX_RAG_CHUNK_CHARACTERS = 1_200;
export const MAX_RAG_PASSAGES = 6;
export const MAX_RAG_CONTEXT_CHARACTERS = 10_000;

export interface PdfPassage {
  sourceId: string;
  documentId: string;
  documentTitle: string;
  page: number;
  text: string;
}

export interface PdfChunk extends PdfPassage {
  terms: string[];
}

const TOKEN_PATTERN = /[\p{L}\p{N}]{2,}/gu;
const STOP_WORDS = new Set([
  "about", "after", "again", "also", "because", "before", "between", "could", "does", "from", "have", "into", "more", "most", "other", "should", "that", "their", "there", "these", "they", "this", "those", "through", "under", "very", "what", "when", "where", "which", "while", "with", "would",
  "από", "αυτή", "αυτό", "αυτός", "για", "δεν", "είναι", "και", "με", "μια", "που", "στο", "στη", "στην", "των", "την", "της", "το", "τα", "τις", "τους",
]);

export function tokenizeStudyText(value: string): string[] {
  return (value.toLocaleLowerCase().match(TOKEN_PATTERN) ?? [])
    .filter((term) => !STOP_WORDS.has(term));
}

export function splitPageIntoChunks(
  text: string,
  maxCharacters = MAX_RAG_CHUNK_CHARACTERS,
  overlapCharacters = 160,
): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized || maxCharacters < 1 || overlapCharacters < 0 || overlapCharacters >= maxCharacters) return [];
  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    let end = Math.min(normalized.length, start + maxCharacters);
    if (end < normalized.length) {
      const boundary = normalized.lastIndexOf(" ", end);
      if (boundary > start + Math.floor(maxCharacters * 0.6)) end = boundary;
    }
    const chunk = normalized.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= normalized.length) break;
    start = Math.max(start + 1, end - overlapCharacters);
  }
  return chunks;
}

export function rankPdfPassages(query: string, chunks: readonly PdfChunk[], limit = MAX_RAG_PASSAGES): PdfPassage[] {
  const queryTerms = [...new Set(tokenizeStudyText(query))];
  if (!queryTerms.length || !Number.isInteger(limit) || limit < 1) return [];
  const documentFrequency = new Map<string, number>();
  for (const chunk of chunks) {
    for (const term of new Set(chunk.terms)) documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
  }
  const scored = chunks.map((chunk, index) => {
    const frequencies = new Map<string, number>();
    for (const term of chunk.terms) frequencies.set(term, (frequencies.get(term) ?? 0) + 1);
    let score = 0;
    for (const term of queryTerms) {
      const frequency = frequencies.get(term) ?? 0;
      if (frequency) score += (1 + Math.log(frequency)) * Math.log(1 + chunks.length / (documentFrequency.get(term) ?? 1));
    }
    return { chunk, index, score };
  }).filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit);
  const selected: PdfPassage[] = [];
  let remaining = MAX_RAG_CONTEXT_CHARACTERS;
  for (const { chunk } of scored) {
    if (remaining <= 0) break;
    const text = chunk.text.slice(0, remaining).trim();
    if (!text) continue;
    selected.push({ sourceId: chunk.sourceId, documentId: chunk.documentId, documentTitle: chunk.documentTitle, page: chunk.page, text });
    remaining -= text.length;
  }
  return selected;
}

export async function extractPdfChunks(files: readonly LocalStudyFile[]): Promise<PdfChunk[]> {
  if (files.length < 1 || files.length > MAX_RAG_SELECTED_PDFS) {
    throw new Error(`Select between one and ${MAX_RAG_SELECTED_PDFS} PDFs.`);
  }
  const chunks: PdfChunk[] = [];
  for (const candidate of files) {
    const validated = await validateStoredLocalStudyFile(candidate);
    if (validated.format !== "pdf" || !isPdfStudyFile(candidate)) {
      throw new Error("Only selected PDF files can be used.");
    }
    const loadingTask = getDocument({ data: new Uint8Array(await candidate.data.arrayBuffer()) });
    try {
      const document = await loadingTask.promise;
      if (document.numPages > MAX_RAG_PDF_PAGES) {
        throw new Error(`${candidate.title} has more than ${MAX_RAG_PDF_PAGES} pages. Select a smaller PDF.`);
      }
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => "str" in item && typeof item.str === "string" ? item.str : "").join(" ");
        for (const text of splitPageIntoChunks(pageText)) {
          chunks.push({
            sourceId: `S${chunks.length + 1}`,
            documentId: candidate.id,
            documentTitle: candidate.title,
            page: pageNumber,
            text,
            terms: tokenizeStudyText(text),
          });
        }
      }
    } finally {
      await loadingTask.destroy();
    }
  }
  return chunks;
}
