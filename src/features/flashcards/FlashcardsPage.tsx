import { Link } from "react-router-dom";
import { useRef, useState } from "react";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { Rating } from "../../shared/types/models";
import { createId } from "../../shared/utils/id";
import { useStudyContent } from "../content-import/useStudyContent";
import { scheduleReview } from "../review/spacedRepetition";

export function FlashcardsPage() {
  const { flashcards: cards } = useStudyContent();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState("");
  const saving = useRef(false);
  const card = cards[index];

  async function rate(rating: Rating) {
    if (!card || saving.current) return;
    saving.current = true;
    try {
      const previous = await studyDatabase.cardProgress.get(card.id);
      await studyDatabase.cardProgress.put(scheduleReview(card.id, rating, previous));
      const nextIndex = index + 1;
      if (nextIndex >= cards.length) {
        await studyDatabase.studySessions.add({
          id: createId("session"), mode: "flashcards", startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(), reviewedCards: cards.length, correctAnswers: 0
        });
        setMessage("The session is complete.");
        setIndex(0);
      } else {
        setIndex(nextIndex);
      }
      setRevealed(false);
    } finally {
      saving.current = false;
    }
  }

  if (!card) {
    return (
      <section className="empty-state">
        <h2>There are no flashcards</h2>
        <p>Add flashcards from the <Link className="text-link" to="/import">Import</Link> page. You can add one manually or use the spreadsheet template.</p>
      </section>
    );
  }

  return (
    <div className="study-panel">
      <div className="session-progress"><span>{index + 1} / {cards.length}</span><progress max={cards.length} value={index + 1} /></div>
      <article className="flashcard">
        <p className="eyebrow">Card {card.number}</p>
        <h2>{revealed ? card.answer : card.question}</h2>
        <div className="tag-row">{card.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
      </article>
      {!revealed ? <button className="button primary" onClick={() => setRevealed(true)}>Show answer</button> : (
        <div className="rating-grid">
          <button className="button danger" onClick={() => void rate(0)}>0 · Again</button>
          <button className="button secondary" onClick={() => void rate(1)}>1 · Difficult</button>
          <button className="button primary" onClick={() => void rate(2)}>2 · Known</button>
        </div>
      )}
      <p className="inline-message" role="status">{message}</p>
    </div>
  );
}
