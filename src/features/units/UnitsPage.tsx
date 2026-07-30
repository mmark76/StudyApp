import { studyConfig } from "../../app/studyConfig";
import { useLanguage } from "../../i18n/LanguageContext";
import { useStudyContent } from "../content-import/useStudyContent";

export function UnitsPage() {
  const { text } = useLanguage();
  const { units } = useStudyContent();

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">{text("Subject chapters", "Κεφάλαια μαθήματος")}</p>
        <h2>{text(studyConfig.unitsLabel, "Κεφάλαια")}</h2>
        <p>{text(
          "Learning objectives, summaries and key terms for each chapter.",
          "Στόχοι, περιλήψεις και βασικοί όροι για κάθε κεφάλαιο.",
        )}</p>
      </header>
      {units.length === 0 ? (
        <section className="empty-state">
          <h3>{text("No chapters yet", "Δεν υπάρχουν κεφάλαια")}</h3>
          <p>{text("Use Add content to create your first chapter.", "Χρησιμοποίησε την Προσθήκη περιεχομένου για το πρώτο κεφάλαιο.")}</p>
        </section>
      ) : (
        <div className="card-grid">
          {units.map((unit) => (
            <article className="content-panel" key={unit.id}>
              <p className="eyebrow">{text(studyConfig.unitLabel, "Κεφάλαιο")} {unit.number}</p>
              <h3>{unit.title}</h3>
              <h4>{text("Learning objectives", "Στόχοι μάθησης")}</h4>
              <ul>{unit.objectives.map((item) => <li key={item}>{item}</li>)}</ul>
              <h4>{text("Summary", "Περίληψη")}</h4>
              <ul>{unit.summary.map((item) => <li key={item}>{item}</li>)}</ul>
              <div className="tag-row">{unit.keyTerms.map((term) => <span className="tag" key={term}>{term}</span>)}</div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
