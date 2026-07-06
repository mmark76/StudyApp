import { Link } from "react-router-dom";

const sourceStructure = [
  {
    id: "contents",
    title: "Contents",
    description: "Start with the table of contents and the high-level map of the material.",
  },
  {
    id: "chapters",
    title: "Chapters",
    description: "Break a book, paper or PDF into major learning blocks.",
  },
  {
    id: "sections-paragraphs",
    title: "Sections / Paragraphs",
    description: "Split each chapter into sections and paragraphs that are easier to study and review.",
  },
  {
    id: "key-concepts",
    title: "Key Concepts",
    description: "Extract the key ideas, definitions and principles that need to be understood and remembered.",
  },
  {
    id: "bibliography-references",
    title: "Bibliography / References",
    description: "Keep references and source trails connected to the material they support.",
  },
  {
    id: "images-diagrams",
    title: "Images / Diagrams",
    description: "Identify visual evidence, figures, conceptual diagrams, processes and relationships worth remembering.",
  },
] as const;

export function StudyTheoryPage() {
  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Theory and understanding</p>
        <h2>Study</h2>
        <p>Read, structure and understand your materials before turning them into exercises.</p>
      </header>

      <section
        className="learning-stage-grid"
        style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
        aria-label="Study material structure"
      >
        {sourceStructure.map((item, index) => (
          <article className="learning-stage-card" key={item.title}>
            <span className="stage-number" aria-hidden="true">{index + 1}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <div className="button-row">
              <Link className="button secondary compact" to="/study-materials?add=file">Add material from Local Disk</Link>
              <Link className="button secondary compact" to="/study-materials?add=link">Add material from Cloud</Link>
            </div>
          </article>
        ))}
      </section>

      <section className="content-panel">
        <p className="eyebrow">View</p>
        <h3>View structured material</h3>
        <p>Open the study category you want to work with.</p>
        <div className="button-row">
          {sourceStructure.map((item) => (
            <Link className="button secondary compact" key={item.title} to={`/study-materials#${item.id}`}>
              View {item.title}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
