import type {
  CardProgress,
  Rating,
  StudyMode,
  StudyOperation,
  StudySession,
} from "../../shared/types/models";
import {
  studyDatabase,
  type StudyDatabase,
} from "../../infrastructure/database/studyDatabase";
import { scheduleReview } from "../review/spacedRepetition";

export type StudyOperationWriteStage = "progress" | "session" | "operation";

export interface StudyOperationFailureInjector {
  beforeWrite: (
    stage: StudyOperationWriteStage,
    operation: StudyOperation,
  ) => void | Promise<void>;
}

export interface CardRatingOperationInput {
  operationId: string;
  sessionId: string;
  mode: Extract<StudyMode, "flashcards" | "review">;
  cardId: string;
  rating: Rating;
  startedAt: string;
  committedAt: string;
  reviewedCards: number;
  correctAnswers: number;
  completesSession: boolean;
}

export interface QuizCompletionOperationInput {
  operationId: string;
  sessionId: string;
  startedAt: string;
  committedAt: string;
  reviewedCards: number;
  correctAnswers: number;
}

export interface StudyOperationResult {
  alreadyCommitted: boolean;
  progress?: CardProgress;
  session?: StudySession;
}

export class StudyOperationConflictError extends Error {
  constructor() {
    super("The study operation ID was already used for different data.");
    this.name = "StudyOperationConflictError";
  }
}

function assertSessionTotals(reviewedCards: number, correctAnswers: number): void {
  if (
    !Number.isInteger(reviewedCards) ||
    !Number.isInteger(correctAnswers) ||
    reviewedCards < 0 ||
    correctAnswers < 0 ||
    correctAnswers > reviewedCards
  ) {
    throw new Error("Study session totals are invalid.");
  }
}

function matchesOperation(
  existing: StudyOperation,
  expected: StudyOperation,
): boolean {
  return (
    existing.kind === expected.kind &&
    existing.mode === expected.mode &&
    existing.sessionId === expected.sessionId &&
    existing.cardId === expected.cardId &&
    existing.rating === expected.rating &&
    existing.completesSession === expected.completesSession &&
    existing.reviewedCards === expected.reviewedCards &&
    existing.correctAnswers === expected.correctAnswers
  );
}

function matchesSession(
  existing: StudySession,
  expected: StudySession,
): boolean {
  return (
    existing.mode === expected.mode &&
    existing.startedAt === expected.startedAt &&
    existing.reviewedCards === expected.reviewedCards &&
    existing.correctAnswers === expected.correctAnswers
  );
}

async function injectFailure(
  injector: StudyOperationFailureInjector | undefined,
  stage: StudyOperationWriteStage,
  operation: StudyOperation,
): Promise<void> {
  await injector?.beforeWrite(stage, operation);
}

export async function commitCardRatingOperation(
  input: CardRatingOperationInput,
  database: StudyDatabase = studyDatabase,
  failureInjector?: StudyOperationFailureInjector,
): Promise<StudyOperationResult> {
  assertSessionTotals(input.reviewedCards, input.correctAnswers);

  const operation: StudyOperation = {
    id: input.operationId,
    kind: "card-rating",
    mode: input.mode,
    sessionId: input.sessionId,
    cardId: input.cardId,
    rating: input.rating,
    committedAt: input.committedAt,
    completesSession: input.completesSession,
    reviewedCards: input.reviewedCards,
    correctAnswers: input.correctAnswers,
  };
  const sessionAfterCommit: StudySession = {
    id: input.sessionId,
    mode: input.mode,
    startedAt: input.startedAt,
    completedAt: input.completesSession ? input.committedAt : undefined,
    reviewedCards: input.reviewedCards,
    correctAnswers: input.correctAnswers,
  };

  return database.transaction(
    "rw",
    database.cardProgress,
    database.studySessions,
    database.studyOperations,
    async () => {
      const existingOperation = await database.studyOperations.get(
        input.operationId,
      );

      if (existingOperation) {
        if (!matchesOperation(existingOperation, operation)) {
          throw new StudyOperationConflictError();
        }

        const progress = await database.cardProgress.get(input.cardId);
        const session = await database.studySessions.get(input.sessionId);

        if (!progress || !session) {
          throw new Error("The committed study operation is incomplete.");
        }

        return { alreadyCommitted: true, progress, session };
      }

      const existingSession = await database.studySessions.get(input.sessionId);
      if (existingSession) {
        if (
          existingSession.mode !== input.mode ||
          existingSession.startedAt !== input.startedAt
        ) {
          throw new StudyOperationConflictError();
        }

        if (
          existingSession.completedAt &&
          existingSession.reviewedCards < input.reviewedCards
        ) {
          throw new Error("A completed study session cannot be reopened.");
        }

        if (existingSession.reviewedCards >= input.reviewedCards) {
          if (
            existingSession.correctAnswers !== input.correctAnswers ||
            (input.completesSession && !existingSession.completedAt)
          ) {
            throw new StudyOperationConflictError();
          }

          const progress = await database.cardProgress.get(input.cardId);
          if (!progress) {
            throw new Error("The study session has no card progress.");
          }

          await injectFailure(failureInjector, "operation", operation);
          await database.studyOperations.add(operation);
          return {
            alreadyCommitted: true,
            progress,
            session: existingSession,
          };
        }

        if (existingSession.reviewedCards !== input.reviewedCards - 1) {
          throw new Error("The study session operations are out of order.");
        }
      } else if (input.reviewedCards !== 1) {
        throw new Error("The study session must begin with its first card.");
      }

      const previous = await database.cardProgress.get(input.cardId);
      const progress = scheduleReview(
        input.cardId,
        input.rating,
        previous,
        new Date(input.committedAt),
      );

      await injectFailure(failureInjector, "progress", operation);
      await database.cardProgress.put(progress);

      await injectFailure(failureInjector, "session", operation);
      await database.studySessions.put(sessionAfterCommit);

      await injectFailure(failureInjector, "operation", operation);
      await database.studyOperations.add(operation);

      return {
        alreadyCommitted: false,
        progress,
        session: sessionAfterCommit,
      };
    },
  );
}

export async function commitQuizCompletionOperation(
  input: QuizCompletionOperationInput,
  database: StudyDatabase = studyDatabase,
  failureInjector?: StudyOperationFailureInjector,
): Promise<StudyOperationResult> {
  assertSessionTotals(input.reviewedCards, input.correctAnswers);

  const operation: StudyOperation = {
    id: input.operationId,
    kind: "quiz-completion",
    mode: "quiz",
    sessionId: input.sessionId,
    committedAt: input.committedAt,
    completesSession: true,
    reviewedCards: input.reviewedCards,
    correctAnswers: input.correctAnswers,
  };
  const session: StudySession = {
    id: input.sessionId,
    mode: "quiz",
    startedAt: input.startedAt,
    completedAt: input.committedAt,
    reviewedCards: input.reviewedCards,
    correctAnswers: input.correctAnswers,
  };

  return database.transaction(
    "rw",
    database.studySessions,
    database.studyOperations,
    async () => {
      const existingOperation = await database.studyOperations.get(
        input.operationId,
      );

      if (existingOperation) {
        if (!matchesOperation(existingOperation, operation)) {
          throw new StudyOperationConflictError();
        }

        const existingSession = await database.studySessions.get(
          input.sessionId,
        );
        if (!existingSession) {
          throw new Error("The committed quiz operation has no study session.");
        }

        return { alreadyCommitted: true, session: existingSession };
      }

      const existingSession = await database.studySessions.get(input.sessionId);
      if (existingSession) {
        if (!matchesSession(existingSession, session)) {
          throw new StudyOperationConflictError();
        }

        await injectFailure(failureInjector, "operation", operation);
        await database.studyOperations.add(operation);
        return { alreadyCommitted: true, session: existingSession };
      }

      await injectFailure(failureInjector, "session", operation);
      await database.studySessions.add(session);
      await injectFailure(failureInjector, "operation", operation);
      await database.studyOperations.add(operation);

      return { alreadyCommitted: false, session };
    },
  );
}
