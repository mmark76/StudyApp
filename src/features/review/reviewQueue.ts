import type { CardProgress, Flashcard } from "../../shared/types/models";
import { isDue } from "../../shared/utils/date";

export function buildDueReviewQueue(flashcards: Flashcard[], progress: CardProgress[], now = new Date()): Flashcard[] {
  const dueIds = new Set(progress.filter((item) => isDue(item.nextReviewAt, now)).map((item) => item.cardId));
  return flashcards.filter((card) => dueIds.has(card.id));
}

export function nextReviewIndex(currentIndex: number): number {
  return currentIndex + 1;
}
