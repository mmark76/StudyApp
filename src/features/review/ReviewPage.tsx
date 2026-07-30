import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { Rating } from "../../shared/types/models";
import { useStudyContent } from "../content-import/useStudyContent";
import { buildDueReviewQueue, nextReviewIndex } from "./reviewQueue";
import { scheduleReview } from "./spacedRepetition";

export function ReviewPage() {
  const { text } = useLanguage();
  const { flashcards } = useStudyContent();
  const progress = useLiveQuery(() => studyDatabase.cardProgress.toArray(), []);
  const [dueCards, setDueCards] = useState<typeof flashcards>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  const card = dueCards[index];

  useEffect(() => {
    if (!progress) return;
    setDueCards((current) => current.length > 0 ? current : buildDueReviewQueue(flashcards, progress));
  }, [flashcards, progress]);

  async function rate(rating: Rating) {
    if (!card || lock.current) return;
    lock.current = true;
    try {
      const previous = await studyDatabase.cardProgress.get(card.id);
      await studyDatabase.cardProgress.put(scheduleReview(card.id, rating, previous));
      setRevealed(false);
      setIndex((current) => nextReviewIndex(current));
      setMessage("");
    } catch {
      setMessage(text("Progress could not be saved.", "Η πρόοδος δεν αποθηκεύτηκε."));
    } finally {
      lock.current = false;
    }
  }

  if (!card) {
    return (
      <section className="empty-state">
        <h2>{text("There are no cards due for review", "Δεν υπάρχουν κάρτες για επανάληψη")}</h2>
        <p>{text("Cards appear here when their review date arrives.", "Οι κάρτες εμφανίζονται εδώ όταν έρθει η ημερομηνία επανάληψης.")}</p>
      </section>
    );
  }

  return (
    <div className="study-panel">
      <div className="session-progress"><span>{index + 1} / {dueCards.length}</span><progress max={dueCards.length} value={index + 1} /></div>
      <article className="flashcard"><p className="eyebrow">{text("Review", "Επανάληψη")}</p><h2>{revealed ? card.answer : card.question}</h2></article>
      {!revealed ? (
        <button className="button primary" onClick={() => setRevealed(true)}>{text("Show answer", "Εμφάνιση απάντησης")}</button>
      ) : (
        <div className="rating-grid">
          <button className="button danger" onClick={() => void rate(0)}>0 · {text("Again", "Ξανά")}</button>
          <button className="button secondary" onClick={() => void rate(1)}>1 · {text("Difficult", "Δύσκολο")}</button>
          <button className="button primary" onClick={() => void rate(2)}>2 · {text("Known", "Γνωστό")}</button>
        </div>
      )}
      {message && <p className="inline-message" role="status">{message}</p>}
    </div>
  );
}
