import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";

function isWorkspaceSourcesFrame(): boolean {
  return typeof window !== "undefined" && window.name === "studyapp-workspace-sources";
}

export function SourcesPage() {
  const { text } = useLanguage();
  const workspaceSourcesFrame = isWorkspaceSourcesFrame();

  return (
    <div className="stack-lg workspace-beta-sources-page">
      <header className="page-heading">
        <p className="eyebrow">{text("Add & organize", "Πρόσθεσε & οργάνωσε")}</p>
        <h2>{workspaceSourcesFrame
          ? text("Sources & Materials", "Πηγές & Υλικό")
          : text("Sources", "Πηγές")}</h2>
        <p>{text(
          "Choose how you want to work with your study material.",
          "Επίλεξε πώς θέλεις να δουλέψεις με το υλικό μελέτης σου.",
        )}</p>
      </header>

      <section
        aria-label={text("Source study options", "Επιλογές μελέτης πηγών")}
        className="dashboard-action-grid"
      >
        <article className="learning-stage-card dashboard-action-card">
          <p className="eyebrow">{text("Read & manage", "Διάβασε & διαχειρίσου")}</p>
          <h3>{text("Library", "Βιβλιοθήκη")}</h3>
          <p>{text(
            "Add and manage books, articles, papers, notes, summaries and source files.",
            "Πρόσθεσε και διαχειρίσου βιβλία, άρθρα, εργασίες, σημειώσεις, περιλήψεις και αρχεία πηγών.",
          )}</p>
          <p className="field-help">{text(
            "Books · Articles · Papers · External Notes · My Notes · Summaries",
            "Βιβλία · Άρθρα · Εργασίες · Εξωτερικές σημειώσεις · Οι σημειώσεις μου · Περιλήψεις",
          )}</p>
          <Link className="button primary" to="/library">
            {text("Create / Open your Library", "Δημιούργησε / άνοιξε τη Βιβλιοθήκη σου")}
          </Link>
        </article>

        <article className="learning-stage-card dashboard-action-card">
          <p className="eyebrow">{text("Study structure", "Δομή μελέτης")}</p>
          <h3>{text("Structured Study", "Δομημένη Μελέτη")}</h3>
          <p>{text(
            "Organize material through contents, chapters, sections, concepts, references and diagrams.",
            "Οργάνωσε υλικό με περιεχόμενα, κεφάλαια, ενότητες, έννοιες, αναφορές και διαγράμματα.",
          )}</p>
          <div className="button-row">
            <Link className="button study workspace-beta-manual-structuring-action" to="/study/theory">{text("Manual Structuring - import structured files", "Χειροκίνητη δόμηση - εισαγωγή δομημένων αρχείων")}</Link>
            <Link className="button secondary workspace-beta-split-pdf-action" to="/tools">{text("Split PDF Tool", "Εργαλείο χωρισμού PDF")}</Link>
            <button className="button secondary workspace-beta-ai-structuring-unavailable" disabled type="button">{text("AI-Assisted Structuring — Under construction — Not available yet", "Δόμηση με υποστήριξη AI — Υπό κατασκευή — Δεν είναι διαθέσιμη ακόμη")}</button>
          </div>
        </article>
      </section>
    </div>
  );
}
