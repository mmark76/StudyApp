import { describe, expect, it } from "vitest";
import {
  buildFlashcardIdentity,
  createFlashcardContentId,
  mergeImportedFlashcards,
  normalizeFlashcardIdentityText,
} from "../src/features/content-import/flashcardIdentity";
import type { Flashcard } from "../src/shared/types/models";

function makeCard(overrides: Partial<Flashcard> = {}): Flashcard {
  return {
    id: "card-content-v1-existing",
    unitId: "unit-1",
    number: 1,
    question: "What is ATP?",
    answer: "Adenosine triphosphate",
    tags: ["biology"],
    ...overrides,
  };
}

describe("stable flashcard identity", () => {
  it("uses a fixed SHA-256 identity vector", async () => {
    await expect(createFlashcardContentId(
      "unit-1",
      "What is ATP?",
      "Adenosine triphosphate",
    )).resolves.toBe(
      "flashcard-content-v1-c0934d57e4fb188e3e985c5869967790581809f47b7552e4e21c8e5433db2311",
    );
  });

  it("normalizes Unicode and whitespace predictably", async () => {
    expect(normalizeFlashcardIdentityText("  What\t is\nATP?  ")).toBe("What is ATP?");

    const first = await createFlashcardContentId(
      "unit-1",
      "  What\t is\nATP?  ",
      "Cafe\u0301",
    );
    const second = await createFlashcardContentId(
      "unit-1",
      "What is ATP?",
      "Café",
    );

    expect(first).toBe(second);
  });

  it("keeps case and punctuation significant", async () => {
    const base = await createFlashcardContentId("unit-1", "What is ATP?", "Answer");
    const changedCase = await createFlashcardContentId("unit-1", "what is ATP?", "Answer");
    const changedPunctuation = await createFlashcardContentId("unit-1", "What is ATP", "Answer");

    expect(changedCase).not.toBe(base);
    expect(changedPunctuation).not.toBe(base);
  });

  it("changes the ID for a different question, answer, or chapter", async () => {
    const base = await createFlashcardContentId("unit-1", "Question", "Answer");

    await expect(createFlashcardContentId("unit-1", "Different question", "Answer"))
      .resolves.not.toBe(base);
    await expect(createFlashcardContentId("unit-1", "Question", "Different answer"))
      .resolves.not.toBe(base);
    await expect(createFlashcardContentId("unit-2", "Question", "Answer"))
      .resolves.not.toBe(base);
  });

  it("does not include keywords in the stable identity", () => {
    const first = makeCard({ tags: ["one"] });
    const second = makeCard({ tags: ["two"] });

    expect(buildFlashcardIdentity(
      first.unitId,
      first.question,
      first.answer,
    )).toBe(buildFlashcardIdentity(
      second.unitId,
      second.question,
      second.answer,
    ));
  });

  it("fails clearly when secure hashing is unavailable", async () => {
    await expect(createFlashcardContentId(
      "unit-1",
      "Question",
      "Answer",
      null,
    )).rejects.toThrow("Stable flashcard IDs are not available");
  });

  it("updates matching content without changing its progress identity", () => {
    const existing = makeCard({ tags: ["old"] });
    const incoming = makeCard({
      number: 2,
      question: "  What  is ATP? ",
      tags: ["new"],
    });

    expect(mergeImportedFlashcards([existing], [incoming])).toEqual([incoming]);
  });

  it("rejects an ID collision with different learning content", () => {
    const existing = makeCard();
    const conflicting = makeCard({ question: "A different question" });

    expect(() => mergeImportedFlashcards([existing], [conflicting])).toThrow(
      "Existing progress was not changed",
    );
  });

  it("keeps legacy row-based cards untouched during the migration period", async () => {
    const legacy = makeCard({ id: "card-1-1" });
    const stable = makeCard({
      id: await createFlashcardContentId(
        legacy.unitId,
        legacy.question,
        legacy.answer,
      ),
    });

    expect(mergeImportedFlashcards([legacy], [stable])).toEqual([legacy, stable]);
  });
});
