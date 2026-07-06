import { Link } from "react-router-dom";

const learnTools = [
  {
    title: "My Notes",
    description: "Capture your own important points, observations and study notes from the material you have structured.",
    action: "Open my notes",
    to: "/units",
  },
  {
    title: "Summaries",
    description: "Review condensed chapter summaries, learning objectives and key terms before practice.",
    action: "Open summaries",
    to: "/units",
  },
  {
    title: "Flashcards",
    description: "Use active recall to test whether you can bring an answer back from memory.",
    action: "Open flashcards",
    to: "/flashcards",
  },
  {
    title: "Review",
    description: "Return to cards when they are due and strengthen memory over time.",
    action: "Review due cards",
    to: "/review",
  },
  {
    title: "Quiz",
    description: "Answer mixed questions and check how well you can recognise and apply ideas.",
    action: "Start quiz",
    to: "/quiz",
  },
  {
    title: "Progress",
    description: "See sessions, studied cards and weak points that need more attention.",
    action: "View progress",
    to: "/progress",
  },
] as const;

export function LearnPage() {
  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Practice and memory</p>
        <h2>Learn</h2>
        <p>Turn structured material into your own notes, summaries, active recall, exercises, spaced review and measurable progress.</p>
      </header>

      <section className="learning-stage-grid" aria-label="Learning tools">
        {learnTools.map((tool, index) => (
          <article className="learning-stage-card" key={tool.title}>
            <span className="stage-number" aria-hidden="true">{index + 1}</span>
            <h3>{tool.title}</h3>
            <p>{tool.description}</p>
            <Link className="button secondary" to={tool.to}>{tool.action}</Link>
          </article>
        ))}
      </section>
    </div>
  );
}
