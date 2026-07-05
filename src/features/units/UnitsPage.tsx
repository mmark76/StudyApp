import { studyConfig } from "../../app/studyConfig";
import { useStudyContent } from "../content-import/useStudyContent";

export function UnitsPage() {
  const { units } = useStudyContent();

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Subject chapters</p>
        <h2>{studyConfig.unitsLabel}</h2>
        <p>Learning objectives, summaries, and key terms for each chapter.</p>
      </header>
      {units.length === 0 ? (
        <section className="empty-state"><h3>No chapters yet</h3><p>Use <strong>Add content</strong> to create your first chapter.</p></section>
      ) : (
        <div className="card-grid">
          {units.map((unit) => (
            <article className="content-panel" key={unit.id}>
              <p className="eyebrow">{studyConfig.unitLabel} {unit.number}</p>
              <h3>{unit.title}</h3>
              <h4>Learning objectives</h4>
              <ul>{unit.objectives.map((item) => <li key={item}>{item}</li>)}</ul>
              <h4>Summary</h4>
              <ul>{unit.summary.map((item) => <li key={item}>{item}</li>)}</ul>
              <div className="tag-row">{unit.keyTerms.map((term) => <span className="tag" key={term}>{term}</span>)}</div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
