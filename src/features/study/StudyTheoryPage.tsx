import { Link } from "react-router-dom";

const sourceStructure = [
  {
    id: "contents",
    title: "Contents",
    description: "Read the table of contents and the high-level map of the material.",
  },
  {
    id: "chapters",
    title: "Chapters",
    description: "Read the material as major learning blocks inside a book, paper or PDF.",
  },
  {
    id: "sections-paragraphs",
    title: "Sections / Paragraphs",
    description: "Read smaller parts inside chapters for focused study and review.",
  },
  {
    id: "key-concepts",
    title: "Key Concepts",
    description: "Read the important ideas, definitions and principles that need to be understood.",
  },
  {
    id: "bibliography-references",
    title: "Bibliography / References",
    description: "Read references and source trails connected to the material they support.",
  },
  {
    id: "images-diagrams",
    title: "Images / Diagrams",
    description: "Read visual evidence, figures, diagrams, processes and relationships.",
  },
] as const;

export function StudyTheoryPage() {
  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Structured reading</p>
        <h2>Structured Study</h2>
        <p>Read and understand the same material through contents, chapters, sections, concepts, references and diagrams.</p>
      </header>

      <section
        className="learning-stage-grid"
        style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
        aria-label="Structured Study reading levels"
      >
        {sourceStructure.map((item, index) => (
          <article className="learning-stage-card" id={item.id} key={item.title} tabIndex={-1}>
            <span className="stage-number" aria-hidden="true">{index + 1}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <Link className="button secondary" to={`/study/theory#${item.id}`}>Read</Link>
          </article>
        ))}
      </section>
    </div>
  );
}
