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
        <p>Add study material here. Local files stay in this browser on this device; cloud materials are saved as links.</p>
      </header>

      <section className="content-panel">
        <p className="eyebrow">Material categories</p>
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
        <p className="eyebrow">Storage clarification</p>
        <h3>Where is it stored?</h3>
        <ul>
          <li><strong>Local files:</strong> stored only inside this browser on this device. They are not uploaded to a server and are not synced to other devices.</li>
          <li><strong>Cloud links:</strong> only the name and shared link are saved in the app. The actual file stays in your cloud service.</li>
          <li><strong>Backup:</strong> local files are not included when you save a copy of your study progress. Keep the original files somewhere safe.</li>
          <li><strong>Browser data:</strong> local files may be lost if browser/site data is cleared, if private browsing is used, or if the browser removes storage because of low disk space.</li>
        </ul>
      </section>

      <section className="content-panel">
        <h3>Add or manage your materials</h3>
        <p>Use the same material manager for books, articles, papers and notes.</p>
        <div className="button-row">
          <Link className="button secondary" to="/study-materials?add=file">Add a file from this device</Link>
          <Link className="button secondary" to="/study-materials?add=link">Add a cloud link</Link>
          <Link className="button primary" to="/study-materials">View saved materials</Link>
        </div>
      </section>
    </div>
  );
}
