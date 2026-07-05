import { Link } from "react-router-dom";

const homeSpaces = [
  {
    eyebrow: "Library",
    title: "Your library space",
    description: "Store books, articles, papers, notes, links and files.",
    action: "Open Library",
    to: "/library",
  },
  {
    eyebrow: "Study",
    title: "Your study space",
    description: "Read, structure and understand your theory.",
    action: "Open Study",
    to: "/study/theory",
  },
  {
    eyebrow: "Learn",
    title: "Your learning space",
    description: "Practise with flashcards, review, quizzes and progress.",
    action: "Open Learn",
    to: "/learn",
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
