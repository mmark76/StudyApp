import { useLiveQuery } from "dexie-react-hooks";
import { flashcards } from "../../data/flashcards";
import { units } from "../../data/units";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import { isDue } from "../../shared/utils/date";
import { studyConfig } from "../../app/studyConfig";

export function HomePage() {
  const progress = useLiveQuery(() => studyDatabase.cardProgress.toArray(), []) ?? [];
  const due = progress.filter((item) => isDue(item.nextReviewAt)).length;

  return (
    <div className="stack-lg">
      <section className="hero-panel">
        <p className="eyebrow">Reusable study workspace</p>
        <h2>{studyConfig.subjectName || "Empty study template"}</h2>
        <p>{studyConfig.description}</p>
      </section>
      <section className="stats-grid" aria-label="Statistics">
        <article className="stat-card"><strong>{units.length}</strong><span>{studyConfig.unitsLabel}</span></article>
        <article className="stat-card"><strong>{flashcards.length}</strong><span>Flashcards</span></article>
        <article className="stat-card"><strong>{progress.length}</strong><span>Studied</span></article>
        <article className="stat-card"><strong>{due}</strong><span>Due for review</span></article>
      </section>
      {units.length === 0 && flashcards.length === 0 ? (
        <section className="empty-state">
          <h3>The content is empty</h3>
          <p>Add units and cards in <code>src/data/units.ts</code> and <code>src/data/flashcards.ts</code>.</p>
        </section>
      ) : null}
    </div>
  );
}
