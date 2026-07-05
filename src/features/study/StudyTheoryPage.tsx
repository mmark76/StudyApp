import { Link } from "react-router-dom";
import { useStudyContent } from "../content-import/useStudyContent";

const sourceStructure = [
  {
    title: "Contents",
    description: "Capture the table of contents and the high-level map of the source.",
  },
  {
    title: "Chapters",
    description: "Break a book, paper or PDF into major learning blocks.",
  },
  {
    title: "Paragraphs",
    description: "Reduce dense text into smaller units that can be understood and reviewed.",
  },
  {
    title: "Bibliography",
    description: "Keep references and source trails connected to the material they support.",
  },
  {
    title: "Images",
    description: "Identify visual evidence, examples and figures worth remembering.",
  },
  {
    title: "Diagrams",
    description: "Separate conceptual diagrams, processes, systems and relationships from plain text.",
  },
] as const;

export function StudyTheoryPage() {
  const { units } = useStudyContent();

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Theory and understanding</p>
        <h2>Study</h2>
        <p>Read, structure and understand your sources before turning them into exercises.</p>
      </header>

      <section className="content-panel review-callout">
        <div>
          <p className="eyebrow">Source to knowledge</p>
          <h3>Start from a Library source</h3>
          <p>Choose a book, article, paper, note or local file, then break it into meaningful learning parts.</p>
        </div>
        <Link className="button primary" to="/library">Open Library</Link>
      </section>

      <section className="learning-stage-grid" aria-label="Study source structure">
        {sourceStructure.map((item, index) => (
          <article className="learning-stage-card" key={item.title}>
            <span className="stage-number" aria-hidden="true">{index + 1}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </section>

      <section className="content-panel">
        <p className="eyebrow">Current theory units</p>
        <h3>Topics and notes</h3>
        {units.length === 0 ? (
          <p>No theory topics exist yet. Add content first, then use Learn for flashcards and exercises.</p>
        ) : (
          <p>You currently have {units.length} topic{units.length === 1 ? "" : "s"} available for theory study.</p>
        )}
        <div className="button-row">
          <Link className="button secondary" to="/units">View topics</Link>
          <Link className="button secondary" to="/import">Add theory content</Link>
          <Link className="button secondary" to="/learn">Go to Learn</Link>
        </div>
      </section>
    </div>
  );
}
