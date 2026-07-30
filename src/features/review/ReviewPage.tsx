import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { Rating } from "../../shared/types/models";
import { createId } from "../../shared/utils/id";
import { useStudyContent } from "../content-import/useStudyContent";
import {
  commitCardRatingOperation,
  type CardRatingOperationInput,
  type StudyOperationFailureInjector,
} from "../learn/studyOperationService";
import { buildDueReviewQueue, nextReviewIndex } from "./reviewQueue";

interface ReviewSessionIdentity {
  id: string;
  startedAt: string;
}

function createReviewSessionIdentity(): ReviewSessionIdentity {
  return {
    id: createId("session"),
    startedAt: new Date().toISOString(),
  };
}

interface ReviewPageProps {
  failureInjector?: StudyOperationFailureInjector;
}

export function ReviewPage({ failureInjector }: ReviewPageProps = {}) {
  const { text } = useLanguage();
  const { flashcards } = useStudyContent();
  const progress = useLiveQuery(() => studyDatabase.cardProgress.toArray(), []);
  const [dueCards, setDueCards] = useState<typeof flashcards>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [retryOperation, setRetryOperation] =
    useState<CardRatingOperationInput | null>(null);
  const activeOperationRef = useRef<CardRatingOperationInput | null>(null);
  const [session, setSession] = useState(createReviewSessionIdentity);
  const card = dueCards[index];

  useEffect(() => {
    if (!progress || finished) return;
    setDueCards((current) =>
      current.length > 0 ? current : buildDueReviewQueue(flashcards, progress),
    );
  }, [finished, flashcards, progress]);

  async function persistRating(operation: CardRatingOperationInput) {
    if (pending) return;
    setPending(true);
    setMessage(text("Saving review...", "Αποθήκευση επανάληψης..."));

    try {
      await commitCardRatingOperation(
        operation,
        studyDatabase,
        failureInjector,
      );
      activeOperationRef.current = null;
      setRetryOperation(null);
      setRevealed(false);

      if (operation.completesSession) {
        setFinished(true);
        setMessage(
          text(
            "The review session is complete.",
            "Η συνεδρία επανάληψης ολοκληρώθηκε.",
          ),
        );
      } else {
        setIndex((current) => nextReviewIndex(current));
        setMessage("");
      }
    } catch {
      setMessage(
        text(
          "Review progress could not be saved. Retry the same rating.",
          "Η πρόοδος επανάληψης δεν αποθηκεύτηκε. Δοκίμασε ξανά την ίδια αξιολόγηση.",
        ),
      );
    } finally {
      setPending(false);
    }
  }

  function rate(rating: Rating) {
    if (!card || pending || activeOperationRef.current) return;
    const isFinalCard = index >= dueCards.length - 1;
    const operation: CardRatingOperationInput = {
      operationId: createId("operation"),
      sessionId: session.id,
      mode: "review",
      cardId: card.id,
      rating,
      startedAt: session.startedAt,
      committedAt: new Date().toISOString(),
      reviewedCards: index + 1,
      correctAnswers: 0,
      completesSession: isFinalCard,
    };

    activeOperationRef.current = operation;
    setRetryOperation(operation);
    void persistRating(operation);
  }

  function startAnotherReview() {
    const currentProgress = progress ?? [];
    setDueCards(buildDueReviewQueue(flashcards, currentProgress));
    setIndex(0);
    setRevealed(false);
    setFinished(false);
    setMessage("");
    setPending(false);
    activeOperationRef.current = null;
    setRetryOperation(null);
    setSession(createReviewSessionIdentity());
  }

  if (finished) {
    return (
      <section className="empty-state">
        <h2>{text("Review complete", "Η επανάληψη ολοκληρώθηκε")}</h2>
        <p role="status">{message}</p>
        <button
          className="button primary"
          onClick={startAnotherReview}
          type="button"
        >
          {text("Check for more reviews", "Έλεγχος για νέες επαναλήψεις")}
        </button>
      </section>
    );
  }

  if (!card) {
    return (
      <section className="empty-state">
        <h2>
          {text(
            "There are no cards due for review",
            "Δεν υπάρχουν κάρτες για επανάληψη",
          )}
        </h2>
        <p>
          {text(
            "Cards appear here when their review date arrives.",
            "Οι κάρτες εμφανίζονται εδώ όταν έρθει η ημερομηνία επανάληψης.",
          )}
        </p>
      </section>
    );
  }

  return (
    <div className="study-panel">
      <div className="session-progress">
        <span>
          {index + 1} / {dueCards.length}
        </span>
        <progress max={dueCards.length} value={index + 1} />
      </div>
      <article className="flashcard">
        <p className="eyebrow">{text("Review", "Επανάληψη")}</p>
        <h2>{revealed ? card.answer : card.question}</h2>
      </article>
      {!revealed ? (
        <button
          className="button primary"
          disabled={pending}
          onClick={() => setRevealed(true)}
          type="button"
        >
          {text("Show answer", "Εμφάνιση απάντησης")}
        </button>
      ) : (
        <div className="rating-grid">
          <button
            className="button danger"
            disabled={pending || Boolean(retryOperation)}
            onClick={() => rate(0)}
            type="button"
          >
            0 · {text("Again", "Ξανά")}
          </button>
          <button
            className="button secondary"
            disabled={pending || Boolean(retryOperation)}
            onClick={() => rate(1)}
            type="button"
          >
            1 · {text("Difficult", "Δύσκολο")}
          </button>
          <button
            className="button primary"
            disabled={pending || Boolean(retryOperation)}
            onClick={() => rate(2)}
            type="button"
          >
            2 · {text("Known", "Γνωστό")}
          </button>
        </div>
      )}
      {retryOperation && !pending ? (
        <button
          className="button secondary"
          onClick={() => void persistRating(retryOperation)}
          type="button"
        >
          {text("Retry saving", "Νέα προσπάθεια αποθήκευσης")}
        </button>
      ) : null}
      {message ? (
        <p className="inline-message" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
