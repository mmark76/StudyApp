import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { LocalStudyFile, StudyUnit } from "../../shared/types/models";
import { validateStoredLocalStudyFile } from "../study-materials/localFilePolicy";
import { extractOfficeTextParts } from "../workspace-beta/officeTextExtraction";
import { parseGeneratedSummary, type SummaryDraft } from "./summaryService";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface SummaryLimits {
  maxFileBytes: number;
  maxJobBytes: number;
  maxChunkCharacters: number;
  maxCombineCharacters: number;
}

function configuredBytes(value: string | undefined, name: string): number {
  if (value === undefined || value === "") return 50_000_000;
  const megabytes = Number(value);
  if (!Number.isSafeInteger(megabytes) || megabytes < 1 || megabytes > 500) {
    throw new Error(`${name} must be a whole number from 1 to 500 MB.`);
  }
  return megabytes * 1_000_000;
}

export const DEFAULT_SUMMARY_LIMITS: SummaryLimits = {
  maxFileBytes: configuredBytes(import.meta.env.VITE_SUMMARY_MAX_FILE_MB, "Summary file limit"),
  maxJobBytes: configuredBytes(import.meta.env.VITE_SUMMARY_MAX_JOB_MB, "Summary job limit"),
  // A conservative input budget leaves room for instructions and output even
  // when the account's model catalog does not publish a context-window size.
  maxChunkCharacters: 4_000,
  maxCombineCharacters: 6_000,
};

export interface SummaryChunk {
  sourceId: string;
  documentId: string;
  documentTitle: string;
  page: number;
  section: string;
  citation: string;
  text: string;
}

export interface SummaryCoverage {
  sourceId: string;
  documentTitle: string;
  page: number;
  section: string;
  status: "readable" | "no-text" | "failed";
  chunks: number;
  characters: number;
  reason?: string;
}

export interface PreparedSummaryJob {
  chunks: SummaryChunk[];
  coverage: SummaryCoverage[];
  sources: SummaryDraft["sources"];
  complete: boolean;
  bytes: number;
}

export type SummaryInput = { kind: "file"; file: LocalStudyFile } | { kind: "unit"; unit: StudyUnit };
export type SummaryProgress = { phase: "extract" | "summarize" | "combine"; completed: number; total: number };
export type SummaryRequest = (phase: "extract" | "combine", parts: readonly SummaryChunk[]) => Promise<string>;

function checkLimits(inputs: readonly SummaryInput[], limits: SummaryLimits): number {
  if (!inputs.length) throw new Error("Select at least one source.");
  if (!Number.isSafeInteger(limits.maxFileBytes) || limits.maxFileBytes < 1
    || !Number.isSafeInteger(limits.maxJobBytes) || limits.maxJobBytes < 1
    || !Number.isSafeInteger(limits.maxChunkCharacters) || limits.maxChunkCharacters < 100
    || !Number.isSafeInteger(limits.maxCombineCharacters) || limits.maxCombineCharacters < 100) {
    throw new Error("Invalid summary processing limits.");
  }
  let bytes = 0;
  for (const input of inputs) {
    if (input.kind === "unit") {
      bytes += new TextEncoder().encode([...input.unit.objectives, ...input.unit.summary, ...input.unit.keyTerms].join("\n")).byteLength;
      if (bytes > limits.maxJobBytes) throw new Error(`The selected sources exceed the ${Math.floor(limits.maxJobBytes / 1_000_000)} MB job limit.`);
      continue;
    }
    const { file } = input;
    if (!Number.isSafeInteger(file.size) || file.size !== file.data.size || file.size > limits.maxFileBytes) {
      throw new Error(`${file.title} exceeds the ${Math.floor(limits.maxFileBytes / 1_000_000)} MB file limit or has an invalid size.`);
    }
    bytes += file.size;
    if (bytes > limits.maxJobBytes) throw new Error(`The selected sources exceed the ${Math.floor(limits.maxJobBytes / 1_000_000)} MB job limit.`);
  }
  return bytes;
}

/** Partitions every UTF-16 code unit once, without relevance selection or truncation. */
export function splitCompleteText(value: string, maxCharacters: number): string[] {
  if (!Number.isSafeInteger(maxCharacters) || maxCharacters < 2) throw new Error("Invalid chunk size.");
  const chunks: string[] = [];
  for (let start = 0; start < value.length;) {
    let end = Math.min(value.length, start + maxCharacters);
    if (end < value.length && /[\uD800-\uDBFF]/u.test(value[end - 1])) end -= 1;
    chunks.push(value.slice(start, end));
    start = end;
  }
  return chunks;
}

function citationFor(format: string, sourceId: string, page: number): string {
  if (format === "pdf") return `[${sourceId}, p. ${page}]`;
  if (format === "pptx") return `[${sourceId}, slide ${page}]`;
  return `[${sourceId}]`;
}

export async function prepareCompleteSummary(
  inputs: readonly SummaryInput[],
  onProgress: (progress: SummaryProgress) => void = () => undefined,
  limits: SummaryLimits = DEFAULT_SUMMARY_LIMITS,
  signal?: AbortSignal,
): Promise<PreparedSummaryJob> {
  const bytes = checkLimits(inputs, limits);
  const chunks: SummaryChunk[] = [];
  const coverage: SummaryCoverage[] = [];
  const sources: SummaryDraft["sources"] = [];
  const seen = new Set<string>();

  for (const [index, input] of inputs.entries()) {
    signal?.throwIfAborted();
    const sourceId = `S${index + 1}`;
    const id = input.kind === "file" ? input.file.id : input.unit.id;
    if (seen.has(`${input.kind}:${id}`)) throw new Error("A source was selected more than once.");
    seen.add(`${input.kind}:${id}`);
    const title = input.kind === "file" ? input.file.title : input.unit.title;
    let format = "unit";
    const parts: { page: number; section: string; text: string }[] = [];
    if (input.kind === "unit") {
      parts.push({ page: 1, section: "chapter text", text: [...input.unit.objectives, ...input.unit.summary, ...input.unit.keyTerms].join("\n") });
    } else {
      const file = input.file;
      const validated = await validateStoredLocalStudyFile(file);
      format = validated.format;
      if (!["pdf", "docx", "pptx", "txt", "markdown", "csv"].includes(format)) {
        throw new Error(`${title} is not a supported text document.`);
      }
      if (format === "pdf") {
        const loading = getDocument({ data: new Uint8Array(await file.data.arrayBuffer()) });
        try {
          const pdf = await loading.promise;
          for (let page = 1; page <= pdf.numPages; page += 1) {
            signal?.throwIfAborted();
            try {
              const content = await (await pdf.getPage(page)).getTextContent();
              parts.push({ page, section: `page ${page}`, text: content.items.map((item) => "str" in item && typeof item.str === "string" ? item.str : "").join(" ") });
            } catch (error) {
              coverage.push({ sourceId, documentTitle: title, page, section: `page ${page}`, status: "failed", chunks: 0, characters: 0, reason: error instanceof Error ? error.message : "Extraction failed" });
            }
            onProgress({ phase: "extract", completed: page, total: pdf.numPages });
          }
        } catch (error) {
          if (signal?.aborted) throw error;
          coverage.push({ sourceId, documentTitle: title, page: 1, section: "PDF document", status: "failed",
            chunks: 0, characters: 0, reason: error instanceof Error ? error.message : "PDF extraction failed" });
        } finally {
          await loading.destroy();
        }
      } else if (format === "docx" || format === "pptx") {
        try {
          for (const part of await extractOfficeTextParts(file.data, format, { complete: true })) {
            parts.push({ page: part.part, section: part.section ?? (format === "pptx" ? `slide ${part.part}` : "document text"), text: part.text });
          }
        } catch (error) {
          if (signal?.aborted) throw error;
          coverage.push({ sourceId, documentTitle: title, page: 1, section: "Office document", status: "failed",
            chunks: 0, characters: 0, reason: error instanceof Error ? error.message : "Office extraction failed" });
        }
      } else {
        try {
          parts.push({ page: 1, section: "document text",
            text: new TextDecoder("utf-8", { fatal: true }).decode(await file.data.arrayBuffer()) });
        } catch {
          coverage.push({ sourceId, documentTitle: title, page: 1, section: "document text", status: "failed",
            chunks: 0, characters: 0, reason: "The document contains text that cannot be decoded as UTF-8." });
        }
      }
    }
    sources.push({ id: sourceId, title, location: format === "pdf" ? `PDF pages 1–${parts.length + coverage.filter((item) => item.sourceId === sourceId).length}`
      : format === "pptx" ? `slides 1–${parts.length}` : format === "unit" ? "chapter text" : "document sections" });
    for (const part of parts) {
      signal?.throwIfAborted();
      const split = part.text.trim() ? splitCompleteText(part.text, limits.maxChunkCharacters).filter((text) => text.trim()) : [];
      coverage.push({ sourceId, documentTitle: title, page: part.page, section: part.section,
        status: split.length ? "readable" : "no-text", chunks: split.length, characters: part.text.length,
        ...(!split.length ? { reason: "No extractable text; this page or section may be blank or image-only." } : {}) });
      for (const text of split) chunks.push({ sourceId, documentId: id, documentTitle: title, page: part.page,
        section: part.section, citation: citationFor(format, sourceId, part.page), text });
      onProgress({ phase: "extract", completed: coverage.length, total: coverage.length + inputs.length - index - 1 });
    }
  }
  return { chunks, coverage, sources, complete: chunks.length > 0 && coverage.every((item) => item.status === "readable"), bytes };
}

function asPart(text: string, citation: string, index: number): SummaryChunk {
  return { sourceId: `R${index + 1}`, documentId: "intermediate", documentTitle: "Earlier chunk summaries",
    page: 1, section: "intermediate summary", citation, text };
}

/** Every original chunk is sent exactly once before any reduction. No partial result is published on failure. */
export async function generateCompleteSummary(
  job: PreparedSummaryJob,
  request: SummaryRequest,
  onProgress: (progress: SummaryProgress) => void = () => undefined,
  limits: SummaryLimits = DEFAULT_SUMMARY_LIMITS,
  signal?: AbortSignal,
): Promise<Pick<SummaryDraft, "summary" | "mainPoints">> {
  if (!job.complete) throw new Error("Some pages or sections have no readable text. Review incomplete coverage before generating.");
  const allowed = new Set(job.chunks.map((chunk) => chunk.citation));
  let level: string[] = [];
  const queue = [...job.chunks];
  for (let index = 0; index < queue.length;) {
    signal?.throwIfAborted();
    const chunk = queue[index];
    let answer: string;
    try {
      answer = await request("extract", [chunk]);
    } catch (error) {
      if (error instanceof Error && error.message.includes("context window was exceeded") && chunk.text.length > 200) {
        queue.splice(index, 1, ...splitCompleteText(chunk.text, Math.floor(chunk.text.length / 2)).filter((text) => text.trim())
          .map((text) => ({ ...chunk, text })));
        onProgress({ phase: "summarize", completed: index, total: queue.length });
        continue;
      }
      throw error;
    }
    const parsed = parseGeneratedSummary(answer, job.sources, allowed);
    level.push(JSON.stringify(parsed));
    index += 1;
    onProgress({ phase: "summarize", completed: index, total: queue.length });
  }
  async function combineGroup(items: string[]): Promise<string> {
    signal?.throwIfAborted();
    try {
      const parts = items.map((item, index) => asPart(item, "", index));
      const answer = await request("combine", parts);
      return JSON.stringify(parseGeneratedSummary(answer, job.sources, allowed));
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("context window was exceeded") || items.length === 1) throw error;
      const middle = Math.floor(items.length / 2);
      const left = await combineGroup(items.slice(0, middle));
      const right = await combineGroup(items.slice(middle));
      if (left.length >= items.slice(0, middle).join("").length
        && right.length >= items.slice(middle).join("").length) {
        throw new Error("The selected model cannot combine these summaries within its context window.");
      }
      return combineGroup([left, right]);
    }
  }
  while (level.length > 1) {
    signal?.throwIfAborted();
    const groups: string[][] = [];
    let group: string[] = [];
    let size = 0;
    for (const item of level) {
      if (item.length > limits.maxCombineCharacters) throw new Error("An intermediate summary exceeds the model input budget.");
      if (group.length && (size + item.length > limits.maxCombineCharacters || group.length >= 8)) {
        groups.push(group); group = []; size = 0;
      }
      group.push(item); size += item.length;
    }
    if (group.length) groups.push(group);
    if (groups.length >= level.length) {
      const shortened: string[] = [];
      for (const item of level) shortened.push(await combineGroup([item]));
      if (shortened.every((item, index) => item.length >= level[index].length)) {
        throw new Error("The intermediate summaries could not be combined within the model input budget.");
      }
      level = shortened;
      continue;
    }
    const next: string[] = [];
    for (const [index, items] of groups.entries()) {
      signal?.throwIfAborted();
      if (items.length === 1) next.push(items[0]);
      else next.push(await combineGroup(items));
      onProgress({ phase: "combine", completed: index + 1, total: groups.length });
    }
    level = next;
  }
  return parseGeneratedSummary(level[0], job.sources, allowed);
}
