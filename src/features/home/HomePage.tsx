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
  {
    eyebrow: "Getting started",
    title: "How to work with StudyApp",
    description: "A normal workflow for moving from source material to practice and progress.",
    steps: [
      "Add study material: upload local PDFs, documents, images, or save cloud links.",
      "Organize your material: classify files by material type so they are easier to find.",
      "Split large PDFs: use Split PDF Tool to create smaller focused PDFs from a source PDF.",
      "Import flashcards: import units and flashcards from CSV using the required headers.",
      "Review daily: use review mode for spaced repetition.",
      "Take quizzes: use quiz mode to test knowledge.",
      "Track progress: use progress and session data to understand study activity.",
      "Back up progress and settings: use the current backup for progress and settings.",
      "Keep original files safe: StudyApp is local-first and browser-only. Local files stay in this browser, but the current backup does not include local file blobs, so keep original PDFs and files outside StudyApp.",
    ],
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
            {"steps" in space ? (
              <ol className="learning-stage-steps">
                {space.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            ) : (
              <Link className="button primary" to={space.to}>{space.action}</Link>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
