import { useState } from "react";
import { Link } from "react-router-dom";

const libraryTabs = [
  {
    id: "books",
    title: "Books",
    description: "Textbooks, manuals, chapters and longer reference works.",
    examples: ["Textbook", "Manual", "Chapter", "Reference"],
  },
  {
    id: "articles",
    title: "Articles",
    description: "Web articles, magazine pieces and focused explanatory resources.",
    examples: ["Web article", "Essay", "Commentary", "Guide"],
  },
  {
    id: "papers",
    title: "Papers",
    description: "Research papers, reports and other evidence-based material.",
    examples: ["Research paper", "Report", "Study", "Standard"],
  },
  {
    id: "notes",
    title: "Notes",
    description: "Your structured summaries, key ideas and topic-level learning notes.",
    examples: ["Summary", "Key terms", "Personal notes", "Study outline"],
  },
] as const;

type LibraryTabId = typeof libraryTabs[number]["id"];

export function LibraryPage() {
  const [activeTab, setActiveTab] = useState<LibraryTabId>("books");
  const selectedTab = libraryTabs.find((tab) => tab.id === activeTab) ?? libraryTabs[0];

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Learning resources</p>
        <h2>Library</h2>
        <p>Store your source material here. Study &amp; Learn will transform it into theory, notes, flashcards and exercises.</p>
      </header>

      <section className="content-panel">
        <p className="eyebrow">Source categories</p>
        <h3>Choose a Library tab</h3>
        <div className="button-row" role="tablist" aria-label="Library categories">
          {libraryTabs.map((tab) => (
            <button
              aria-selected={tab.id === activeTab}
              className={tab.id === activeTab ? "button primary" : "button secondary"}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
            >
              {tab.title}
            </button>
          ))}
        </div>
      </section>

      <section className="content-panel" role="tabpanel">
        <p className="eyebrow">{selectedTab.title}</p>
        <h3>{selectedTab.description}</h3>
        <div className="tag-row">
          {selectedTab.examples.map((example) => <span className="tag" key={example}>{example}</span>)}
        </div>
        <div className="button-row">
          <Link className="button secondary" to="/study-materials?add=link">Add a cloud link</Link>
          <Link className="button secondary" to="/study-materials?add=file">Add a file from this device</Link>
          <Link className="button primary" to="/study-materials">Manage sources</Link>
        </div>
      </section>

      <section className="content-panel review-callout">
        <div>
          <p className="eyebrow">From storage to understanding</p>
          <h3>Send sources to Study</h3>
          <p>After you add a source, use Study to break it into contents, chapters, paragraphs, bibliography, images and diagrams.</p>
        </div>
        <Link className="button primary" to="/study/theory">Open Study</Link>
      </section>
    </div>
  );
}
