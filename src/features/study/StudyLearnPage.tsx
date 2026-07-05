import { Link } from "react-router-dom";

const learningStages = [
  {
    title: "Focus",
    description: "Choose what matters now and begin with a clear learning goal.",
    action: "Set today's direction",
    to: "/",
  },
  {
    title: "Understand",
    description: "Work through topics, key ideas and explanations before testing yourself.",
    action: "Explore topics",
    to: "/units",
  },
  {
    title: "Recall",
    description: "Bring knowledge back from memory with flashcards and active retrieval.",
    action: "Start recall",
    to: "/flashcards",
  },
  {
    title: "Apply",
    description: "Use what you know in questions, comparisons and new situations.",
    action: "Start a quiz",
    to: "/quiz",
  },
  {
    title: "Reflect",
    description: "Review performance, identify weak areas and decide what to study next.",
    action: "View progress",
    to: "/progress",
  },
] as const;

export function StudyLearnPage() {
  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">The learning cycle</p>
        <h2>Study &amp; Learn</h2>
        <p>Move from focused attention to understanding, retrieval, application and reflection.</p>
      </header>

      <section className="learning-stage-grid" aria-label="Learning stages">
        {learningStages.map((stage, index) => (
          <article className="learning-stage-card" key={stage.title}>
            <span className="stage-number" aria-hidden="true">{index + 1}</span>
            <h3>{stage.title}</h3>
            <p>{stage.description}</p>
            <Link className="button secondary" to={stage.to}>{stage.action}</Link>
          </article>
        ))}
      </section>

      <section className="content-panel">
        <p className="eyebrow">Your learning tools</p>
        <h3>Learning setup and progress</h3>
        <p>Import units and flashcards for active study, then follow your progress and statistics.</p>
        <div className="button-row">
          <Link className="button secondary" to="/import">Import units &amp; flashcards</Link>
          <Link className="button secondary" to="/progress">Progress &amp; statistics</Link>
        </div>
      </section>

      <section className="content-panel review-callout">
        <div>
          <p className="eyebrow">Memory over time</p>
          <h3>Spaced review</h3>
          <p>Return to knowledge when it is due, rather than rereading everything from the beginning.</p>
        </div>
        <Link className="button primary" to="/review">Review due cards</Link>
      </section>
    </div>
  );
}
