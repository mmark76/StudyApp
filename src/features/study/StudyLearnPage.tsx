import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";

export function StudyLearnPage() {
  const { text } = useLanguage();
  const studyLearnAreas = [
    {
      title: text("Structured Study", "Δομημένη Μελέτη"),
      label: text("Structured reading", "Δομημένη ανάγνωση"),
      description: text(
        "Read material by chapters, sections, concepts and diagrams.",
        "Μελέτησε το υλικό ανά κεφάλαιο, ενότητα, έννοια και διάγραμμα.",
      ),
      examples: [
        text("Contents", "Περιεχόμενα"),
        text("Chapters", "Κεφάλαια"),
        text("Sections", "Ενότητες"),
        text("Key concepts", "Βασικές έννοιες"),
        text("References", "Αναφορές"),
        text("Diagrams", "Διαγράμματα"),
      ],
      action: text("Start studying", "Έναρξη μελέτης"),
      to: "/study/theory",
    },
    {
      title: text("Learn & Practice", "Μάθηση & Εξάσκηση"),
      label: text("Practice and memory", "Εξάσκηση και μνήμη"),
      description: text(
        "Practise with flashcards, review, quizzes and progress.",
        "Εξασκήσου με κάρτες, επανάληψη, κουίζ και παρακολούθηση προόδου.",
      ),
      examples: [
        text("Flashcards", "Κάρτες"),
        text("Review", "Επανάληψη"),
        text("Quiz", "Κουίζ"),
        text("Practice", "Εξάσκηση"),
        text("Weak points", "Αδύναμα σημεία"),
        text("Progress", "Πρόοδος"),
      ],
      action: text("Start practice", "Έναρξη εξάσκησης"),
      to: "/learn",
    },
  ];

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">{text("Study and practice", "Μελέτη και εξάσκηση")}</p>
        <h2>{text("Structured Study & Learn", "Δομημένη Μελέτη & Μάθηση")}</h2>
        <p>{text("Study the material, then practise it.", "Μελέτησε το υλικό και μετά εξασκήσου σε αυτό.")}</p>
      </header>

      <section className="learning-stage-grid" aria-label={text("Study areas", "Περιοχές μελέτης")}>
        {studyLearnAreas.map((area, index) => (
          <article className="learning-stage-card study-learn-area-card" key={area.title}>
            <span className="stage-number" aria-hidden="true">{index + 1}</span>
            <p className="eyebrow">{area.label}</p>
            <h3>{area.title}</h3>
            <p className="study-learn-area-description">{area.description}</p>
            <div className="tag-row study-learn-area-tags">
              {area.examples.map((example) => <span className="tag" key={example}>{example}</span>)}
            </div>
            <Link className="button primary" to={area.to}>{area.action}</Link>
          </article>
        ))}
      </section>

      <section className="content-panel review-callout">
        <div>
          <p className="eyebrow">{text("Learning flow", "Ροή μάθησης")}</p>
          <h3>{text(
            "Library → Structured Study → Learn & Practice",
            "Βιβλιοθήκη → Δομημένη Μελέτη → Μάθηση & Εξάσκηση",
          )}</h3>
        </div>
        <Link className="button secondary" to="/library">{text("Open Library", "Άνοιγμα Βιβλιοθήκης")}</Link>
      </section>
    </div>
  );
}
