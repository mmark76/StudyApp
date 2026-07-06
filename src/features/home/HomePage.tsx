import { Link } from "react-router-dom";

const homeSpaces = [
  {
    eyebrow: "Library",
    title: "Your library space",
    description: "Store books, articles, papers, source notes, links and files.",
    action: "Open Library",
    to: "/library",
  },
  {
    eyebrow: "Study",
    title: "Your study space",
    description: "Structure contents, chapters, sections, key concepts, references, images and diagrams.",
    action: "Open Study",
    to: "/study/theory",
  },
  {
    eyebrow: "Learn",
    title: "Your learning space",
    description: "Build my notes, summaries, flashcards, review, quizzes and progress.",
    action: "Open Learn",
    to: "/learn",
  },
] as const;

export function HomePage() {
  return (
    <div className="stack-lg">
      <section
        className="learning-stage-grid"
        style={{ gap: "1.5rem" }}
        aria-label="Home study spaces"
      >
        {homeSpaces.map((space) => (
          <article
            className="learning-stage-card"
            key={space.title}
            style={{
              minHeight: "300px",
              padding: "clamp(1.5rem, 2.5vw, 2rem)",
            }}
          >
            <p className="eyebrow">{space.eyebrow}</p>
            <h2 style={{ fontSize: "clamp(1.7rem, 2.2vw, 2.2rem)" }}>{space.title}</h2>
            <p style={{ fontSize: "1.05rem" }}>{space.description}</p>
            <Link
              className="button primary"
              style={{ fontSize: "1rem", padding: "0.85rem 1.15rem" }}
              to={space.to}
            >
              {space.action}
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
