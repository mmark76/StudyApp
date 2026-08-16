import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { Rating } from "../../shared/types/models";
import { createId } from "../../shared/utils/id";
import { useStudyContent } from "../content-import/useStudyContent";
import {
  commitCardRatingOperation,
  StudyCardUnavailableError,
  type CardRatingOperationInput,
  type StudyOperationFailureInjector,
} from "../learn/studyOperationService";

interface StudySessionIdentity {
  id: string;
  startedAt: string;
}

function createSessionIdentity(): StudySessionIdentity {
  return {
    id: createId("session"),
    startedAt: new Date().toISOString(),
  };
}

interface FlashcardsPageProps {
  failureInjector?: StudyOperationFailureInjector;
}

export function FlashcardsPage({ failureInjector }: FlashcardsPageProps = {}) {
  const { text } = useLanguage();
  const { flashcards: availableCards } = useStudyContent();
  const [cards, setCards] = useState(availableCards);
  const [hasStarted, setHasStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [staleContent, setStaleContent] = useState(false);
  const [retryOperation, setRetryOperation] =
    useState<CardRatingOperationInput | null>(null);
  const activeOperationRef = useRef<CardRatingOperationInput | null>(null);
  const cardHeadingRef = useRef<HTMLHeadingElement>(null);
  const staleHeadingRef = useRef<HTMLHeadingElement>(null);
  const [session, setSession] = useState(createSessionIdentity);
  const card = cards[index];

  useEffect(() => {
    if (!hasStarted) setCards(availableCards);
  }, [availableCards, hasStarted]);

  useEffect(() => {
    if (staleContent) {
      staleHeadingRef.current?.focus();
      return;
    }
    if (index > 0 || revealed) cardHeadingRef.current?.focus();
  }, [index, revealed, staleContent]);

  async function persistRating(operation: CardRatingOperationInput) {
    if (pending) return;
    setPending(true);
    setMessage(text("Saving progress...", "Αποθήκευση προόδου..."));

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
        setMessage(text("The session is complete.", "Η συνεδρία ολοκληρώθηκε."));
      } else {
        setIndex((current) => current + 1);
        setMessage("");
      }
    } catch (error) {
      if (error instanceof StudyCardUnavailableError) {
        activeOperationRef.current = null;
        setRetryOperation(null);
        setStaleContent(true);
        return;
      }
      setMessage(
        text(
          "Progress could not be saved. Retry without changing the rating.",
          "Η πρόοδος δεν αποθηκεύτηκε. Δοκίμασε ξανά χωρίς να αλλάξεις την αξιολόγηση.",
        ),
      );
    } finally {
      setPending(false);
    }
  }

  function rate(rating: Rating) {
    if (!card || pending || activeOperationRef.current) return;
    const isFinalCard = index >= cards.length - 1;
    const operation: CardRatingOperationInput = {
      operationId: createId("operation"),
      sessionId: session.id,
      mode: "flashcards",
      cardId: card.id,
      rating,
      startedAt: session.startedAt,
      committedAt: new Date().toISOString(),
      reviewedCards: index + 1,
      correctAnswers: 0,
      completesSession: isFinalCard,
    };

    activeOperationRef.current = operation;
    setHasStarted(true);
    setRetryOperation(operation);
    void persistRating(operation);
  }

  function startNewSession() {
    setCards(availableCards);
    setHasStarted(false);
    setIndex(0);
    setRevealed(false);
    setFinished(false);
    setStaleContent(false);
    setMessage("");
    activeOperationRef.current = null;
    setRetryOperation(null);
    setSession(createSessionIdentity());
  }

  if (staleContent) {
    return (
      <section className="empty-state">
        <h2 ref={staleHeadingRef} tabIndex={-1}>
          {text("Content changed", "Το περιεχόμενο άλλαξε")}
        </h2>
        <p role="alert">
          {text(
            "This card is no longer available. Return to Learn & Practice and start again with the current content.",
            "Αυτή η κάρτα δεν είναι πλέον διαθέσιμη. Επίστρεψε στη Μάθηση και εξάσκηση και ξεκίνησε ξανά με το τρέχον περιεχόμενο.",
          )}
        </p>
        <Link className="button primary" to="/learn#practice-content">
          {text(
            "Return to Learn & Practice",
            "Επιστροφή στη Μάθηση και εξάσκηση",
          )}
        </Link>
      </section>
    );
  }

  if (!card) {
    return (
      <section className="empty-state">
        <h2>{text("There are no flashcards", "Δεν υπάρχουν κάρτες")}</h2>
        <p>
          {text("Add flashcards from the ", "Πρόσθεσε κάρτες από τη σελίδα ")}
          <Link className="text-link" to="/learn#practice-content">
            {text("Add content", "Προσθήκη περιεχομένου")}
          </Link>
          .
        </p>
      </section>
    );
  }

  if (finished) {
    return (
      <section className="empty-state">
        <h2>{text("The session is complete", "Η συνεδρία ολοκληρώθηκε")}</h2>
        <p role="status">{message}</p>
        <button className="button primary" onClick={startNewSession} type="button">
          {text("Start again", "Νέα έναρξη")}
        </button>
      </section>
    );
  }

  return (
    <div className="study-panel">
      <div className="session-progress">
        <span>
          {index + 1} / {cards.length}
        </span>
        <progress max={cards.length} value={index + 1} />
      </div>
      <article className="flashcard">
        <p className="eyebrow">
          {text("Card", "Κάρτα")} {card.number}
        </p>
        <h2 ref={cardHeadingRef} tabIndex={-1}>{revealed ? card.answer : card.question}</h2>
        <div className="tag-row">
          {card.tags.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </article>
      {!revealed ? (
        <button
          className="button primary"
          disabled={pending}
          onClick={() => {
            setHasStarted(true);
            setRevealed(true);
          }}
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
      <p className="inline-message" role="status">
        {message}
      </p>
    </div>
  );
}
