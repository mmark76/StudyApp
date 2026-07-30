import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import { createId } from "../../shared/utils/id";
import { useStudyContent } from "../content-import/useStudyContent";
import {
  commitQuizCompletionOperation,
  type QuizCompletionOperationInput,
  type StudyOperationFailureInjector,
} from "../learn/studyOperationService";
import { buildQuiz, claimQuizAnswer } from "./quiz";

interface QuizSessionIdentity {
  id: string;
  startedAt: string;
}

function createQuizSessionIdentity(): QuizSessionIdentity {
  return {
    id: createId("session"),
    startedAt: new Date().toISOString(),
  };
}

interface QuizPageProps {
  failureInjector?: StudyOperationFailureInjector;
}

export function QuizPage({ failureInjector }: QuizPageProps = {}) {
  const { text } = useLanguage();
  const { flashcards } = useStudyContent();
  const questions = useMemo(() => buildQuiz(flashcards), [flashcards]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [retryOperation, setRetryOperation] =
    useState<QuizCompletionOperationInput | null>(null);
  const [session, setSession] = useState(createQuizSessionIdentity);
  const answerLock = useRef(false);
  const question = questions[index];

  useEffect(() => {
    answerLock.current = false;
  }, [index]);

  async function persistCompletion(operation: QuizCompletionOperationInput) {
    if (pending) return;
    setPending(true);
    setMessage(text("Saving result...", "Αποθήκευση αποτελέσματος..."));

    try {
      const result = await commitQuizCompletionOperation(
        operation,
        studyDatabase,
        failureInjector,
      );
      if (!result.session) {
        throw new Error("The committed quiz session is missing.");
      }

      setScore(result.session.correctAnswers);
      setRetryOperation(null);
      setMessage("");
      setFinished(true);
    } catch {
      setMessage(
        text(
          "The result could not be saved. Retry the same final answer.",
          "Το αποτέλεσμα δεν αποθηκεύτηκε. Δοκίμασε ξανά την ίδια τελική απάντηση.",
        ),
      );
    } finally {
      setPending(false);
    }
  }

  function answer(option: string) {
    if (
      !question ||
      finished ||
      pending ||
      retryOperation ||
      !claimQuizAnswer(answerLock)
    ) {
      return;
    }

    const nextScore = score + (option === question.correctAnswer ? 1 : 0);

    if (index >= questions.length - 1) {
      const operation: QuizCompletionOperationInput = {
        operationId: createId("operation"),
        sessionId: session.id,
        startedAt: session.startedAt,
        committedAt: new Date().toISOString(),
        reviewedCards: questions.length,
        correctAnswers: nextScore,
      };
      setRetryOperation(operation);
      void persistCompletion(operation);
      return;
    }

    setScore(nextScore);
    setMessage("");
    setIndex((current) => current + 1);
  }

  function restartQuiz() {
    setIndex(0);
    setScore(0);
    setFinished(false);
    setMessage("");
    setPending(false);
    setRetryOperation(null);
    setSession(createQuizSessionIdentity());
    answerLock.current = false;
  }

  if (questions.length === 0) {
    return (
      <section className="empty-state">
        <h2>
          {text(
            "The quiz is not available yet",
            "Το κουίζ δεν είναι διαθέσιμο",
          )}
        </h2>
        <p>
          {text(
            "Add at least four cards with different answers.",
            "Πρόσθεσε τουλάχιστον τέσσερις κάρτες με διαφορετικές απαντήσεις.",
          )}
        </p>
      </section>
    );
  }

  if (finished) {
    return (
      <section className="empty-state">
        <h2>
          {text("Result", "Αποτέλεσμα")}: {score} / {questions.length}
        </h2>
        <button className="button primary" onClick={restartQuiz} type="button">
          {text("New quiz", "Νέο κουίζ")}
        </button>
      </section>
    );
  }

  return (
    <article className="quiz-card">
      <p className="eyebrow">
        {text("Question", "Ερώτηση")} {index + 1} {text("of", "από")}{" "}
        {questions.length}
      </p>
      <h2>{question.question}</h2>
      <div className="option-grid">
        {question.options.map((option) => (
          <button
            className="option-button"
            disabled={pending || Boolean(retryOperation)}
            key={option}
            onClick={() => answer(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
      {retryOperation && !pending ? (
        <button
          className="button secondary"
          onClick={() => void persistCompletion(retryOperation)}
          type="button"
        >
          {text("Retry saving result", "Νέα προσπάθεια αποθήκευσης")}
        </button>
      ) : null}
      {message ? (
        <p className="inline-message" role="status">
          {message}
        </p>
      ) : null}
    </article>
  );
}
