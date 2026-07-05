import { Link } from "react-router-dom";

const studyLearnAreas = [
  {
    title: "Study",
    label: "Theory",
    description: "Read, structure and understand books, PDFs, articles, papers and notes.",
    examples: ["Contents", "Chapters", "Paragraphs", "Bibliography", "Images", "Diagrams"],
    action: "Open Study",
    to: "/study/theory",
  },
  {
    title: "Learn",
    label: "Exercises",
    description: "Practice active recall with flashcards, due review, quizzes and progress tracking.",
    examples: ["Flashcards", "Review", "Quiz", "Practice", "Weak points", "Progress"],
    action: "Open Learn",
    to: "/learn",
  },
] as const;

export function StudyLearnPage() {
  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Theory and practice</p>
        <h2>Study &amp; Learn</h2>
        <p>Use Study to understand theory. Use Learn to practise, recall and test what you know.</p>
      </header>

      <section className="learning-stage-grid" aria-label="Study and Learn areas">
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
          <h3>Library → Study → Learn</h3>
          <p>Keep your sources in the Library, break them into theory inside Study, then turn that theory into exercises in Learn.</p>
        </div>
        <Link className="button secondary" to="/library">Open Library</Link>
      </section>
    </div>
  );
}
