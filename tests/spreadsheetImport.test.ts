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

  it("parses flashcards with expected headers and quoted CSV values", () => {
    const result = parseFlashcardsSpreadsheet([
      "Chapter number,Question,Answer,Keywords",
      '1,"Question, with comma?","Answer, with comma","tag one | tag, two"',
    ].join("\n"), units);

    expect(result).toEqual([
      {
        id: "card-1-1",
        unitId: "unit-1",
        number: 1,
        question: "Question, with comma?",
        answer: "Answer, with comma",
        tags: ["tag one", "tag, two"],
      },
    ]);
  });

  it("rejects flashcard files with wrong headers", () => {
    expect(() => parseFlashcardsSpreadsheet([
      "Chapter,Prompt,Answer,Tags",
      "1,Question,Answer,tag",
    ].join("\n"), units)).toThrow(
      "The flashcards file must start with these column headings: Chapter number, Question, Answer, Keywords",
    );
  });
});
