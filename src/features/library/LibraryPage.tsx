import { Link } from "react-router-dom";

const libraryCategories = [
  {
    title: "Books",
    description: "Textbooks, manuals, chapters and longer reference works.",
    action: "Open books",
    to: "/study-materials#chapters",
  },
  {
    title: "Articles",
    description: "Web articles, magazine pieces and focused explanatory resources.",
    action: "Open articles",
    to: "/study-materials",
  },
  {
    title: "Papers",
    description: "Research papers, reports and other evidence-based material.",
    action: "Open papers",
    to: "/study-materials",
  },
  {
    title: "Outsource Notes",
    description: "External lecture notes, uploaded notes, PDFs or source files used as study material.",
    action: "Open outsource notes",
    to: "/study-materials",
  },
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
] as const;

export function LibraryPage() {
  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Learning resources</p>
        <h2>Library</h2>
        <p>Organise your books, articles, papers, outsource notes, personal notes and summaries.</p>
      </header>

      <section className="learning-stage-grid" aria-label="Library categories">
        {libraryCategories.map((category, index) => (
          <article className="learning-stage-card" key={category.title}>
            <span className="stage-number" aria-hidden="true">{index + 1}</span>
            <h3>{category.title}</h3>
            <p>{category.description}</p>
            <Link className="button secondary" to={category.to}>{category.action}</Link>
          </article>
        ))}
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
    </div>
  );
}
