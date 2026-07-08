import type { Flashcard } from "../../shared/types/models";

export interface QuizQuestion {
  cardId: string;
  question: string;
  correctAnswer: string;
  options: string[];
}

export interface QuizAnswerLock {
  current: boolean;
}

export function claimQuizAnswer(lock: QuizAnswerLock): boolean {
  if (lock.current) return false;
  lock.current = true;
  return true;
}

export function shuffle<T>(values: readonly T[], random = Math.random): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function buildQuiz(cards: readonly Flashcard[], count = 10, random = Math.random): QuizQuestion[] {
  if (cards.length < 4) return [];
  return shuffle(cards, random).slice(0, Math.min(count, cards.length)).map((card) => {
    const normalizedCorrect = card.answer.trim().toLocaleLowerCase();
    const distractors = shuffle(cards.filter((candidate) => candidate.id !== card.id), random)
      .map((candidate) => candidate.answer)
      .filter((answer, index, array) => {
        const normalized = answer.trim().toLocaleLowerCase();
        return normalized !== normalizedCorrect && array.findIndex((item) => item.trim().toLocaleLowerCase() === normalized) === index;
      })
      .slice(0, 3);
    if (distractors.length < 3) return null;
    return {
      cardId: card.id,
      question: card.question,
      correctAnswer: card.answer,
      options: shuffle([card.answer, ...distractors], random)
    };
  }).filter((question): question is QuizQuestion => question !== null);
}
