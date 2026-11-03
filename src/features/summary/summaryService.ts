import { studyDatabase, type StudyDatabase } from "../../infrastructure/database/studyDatabase";
import type { LocalStudyFile, StudyUnit } from "../../shared/types/models";
import { extractPdfChunks, MAX_RAG_CONTEXT_CHARACTERS, MAX_RAG_PASSAGES, splitPageIntoChunks, type PdfPassage } from "../assistant/localPdfRag";
import { validateStoredLocalStudyFile } from "../study-materials/localFilePolicy";
import { extractOfficeTextParts } from "../workspace-beta/officeTextExtraction";

export interface SummaryDraft {
  title: string;
  summary: string;
  mainPoints: string[];
  sources: { id: string; title: string; location: string }[];
}

export function validateSummaryDraft(draft: SummaryDraft): SummaryDraft {
  const title = draft.title.trim();
  const summary = draft.summary.trim();
  const mainPoints = draft.mainPoints.map((point) => point.trim()).filter(Boolean);
  if (!title || title.length > 200 || !summary || summary.length > 20_000
    || !mainPoints.length || mainPoints.length > 30 || mainPoints.some((point) => point.length > 1_000)
    || !draft.sources.length || draft.sources.length > MAX_RAG_PASSAGES
    || draft.sources.some((source) => !source.title || source.title.length > 300 || !source.location)) {
    throw new Error("Select a source and add a title, a summary and 1–30 main points within the size limits.");
  }
  return { title, summary, mainPoints, sources: draft.sources };
}

export function formatSummary(draft: SummaryDraft): string {
  const valid = validateSummaryDraft(draft);
  return `${valid.title}\n\nSummary\n${valid.summary}\n\nMain points\n${valid.mainPoints.map((point, index) => `${index + 1}. ${point}`).join("\n")}\n\nSources\n${valid.sources.map((source) => `[${source.id}] ${source.title} — ${source.location}`).join("\n")}\n`;
}

export function parseGeneratedSummary(answer: string, sources: SummaryDraft["sources"]): Pick<SummaryDraft, "summary" | "mainPoints"> {
  let value: unknown;
  try {
    value = JSON.parse(answer.trim().replace(/^```(?:json)?\s*/iu, "").replace(/\s*```$/u, ""));
  } catch {
    throw new Error("The AI result was not a valid summary. Try again with the selected excerpts.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("The AI result was invalid.");
  const result = value as Record<string, unknown>;
  if (typeof result.summary !== "string" || !Array.isArray(result.mainPoints)
    || !result.mainPoints.every((point) => typeof point === "string")) {
    throw new Error("The AI result needs a summary and main points.");
  }
  const draft = validateSummaryDraft({ title: "Generated summary", summary: result.summary, mainPoints: result.mainPoints, sources });
  const allowed = new Set(sources.map((source) => source.id));
  const texts = [draft.summary, ...draft.mainPoints];
  if (texts.some((text) => !/\[S\d+(?:,[^\]]*)?\]/u.test(text))
    || [...texts.join("\n").matchAll(/\[S(\d+)(?:,[^\]]*)?\]/gu)].some((match) => !allowed.has(`S${match[1]}`))) {
    throw new Error("The AI result has missing or unknown source references. Try again.");
  }
  return { summary: draft.summary, mainPoints: draft.mainPoints };
}

export async function summaryPassagesFromFile(file: LocalStudyFile): Promise<PdfPassage[]> {
  const validated = await validateStoredLocalStudyFile(file);
  if (!["pdf", "docx", "pptx", "txt", "markdown", "csv"].includes(validated.format)) {
    throw new Error("Choose a PDF, DOCX, PPTX, TXT, Markdown or CSV file.");
  }
  const chunks: Omit<PdfPassage, "sourceId">[] = [];
  if (validated.format === "pdf") {
    for (const chunk of await extractPdfChunks([file])) chunks.push(chunk);
  } else {
    if (["txt", "markdown", "csv"].includes(validated.format) && file.size > 2 * 1024 * 1024) {
      throw new Error("Text sources must be at most 2 MB.");
    }
    const parts = validated.format === "docx" || validated.format === "pptx"
      ? await extractOfficeTextParts(file.data, validated.format)
      : [{ part: 1, text: await file.data.text() }];
    for (const part of parts) {
      for (const text of splitPageIntoChunks(part.text)) {
        chunks.push({ documentId: file.id, documentTitle: file.title, page: part.part, text });
      }
    }
  }
  if (!chunks.length) throw new Error("The selected file has no extractable text.");
  const count = Math.min(MAX_RAG_PASSAGES, chunks.length);
  const selected = Array.from({ length: count }, (_, index) => chunks[Math.floor(index * chunks.length / count)]);
  let remaining = MAX_RAG_CONTEXT_CHARACTERS;
  return selected.map((chunk, index) => {
    const text = chunk.text.slice(0, Math.min(2_500, remaining));
    remaining -= text.length;
    return { ...chunk, sourceId: `S${index + 1}`, text };
  }).filter((passage) => passage.text.trim());
}

export function summaryPassagesFromUnit(unit: StudyUnit): PdfPassage[] {
  const text = [...unit.objectives, ...unit.summary, ...unit.keyTerms].join("\n").trim();
  if (!text) throw new Error("This chapter has no summary text to use.");
  return [{ sourceId: "S1", documentId: unit.id, documentTitle: unit.title, page: 1, text: text.slice(0, 2_500) }];
}

export async function saveSummary(draft: SummaryDraft, database: StudyDatabase = studyDatabase): Promise<LocalStudyFile> {
  const valid = validateSummaryDraft(draft);
  const data = new Blob([formatSummary(valid)], { type: "text/plain" });
  const item: LocalStudyFile = {
    id: crypto.randomUUID(), title: valid.title,
    fileName: `StudyApp_Summary_${new Date().toISOString().slice(0, 10)}_${crypto.randomUUID().slice(0, 8)}.txt`,
    size: data.size, createdAt: new Date().toISOString(), data,
    mimeType: "text/plain", fileKind: "text", fileSource: "source-material", materialType: "summary", generatedSummary: true,
  };
  await database.studyFiles.add(item);
  return item;
}
