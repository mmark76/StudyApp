import { describe, expect, it } from "vitest";
import { buildQuiz, claimQuizAnswer } from "../src/features/quiz/quiz";
import type { Flashcard } from "../src/shared/types/models";

const cards: Flashcard[] = Array.from({ length: 5 }, (_, index) => ({
  id: `card-${index}`,
  unitId: "unit-1",
  number: index + 1,
  question: `Question ${index + 1}`,
  answer: `Answer ${index + 1}`,
  tags: []
}));

describe("buildQuiz", () => {
  it("returns no quiz with fewer than four cards", () => {
    expect(buildQuiz(cards.slice(0, 3))).toEqual([]);
  });

  it("creates unique answer options", () => {
    const quiz = buildQuiz(cards, 5, () => 0.5);
    for (const question of quiz) {
      expect(new Set(question.options).size).toBe(4);
      expect(question.options).toContain(question.correctAnswer);
    }
  });

  it("accepts only one answer while a question is locked", () => {
    const lock = { current: false };

    expect(claimQuizAnswer(lock)).toBe(true);
    expect(claimQuizAnswer(lock)).toBe(false);
  });
});
