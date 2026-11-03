import { studyDatabase, type StudyDatabase } from "../../infrastructure/database/studyDatabase";
import type { LocalStudyFile } from "../../shared/types/models";

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
    || !draft.sources.length
    || draft.sources.some((source) => !source.title || source.title.length > 300 || !source.location)) {
    throw new Error("Select a source and add a title, a summary and 1–30 main points within the size limits.");
  }
  return { title, summary, mainPoints, sources: draft.sources };
}

export function formatSummary(draft: SummaryDraft): string {
  const valid = validateSummaryDraft(draft);
  return `${valid.title}\n\nSummary\n${valid.summary}\n\nMain points\n${valid.mainPoints.map((point, index) => `${index + 1}. ${point}`).join("\n")}\n\nSources\n${valid.sources.map((source) => `[${source.id}] ${source.title} — ${source.location}`).join("\n")}\n`;
}

export function parseGeneratedSummary(answer: string, sources: SummaryDraft["sources"], allowedCitations?: ReadonlySet<string>): Pick<SummaryDraft, "summary" | "mainPoints"> {
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
  if (allowedCitations) {
    if (texts.some((text) => !/\[S\d+(?:,[^\]]*)?\]/u.test(text))
      || [...texts.join("\n").matchAll(/\[[^\]]+\]/gu)].some((match) => !allowedCitations.has(match[0]))) {
      throw new Error("The AI result has missing or unknown source locations. Try again.");
    }
    return { summary: draft.summary, mainPoints: draft.mainPoints };
  }
  if (texts.some((text) => !/\[S\d+(?:,[^\]]*)?\]/u.test(text))
    || [...texts.join("\n").matchAll(/\[S(\d+)(?:,[^\]]*)?\]/gu)].some((match) => !allowed.has(`S${match[1]}`))) {
    throw new Error("The AI result has missing or unknown source references. Try again.");
  }
  return { summary: draft.summary, mainPoints: draft.mainPoints };
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
