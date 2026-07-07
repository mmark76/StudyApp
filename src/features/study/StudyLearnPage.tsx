import { Link } from "react-router-dom";

const studyLearnAreas = [
  {
    title: "Structured Study",
    label: "Structured reading",
    description: "Read and understand material by structure: contents, chapters, sections, key concepts, references, images and diagrams.",
    examples: ["Contents", "Chapters", "Sections", "Key concepts", "References", "Diagrams"],
    action: "Start structured study",
    to: "/study/theory",
  },
  {
    title: "Learn & Practice",
    label: "Practice and memory",
    description: "Practise active recall with flashcards, due review, quizzes and progress tracking.",
    examples: ["Flashcards", "Review", "Quiz", "Practice", "Weak points", "Progress"],
    action: "Start practice",
    to: "/learn",
  },
] as const;

export function StudyLearnPage() {
  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Structured reading and practice</p>
        <h2>Structured Study &amp; Learn</h2>
        <p>Use Structured Study to read and understand material. Use Learn &amp; Practice to consolidate it.</p>
      </header>

      <section className="learning-stage-grid" aria-label="Structured Study and Learn areas">
        {studyLearnAreas.map((area, index) => (
          <article className="learning-stage-card study-learn-area-card" key={area.title}>
            <span className="stage-number" aria-hidden="true">{index + 1}</span>
            <p className="eyebrow">{area.label}</p>
            <h3>{area.title}</h3>
            <p className="study-learn-area-description">{area.description}</p>
            <div className="tag-row study-learn-area-tags">
              {area.examples.map((example) => <span className="tag" key={example}>{example}</span>)}
            </div>
            <Link className="button primary" to={area.to}>{area.action}</Link>
          </article>
        ))}
      </section>

      <section className="content-panel review-callout">
        <div>
          <p className="eyebrow">Learning flow</p>
          <h3>Library from Source → Structured Study → Learn &amp; Practice</h3>
          <p>Read from source first, study the same material through structure, then practise and consolidate it.</p>
        </div>
        <Link className="button secondary" to="/library">Read from source</Link>
      </section>
    </div>
  );
}
