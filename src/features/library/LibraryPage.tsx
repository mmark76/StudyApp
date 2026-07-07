import { Link } from "react-router-dom";

const libraryCategories = [
  {
    id: "books",
    title: "Books",
    description: "Read textbooks, manuals, chapters and longer reference works from the original source.",
  },
  {
    id: "articles",
    title: "Articles",
    description: "Read web articles, magazine pieces and focused explanatory resources from the source.",
  },
  {
    id: "papers",
    title: "Papers",
    description: "Read research papers, reports and evidence-based material from the original document.",
  },
  {
    id: "outsource-notes",
    title: "Outsource Notes",
    description: "Read external lecture notes, uploaded notes, PDFs or source files used as study material.",
  },
  {
    id: "my-notes",
    title: "My Notes",
    description: "Read your own important points, observations and study notes from the material you have structured.",
  },
  {
    id: "summaries",
    title: "Summaries",
    description: "Read condensed chapter summaries, learning objectives and key terms before practice.",
  },
] as const;

export function LibraryPage() {
  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Read from source</p>
        <h2>Library from Source</h2>
        <p>Read primary and source material only: books, articles, papers, outsource notes, personal notes and summaries.</p>
      </header>

      <section className="learning-stage-grid" aria-label="Library source reading categories">
        {libraryCategories.map((category, index) => (
          <article className="learning-stage-card" id={category.id} key={category.title} tabIndex={-1}>
            <span className="stage-number" aria-hidden="true">{index + 1}</span>
            <h3>{category.title}</h3>
            <p>{category.description}</p>
            <Link className="button secondary" to={`/library#${category.id}`}>Read</Link>
          </article>
        ))}
      </section>

      <section className="content-panel">
        <p className="eyebrow">Boundary</p>
        <h3>What belongs here?</h3>
        <p>This area is only for reading from source. Adding and removing material is handled separately in Add / Remove Material.</p>
      </section>
    </div>
  );
}
