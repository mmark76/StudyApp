import { Link } from "react-router-dom";

const librarySections = [
  {
    title: "Books",
    description: "Textbooks, manuals, chapters and longer reference works.",
    action: "Open book sources",
    to: "/study-materials",
  },
  {
    title: "Articles",
    description: "Web articles, magazine pieces and focused explanatory resources.",
    action: "Open article sources",
    to: "/study-materials",
  },
  {
    title: "Papers",
    description: "Research papers, reports and other evidence-based material.",
    action: "Open paper sources",
    to: "/study-materials",
  },
  {
    title: "Notes",
    description: "Your structured summaries, key ideas and topic-level learning notes.",
    action: "Open notes",
    to: "/units",
  },
] as const;

export function LibraryPage() {
  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Learning resources</p>
        <h2>Library</h2>
        <p>Keep source material and your own processed knowledge in one clear place.</p>
      </header>

      <section className="library-grid" aria-label="Library sections">
        {librarySections.map((section) => (
          <article className="library-card" key={section.title}>
            <h3>{section.title}</h3>
            <p>{section.description}</p>
            <Link className="button secondary" to={section.to}>{section.action}</Link>
          </article>
        ))}
      </section>

      <section className="content-panel">
        <p className="eyebrow">Quick add</p>
        <h3>Add study materials</h3>
        <p>Add a cloud link for material stored online, or keep a private PDF inside this browser on this device.</p>
        <div className="button-row">
          <Link className="button secondary" to="/study-materials?add=link">Add a cloud link</Link>
          <Link className="button secondary" to="/study-materials?add=pdf">Add a PDF from this device</Link>
        </div>
      </section>

      <section className="content-panel library-guidance">
        <div>
          <p className="eyebrow">Your source collection</p>
          <h3>Manage study materials</h3>
          <p>View, open or remove your saved cloud links and local PDFs.</p>
        </div>
        <Link className="button primary" to="/study-materials">Manage study materials</Link>
      </section>
    </div>
  );
}
