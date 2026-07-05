import { Link } from "react-router-dom";

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
  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Theory and understanding</p>
        <h2>Study</h2>
        <p>Read, structure and understand your sources before turning them into exercises.</p>
      </header>

      <section
        className="learning-stage-grid"
        style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
        aria-label="Study source structure"
      >
        {sourceStructure.map((item, index) => (
          <article className="learning-stage-card" key={item.title}>
            <span className="stage-number" aria-hidden="true">{index + 1}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <div className="button-row">
              <Link className="button secondary compact" to="/study-materials?add=file">From disk</Link>
              <Link className="button secondary compact" to="/study-materials?add=link">From cloud</Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
