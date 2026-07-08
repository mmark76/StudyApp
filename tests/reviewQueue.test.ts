import { describe, expect, it } from "vitest";
import { buildDueReviewQueue, nextReviewIndex } from "../src/features/review/reviewQueue";
import type { CardProgress, Flashcard } from "../src/shared/types/models";

const flashcards: Flashcard[] = [
  { id: "card-1", unitId: "unit-1", number: 1, question: "Question 1", answer: "Answer 1", tags: [] },
  { id: "card-2", unitId: "unit-1", number: 2, question: "Question 2", answer: "Answer 2", tags: [] },
  { id: "card-3", unitId: "unit-1", number: 3, question: "Question 3", answer: "Answer 3", tags: [] },
];

function progress(cardId: string, nextReviewAt: string): CardProgress {
  return {
    cardId,
    score: 1,
    repetitions: 1,
    intervalDays: 1,
    nextReviewAt,
    lastReviewedAt: "2026-01-01T10:00:00.000Z",
    lapses: 0,
  };
}

describe("review queue", () => {
  const now = new Date("2026-01-01T12:00:00.000Z");

  it("snapshots due cards in flashcard order", () => {
    const queue = buildDueReviewQueue(
      flashcards,
      [
        progress("card-2", "2026-01-01T11:00:00.000Z"),
        progress("card-3", "2026-01-02T11:00:00.000Z"),
        progress("card-1", "2026-01-01T11:30:00.000Z"),
      ],
      now,
    );

    expect(queue.map((card) => card.id)).toEqual(["card-1", "card-2"]);
  });

  it("advances through the original snapshot when live due cards shrink", () => {
    const snapshot = buildDueReviewQueue(
      flashcards,
      [
        progress("card-1", "2026-01-01T11:00:00.000Z"),
        progress("card-2", "2026-01-01T11:00:00.000Z"),
      ],
      now,
    );
    const liveDueAfterFirstRating = buildDueReviewQueue(
      flashcards,
      [progress("card-2", "2026-01-01T11:00:00.000Z")],
      now,
    );

    expect(snapshot[nextReviewIndex(0)].id).toBe("card-2");
    expect(liveDueAfterFirstRating[1]).toBeUndefined();
  });
});
