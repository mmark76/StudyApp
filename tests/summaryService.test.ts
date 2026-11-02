import { beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import { StudyDatabase } from "../src/infrastructure/database/studyDatabase";
import type { LocalStudyFile } from "../src/shared/types/models";
import { formatSummary, parseGeneratedSummary, saveSummary, summaryPassagesFromFile, summaryPassagesFromUnit } from "../src/features/summary/summaryService";

const sources = [{ id: "S1", title: "Introduction", location: "chapter summary" }];

describe("Summary and Main Points", () => {
  let database: StudyDatabase;
  beforeEach(() => { database = new StudyDatabase(`summary-test-${crypto.randomUUID()}`); });

  it("reuses chapter summary points as local source text", () => {
    const passages = summaryPassagesFromUnit({ id: "unit-1", number: 1, title: "Introduction", objectives: [], summary: ["Main concept"], keyTerms: [] });
    expect(passages).toMatchObject([{ sourceId: "S1", documentTitle: "Introduction", text: "Main concept" }]);
  });

  it("selects bounded passages from a stored text source", async () => {
    const content = Array.from({ length: 30 }, (_, index) => `Section ${index + 1}: ${"study text ".repeat(35)}`).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const file: LocalStudyFile = { id: "file-1", title: "Notes", fileName: "notes.txt", size: blob.size, createdAt: "2026-11-03", data: blob, mimeType: "text/plain", fileKind: "text", fileSource: "source-material" };
    const passages = await summaryPassagesFromFile(file);
    expect(passages.length).toBeGreaterThan(1);
    expect(passages.length).toBeLessThanOrEqual(6);
    expect(passages.map((passage) => passage.text).join("").length).toBeLessThanOrEqual(10_000);
    expect(passages.map((passage) => passage.sourceId)).toEqual(passages.map((_, index) => `S${index + 1}`));
  });

  it("rejects malformed or uncited AI output", () => {
    expect(() => parseGeneratedSummary("not json", sources)).toThrow();
    expect(() => parseGeneratedSummary('{"summary":"Unsupported [S2]","mainPoints":["Point [S2]"]}', sources)).toThrow();
    expect(() => parseGeneratedSummary('{"summary":"Claim [S1]","mainPoints":["Point without citation"]}', sources)).toThrow();
    expect(parseGeneratedSummary('{"summary":"Claim [S1]","mainPoints":["Point [S1]"]}', sources).mainPoints).toEqual(["Point [S1]"]);
  });

  it("saves only an explicit validated summary in the existing local file store", async () => {
    const draft = { title: "Introduction", summary: "A short overview [S1]", mainPoints: ["Main concept [S1]"], sources };
    expect(formatSummary(draft)).toContain("[S1] Introduction — chapter summary");
    const saved = await saveSummary(draft, database);
    expect(saved.materialType).toBe("summary");
    expect((await database.studyFiles.get(saved.id))?.data.size).toBeGreaterThan(0);
    expect((await database.studyFiles.get(saved.id))?.fileName).toMatch(/\.txt$/u);
    await expect(saveSummary({ ...draft, mainPoints: [] }, database)).rejects.toThrow();
    expect(await database.studyFiles.count()).toBe(1);
    await database.delete();
  });
});
