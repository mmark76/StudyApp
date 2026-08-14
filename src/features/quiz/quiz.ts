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
  const answersByNormalizedValue = new Map<string, string>();
  for (const card of cards) {
    const normalized = card.answer.trim().toLocaleLowerCase();
    if (normalized && !answersByNormalizedValue.has(normalized)) {
      answersByNormalizedValue.set(normalized, card.answer);
    }
  }
  if (answersByNormalizedValue.size < 4) return [];

  const answerPool = shuffle([...answersByNormalizedValue.entries()], random);
  return shuffle(cards, random).slice(0, Math.min(count, cards.length)).map((card) => {
    const normalizedCorrect = card.answer.trim().toLocaleLowerCase();
    const distractors = answerPool
      .filter(([normalized]) => normalized !== normalizedCorrect)
      .map(([, answer]) => answer)
      .slice(0, 3);
    return {
      cardId: card.id,
      question: card.question,
      correctAnswer: card.answer,
      options: shuffle([card.answer, ...distractors], random)
    };
  });
}
