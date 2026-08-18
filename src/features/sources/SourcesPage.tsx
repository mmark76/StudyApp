import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";

export function SourcesPage() {
  const { text } = useLanguage();

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">{text("Add & organize", "Πρόσθεσε & οργάνωσε")}</p>
        <h2>{text("Sources", "Πηγές")}</h2>
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
          <Link className="button primary" to="/library">
            {text("Open Library", "Άνοιγμα Βιβλιοθήκης")}
          </Link>
        </article>

        <article className="learning-stage-card dashboard-action-card">
          <p className="eyebrow">{text("Study structure", "Δομή μελέτης")}</p>
          <h3>{text("Structured Study", "Δομημένη Μελέτη")}</h3>
          <p>{text(
            "Study material through chapters, sections, concepts and diagrams.",
            "Μελέτησε το υλικό μέσα από κεφάλαια, ενότητες, έννοιες και διαγράμματα.",
          )}</p>
          <Link className="button study" to="/study/theory">
            {text("Open Structured Study", "Άνοιγμα Δομημένης Μελέτης")}
          </Link>
        </article>
      </section>
    </div>
  );
}
