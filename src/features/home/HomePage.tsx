import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  StorageNotice,
  storageNoticePlacements,
} from "../../shared/components/StorageNotice";

interface HomeSpace {
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  to?: string;
  guideSteps?: string[];
}

export function HomePage() {
  const { text } = useLanguage();
  const guideDialogRef = useRef<HTMLDialogElement | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const homeSpaces: HomeSpace[] = [
    {
      eyebrow: text("Read from source", "Μελέτη από την πηγή"),
      title: text("Library", "Βιβλιοθήκη"),
      description: text(
        "Read books, articles, papers, notes and summaries.",
        "Μελέτησε βιβλία, άρθρα, εργασίες, σημειώσεις και περιλήψεις.",
      ),
      action: text("Open Library", "Άνοιγμα Βιβλιοθήκης"),
      to: "/library",
    },
    {
      eyebrow: text("Structured reading", "Δομημένη ανάγνωση"),
      title: text("Structured Study", "Δομημένη Μελέτη"),
      description: text(
        "Study material by chapters, sections, concepts and diagrams.",
        "Μελέτησε το υλικό ανά κεφάλαιο, ενότητα, έννοια και διάγραμμα.",
      ),
      action: text("Start studying", "Έναρξη μελέτης"),
      to: "/study/theory",
    },
    {
      eyebrow: text("Practice and memory", "Εξάσκηση και μνήμη"),
      title: text("Learn & Practice", "Μάθηση & Εξάσκηση"),
      description: text(
        "Practise with flashcards, review and quizzes.",
        "Εξασκήσου με κάρτες, επανάληψη και κουίζ.",
      ),
      action: text("Start practice", "Έναρξη εξάσκησης"),
      to: "/learn",
    },
    {
      eyebrow: text("PDF tool", "Εργαλείο PDF"),
      title: text("Split PDF Tool", "Διαχωρισμός PDF"),
      description: text(
        "Split PDF files locally in your browser.",
        "Διαχώρισε PDF τοπικά στον browser.",
      ),
      action: text("Open tool", "Άνοιγμα εργαλείου"),
      to: "/tools#split-pdf",
    },
    {
      eyebrow: text("AI study help", "Βοήθεια AI"),
      title: text("AI Assistant guide", "Οδηγός Βοηθού AI"),
      description: text(
        "See the available AI options.",
        "Δες τις διαθέσιμες επιλογές AI.",
      ),
      action: text("Open AI guide", "Άνοιγμα οδηγού AI"),
      to: "/ai-assistant-guide",
    },
    {
      eyebrow: text("Getting started", "Ξεκίνημα"),
      title: text("How to use StudyApp", "Πώς χρησιμοποιείται το StudyApp"),
      description: text(
        "A simple path from source material to practice.",
        "Μια απλή διαδρομή από το υλικό στην εξάσκηση.",
      ),
      action: text("Open guide", "Άνοιγμα οδηγού"),
      guideSteps: [
        text("Add material to Library or Structured Study.", "Πρόσθεσε υλικό στη Βιβλιοθήκη ή στη Δομημένη Μελέτη."),
        text("Classify files so they are easy to find.", "Ταξινόμησε τα αρχεία για να τα βρίσκεις εύκολα."),
        text("Split large PDFs when needed.", "Διαχώρισε μεγάλα PDF όταν χρειάζεται."),
        text("Create or import chapters and flashcards.", "Δημιούργησε ή εισήγαγε κεφάλαια και κάρτες."),
        text("Use review and quizzes regularly.", "Χρησιμοποίησε συχνά την επανάληψη και τα κουίζ."),
        text("Save a backup of your progress.", "Αποθήκευε backup της προόδου σου."),
      ],
    },
  ];

  const guideSpace = homeSpaces.find((space) => space.guideSteps);

  useEffect(() => {
    const dialog = guideDialogRef.current;
    if (!dialog) return;

    if (isGuideOpen && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!isGuideOpen && dialog.open) dialog.close();
  }, [isGuideOpen]);

  return (
    <div className="stack-lg">
      <StorageNotice kind={storageNoticePlacements.home} />

      <section className="learning-stage-grid" aria-label={text("Home study spaces", "Χώροι μελέτης")}>
        {homeSpaces.map((space) => (
          <article className="learning-stage-card" key={space.title}>
            <p className="eyebrow">{space.eyebrow}</p>
            <h2>{space.title}</h2>
            <p>{space.description}</p>
            {space.guideSteps ? (
              <button className="button primary" type="button" onClick={() => setIsGuideOpen(true)}>{space.action}</button>
            ) : (
              <Link className="button primary" to={space.to ?? "/"}>{space.action}</Link>
            )}
          </article>
        ))}
      </section>

      {guideSpace && (
        <dialog
          aria-labelledby="home-guide-title"
          className="home-guide-dialog"
          onClose={() => setIsGuideOpen(false)}
          ref={guideDialogRef}
        >
          <p className="eyebrow">{guideSpace.eyebrow}</p>
          <h2 id="home-guide-title">{guideSpace.title}</h2>
          <p>{guideSpace.description}</p>
          <ol className="learning-stage-steps">
            {guideSpace.guideSteps?.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <div className="home-guide-actions">
            <button className="button secondary" type="button" onClick={() => setIsGuideOpen(false)}>
              {text("Close", "Κλείσιμο")}
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}
