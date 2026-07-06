import { Link } from "react-router-dom";

const sourceStructure = [
  {
    title: "Contents",
    description: "Start with the table of contents and the high-level map of the material.",
  },
  {
    title: "Chapters",
    description: "Break a book, paper or PDF into major learning blocks.",
  },
  {
    title: "Sections / Paragraphs",
    description: "Split each chapter into sections and paragraphs that are easier to study and review.",
  },
  {
    title: "Key Concepts",
    description: "Extract the key ideas, definitions and principles that need to be understood and remembered.",
  },
  {
    title: "Bibliography / References",
    description: "Keep references and source trails connected to the material they support.",
  },
  {
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
              <Link className="button secondary compact" to="/study-materials?add=file">Import from Local Disk</Link>
              <Link className="button secondary compact" to="/study-materials?add=link">Import from Cloud</Link>
              <Link className="button primary compact" to="/study-materials">View {item.title}</Link>
              <Link className="button secondary compact" to="/study-materials">View Material</Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
