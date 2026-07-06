import { Link } from "react-router-dom";

const libraryCategories = [
  {
    title: "Books",
    description: "textbooks, manuals, chapters and longer reference works.",
  },
  {
    title: "Articles",
    description: "web articles, magazine pieces and focused explanatory resources.",
  },
  {
    title: "Papers",
    description: "research papers, reports and other evidence-based material.",
  },
  {
    title: "Notes",
    description: "your structured summaries, key ideas and topic-level learning notes.",
  },
] as const;

export function LibraryPage() {
  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Learning resources</p>
        <h2>Library</h2>
        <p>Store your source material here. Study &amp; Learn will transform it into theory, notes, flashcards and exercises.</p>
      </header>

      <section className="content-panel">
        <p className="eyebrow">Source categories</p>
        <h3>What can you add here?</h3>
        <ul>
          {libraryCategories.map((category) => (
            <li key={category.title}>
              <strong>{category.title}:</strong> {category.description}
            </li>
          ))}
        </ul>
      </section>

      <section className="content-panel">
        <h3>Add or manage your sources</h3>
        <p>Use the same source manager for books, articles, papers and notes.</p>
        <div className="button-row">
          <Link className="button secondary" to="/study-materials?add=file">Add a file from this device</Link>
          <Link className="button secondary" to="/study-materials?add=link">Add a cloud link</Link>
          <Link className="button primary" to="/study-materials">View saved sources</Link>
        </div>
      </section>
    </div>
  );
}
