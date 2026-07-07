import { Link } from "react-router-dom";

const homeSpaces = [
  {
    eyebrow: "Read from source",
    title: "Library from Source",
    description: "Read primary and source material: books, articles, papers, source notes, my notes and summaries.",
    action: "Read from source",
    to: "/library",
  },
  {
    eyebrow: "Structured reading",
    title: "Structured Study",
    description: "Read the same material by structure: contents, chapters, sections, key concepts, references and diagrams.",
    action: "Start structured study",
    to: "/study/theory",
  },
  {
    eyebrow: "Practice and memory",
    title: "Learn & Practice",
    description: "Practise and consolidate with flashcards, review, quizzes and progress.",
    action: "Start practice",
    to: "/learn",
  },
  {
    eyebrow: "PDF utility",
    title: "Split PDF Tool",
    description: "Split local PDF files inside this browser without uploading your files.",
    action: "Open split PDF tool",
    to: "/tools#split-pdf",
  },
  {
    eyebrow: "Material management",
    title: "Add / Remove Material",
    description: "Add material to the app or remove saved local files and cloud links.",
    action: "Manage material",
    to: "/study-materials",
  },
] as const;

export function HomePage() {
  return (
    <div className="stack-lg">
      <section className="learning-stage-grid" aria-label="Home study spaces">
        {homeSpaces.map((space) => (
          <article className="learning-stage-card" key={space.title}>
            <p className="eyebrow">{space.eyebrow}</p>
            <h2>{space.title}</h2>
            <p>{space.description}</p>
            <Link className="button primary" to={space.to}>{space.action}</Link>
          </article>
        ))}
      </section>
    </div>
  );
}
