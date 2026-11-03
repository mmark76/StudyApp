import { beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import { StudyDatabase } from "../src/infrastructure/database/studyDatabase";
import { formatSummary, parseGeneratedSummary, saveSummary } from "../src/features/summary/summaryService";

const sources = [{ id: "S1", title: "Introduction", location: "chapter summary" }];

describe("Summary and Main Points", () => {
  let database: StudyDatabase;
  beforeEach(() => { database = new StudyDatabase(`summary-test-${crypto.randomUUID()}`); });

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
