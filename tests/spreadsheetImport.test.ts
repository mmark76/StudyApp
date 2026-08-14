import { describe, expect, it } from "vitest";
import {
  parseFlashcardsSpreadsheet,
  parseUnitsSpreadsheet,
} from "../src/features/content-import/spreadsheetImport";
import type { StudyUnit } from "../src/shared/types/models";

const units: StudyUnit[] = [
  {
    id: "unit-1",
    number: 1,
    title: "Example chapter",
    objectives: [],
    summary: [],
    keyTerms: [],
  },
];

describe("spreadsheet import", () => {
  it("parses units with expected headers and quoted CSV values", () => {
    const result = parseUnitsSpreadsheet([
      "Chapter number,Chapter title,What should you learn?,Key points,Important terms",
      '1,"Chapter, with comma","Goal one | Goal, two","Point one | Point, two","term one | term, two"',
    ].join("\n"));

    expect(result).toEqual([
      {
        id: "unit-1",
        number: 1,
        title: "Chapter, with comma",
        objectives: ["Goal one", "Goal, two"],
        summary: ["Point one", "Point, two"],
        keyTerms: ["term one", "term, two"],
      },
    ]);
  });

  it("rejects unit files with wrong headers", () => {
    expect(() => parseUnitsSpreadsheet([
      "Number,Title,Objectives,Summary,Terms",
      "1,Chapter,Goal,Point,Term",
    ].join("\n"))).toThrow(
      "The chapters file must start with these column headings: Chapter number, Chapter title, What should you learn?, Key points, Important terms",
    );
  });

  it("parses flashcards with expected headers and quoted CSV values", async () => {
    const result = await parseFlashcardsSpreadsheet([
      "Chapter number,Question,Answer,Keywords",
      '1,"Question, with comma?","Answer, with comma","tag one | tag, two"',
    ].join("\n"), units);

    expect(result).toEqual([
      expect.objectContaining({
        id: expect.stringMatching(/^flashcard-content-v1-[a-f0-9]{64}$/u),
        unitId: "unit-1",
        number: 1,
        question: "Question, with comma?",
        answer: "Answer, with comma",
        tags: ["tag one", "tag, two"],
      }),
    ]);
  });

  it("rejects flashcard files with wrong headers", async () => {
    await expect(parseFlashcardsSpreadsheet([
      "Chapter,Prompt,Answer,Tags",
      "1,Question,Answer,tag",
    ].join("\n"), units)).rejects.toThrow(
      "The flashcards file must start with these column headings: Chapter number, Question, Answer, Keywords",
    );
  });

  it("keeps IDs stable when rows are reordered", async () => {
    const header = "Chapter number,Question,Answer,Keywords";
    const original = await parseFlashcardsSpreadsheet([
      header,
      "1,First question,First answer,one",
      "1,Second question,Second answer,two",
    ].join("\n"), units);
    const reordered = await parseFlashcardsSpreadsheet([
      header,
      "1,Second question,Second answer,two",
      "1,First question,First answer,one",
    ].join("\n"), units);

    expect(new Map(reordered.map((card) => [card.question, card.id]))).toEqual(
      new Map(original.map((card) => [card.question, card.id])),
    );
    const progressCardId = original[0].id;
    expect(reordered.find((card) => card.id === progressCardId)?.question).toBe(
      "First question",
    );
  });

  it("keeps existing IDs stable when another row is added first", async () => {
    const header = "Chapter number,Question,Answer,Keywords";
    const original = await parseFlashcardsSpreadsheet([
      header,
      "1,First question,First answer,one",
      "1,Second question,Second answer,two",
    ].join("\n"), units);
    const withNewFirstRow = await parseFlashcardsSpreadsheet([
      header,
      "1,New question,New answer,new",
      "1,First question,First answer,one",
      "1,Second question,Second answer,two",
    ].join("\n"), units);
    const newIdsByQuestion = new Map(
      withNewFirstRow.map((card) => [card.question, card.id]),
    );

    for (const card of original) {
      expect(newIdsByQuestion.get(card.question)).toBe(card.id);
    }
  });

  it("rejects duplicate normalized cards within one import", async () => {
    await expect(parseFlashcardsSpreadsheet([
      "Chapter number,Question,Answer,Keywords",
      "1,What is ATP?,Energy molecule,biology",
      '1,"  What   is ATP?  ","Energy molecule",chemistry',
    ].join("\n"), units)).rejects.toThrow(
      "Flashcard rows 2 and 3 have the same chapter, question and answer",
    );
  });

  it("rejects unclosed or misplaced CSV quotes", () => {
    expect(() => parseUnitsSpreadsheet([
      "Chapter number,Chapter title,What should you learn?,Key points,Important terms",
      '1,"Unclosed chapter,Goal,Point,Term',
    ].join("\n"))).toThrow("unclosed quote");

    expect(() => parseUnitsSpreadsheet([
      "Chapter number,Chapter title,What should you learn?,Key points,Important terms",
      '1,Chap"ter,Goal,Point,Term',
    ].join("\n"))).toThrow("invalid quote");
  });

  it("rejects missing or extra columns instead of silently dropping data", async () => {
    expect(() => parseUnitsSpreadsheet([
      "Chapter number,Chapter title,What should you learn?,Key points,Important terms",
      "1,Chapter,Goal,Point,Term,unexpected",
    ].join("\n"))).toThrow("exactly 5 columns");

    await expect(parseFlashcardsSpreadsheet([
      "Chapter number,Question,Answer,Keywords",
      "1,Question,Answer",
    ].join("\n"), units)).rejects.toThrow("exactly 4 columns");
  });
});
