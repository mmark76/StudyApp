import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  StorageNotice,
  storageNoticePlacements,
} from "../../shared/components/StorageNotice";
import "./HomePage.css";

interface HomeAction {
  label: string;
  className: string;
  to: string;
}

interface HomeSpace {
  eyebrow: string;
  title: string;
  description: string;
  detail: string;
  actions: HomeAction[];
}

interface GuideContent {
  eyebrow: string;
  title: string;
  description: string;
  intro: string;
  steps: string[];
}

export function HomePage() {
  const { text } = useLanguage();
  const guideDialogRef = useRef<HTMLDialogElement | null>(null);
  const guideCloseButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const homeSpaces: HomeSpace[] = [
    {
      eyebrow: text("Sources", "Πηγές"),
      title: text("Sources", "Πηγές"),
      description: text(
        "Add, read and organise the material you want to learn.",
        "Πρόσθεσε, διάβασε και οργάνωσε το υλικό που θέλεις να μάθεις.",
      ),
      detail: text(
        "Use Library for source files and Structured Study for chapters, sections, concepts and diagrams.",
        "Χρησιμοποίησε τη Βιβλιοθήκη για αρχεία πηγών και τη Δομημένη Μελέτη για κεφάλαια, ενότητες, έννοιες και διαγράμματα.",
      ),
      actions: [
        {
          label: text("Open Library", "Άνοιγμα Βιβλιοθήκης"),
          className: "button primary",
          to: "/library",
        },
        {
          label: text("Structured Study", "Δομημένη Μελέτη"),
          className: "button study",
          to: "/study/theory",
        },
      ],
    },
    {
      eyebrow: text("Learn", "Μάθηση"),
      title: text("Learn & Practice", "Μάθηση & Εξάσκηση"),
      description: text(
        "Turn study material into active learning and long-term review.",
        "Μετέτρεψε το υλικό μελέτης σε ενεργή μάθηση και μακροχρόνια επανάληψη.",
      ),
      detail: text(
        "Create or import practice content, use flashcards, review due cards, take quizzes and track progress.",
        "Δημιούργησε ή εισήγαγε υλικό εξάσκησης, χρησιμοποίησε κάρτες, επανάλαβε τις κάρτες που είναι έτοιμες, κάνε κουίζ και παρακολούθησε την πρόοδό σου.",
      ),
      actions: [
        {
          label: text("Start learning", "Έναρξη μάθησης"),
          className: "button practice",
          to: "/learn",
        },
      ],
    },
    {
      eyebrow: text("AI", "AI"),
      title: text("AI Studio", "AI Studio"),
      description: text(
        "Use AI when it helps you understand, create or practise.",
        "Χρησιμοποίησε AI όταν σε βοηθά να κατανοήσεις, να δημιουργήσεις ή να εξασκηθείς.",
      ),
      detail: text(
        "Use the current StudyApp AI Assistant and see the planned ChatGPT App / MCP and StudyApp AI / API options.",
        "Χρησιμοποίησε τον σημερινό Βοηθό AI του StudyApp και δες τις σχεδιαζόμενες επιλογές ChatGPT App / MCP και StudyApp AI / API.",
      ),
      actions: [
        {
          label: text("Open AI options", "Άνοιγμα επιλογών AI"),
          className: "button assistant",
          to: "/ai-assistant-guide",
        },
        {
          label: text("Compare AI modes", "Σύγκριση επιλογών AI"),
          className: "button secondary",
          to: "/ai-assistant-comparison",
        },
      ],
    },
  ];

  const guide: GuideContent = {
    eyebrow: text("Getting started", "Ξεκίνημα"),
    title: text("How to use StudyApp", "Πώς να χρησιμοποιήσετε το StudyApp"),
    description: text(
      "A simple path from source material to practice.",
      "Μια απλή διαδρομή από το υλικό στην εξάσκηση.",
    ),
    intro: text(
      "StudyApp helps you collect your study material and sources, divide them into smaller parts, organize and manage them, study in a structured way, practise with flashcards, quizzes and reviews, and track your progress — with the goal of better understanding, recall and long-term retention.",
      "Το StudyApp βοηθά τον χρήστη να συγκεντρώνει το υλικό και τις πηγές του, να τα χωρίζει σε μικρότερα μέρη, να τα οργανώνει και να τα διαχειρίζεται, να μελετά με δομημένο τρόπο, να εξασκείται με κάρτες, κουίζ και επαναλήψεις και να παρακολουθεί την πρόοδό του, με στόχο την καλύτερη κατανόηση, ανάκληση και μακροχρόνια διατήρηση της γνώσης.",
    ),
    steps: [
      text(
        "Add your source material to Library or Structured Study.",
        "Προσθέστε το αρχικό υλικό στη Βιβλιοθήκη ή στο Structured Study.",
      ),
      text(
        "Use the StudyApp AI Assistant to create study content.",
        "Χρησιμοποιήστε το StudyApp AI Assistant για να δημιουργήσετε εκπαιδευτικό περιεχόμενο.",
      ),
      text(
        "Download the generated PDF or CSV files. They are not transferred automatically.",
        "Κατεβάστε τα αρχεία PDF ή CSV. Δεν μεταφέρονται αυτόματα στο StudyApp.",
      ),
      text(
        "For new practice content, open Learn & Practice → Manage Practice Content.",
        "Για νέο υλικό εξάσκησης, ανοίξτε Learn & Practice → Διαχείριση περιεχομένου εξάσκησης.",
      ),
      text(
        "Import the Chapters CSV first, then the Flashcards CSV.",
        "Εισαγάγετε πρώτα το Chapters CSV και μετά το Flashcards CSV.",
      ),
      text(
        "Study with Flashcards, Review and Quiz.",
        "Μελετήστε με Flashcards, Review και Quiz.",
      ),
      text(
        "Save regular backups of your local data.",
        "Δημιουργείτε τακτικά αντίγραφα ασφαλείας των τοπικών δεδομένων.",
      ),
    ],
  };

  useEffect(() => {
    const dialog = guideDialogRef.current;
    if (!dialog) return;

    if (isGuideOpen && !dialog.open) {
      dialog.showModal();
      guideCloseButtonRef.current?.focus();
      return;
    }

    if (!isGuideOpen && dialog.open) dialog.close();
  }, [isGuideOpen]);

  return (
    <div className="stack-lg home-page">
      <section
        aria-label={text("Main study workflow", "Κύρια διαδρομή μελέτης")}
        className="home-primary-grid"
      >
        {homeSpaces.map((space) => (
          <article className="learning-stage-card home-primary-card" key={space.title}>
            <p className="eyebrow">{space.eyebrow}</p>
            <h2>{space.title}</h2>
            <p className="home-primary-description">{space.description}</p>
            <p className="field-help home-primary-detail">{space.detail}</p>
            <div className="home-card-actions">
              {space.actions.map((action) => (
                <Link className={action.className} key={action.to} to={action.to}>
                  {action.label}
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section
        aria-labelledby="home-tools-heading"
        className="home-secondary-panel"
      >
        <div>
          <p className="eyebrow">{text("Utilities", "Βοηθητικά")}</p>
          <h2 id="home-tools-heading">{text("Tools & info", "Εργαλεία & πληροφορίες")}</h2>
        </div>
        <div className="home-secondary-grid">
          <article className="home-secondary-card">
            <h3>{text("Split PDF Tool", "Διαχωρισμός PDF")}</h3>
            <p>{text(
              "Split large PDFs locally when you need smaller study files.",
              "Διαχώρισε μεγάλα PDF τοπικά όταν χρειάζεσαι μικρότερα αρχεία μελέτης.",
            )}</p>
            <Link className="button utility" to="/tools#split-pdf">
              {text("Open tool", "Άνοιγμα εργαλείου")}
            </Link>
          </article>

          <article className="home-secondary-card">
            <h3>{guide.title}</h3>
            <p>{guide.description}</p>
            <button
              className="button secondary"
              onClick={() => setIsGuideOpen(true)}
              type="button"
            >
              {text("Open guide", "Άνοιγμα οδηγού")}
            </button>
          </article>

          <article className="home-secondary-card">
            <h3>{text("Important Info", "Σημαντικές πληροφορίες")}</h3>
            <p>{text(
              "Privacy, backups, limitations and other important StudyApp information.",
              "Απόρρητο, αντίγραφα ασφαλείας, περιορισμοί και άλλες σημαντικές πληροφορίες του StudyApp.",
            )}</p>
            <Link className="button secondary" to="/important-info">
              {text("Open information", "Άνοιγμα πληροφοριών")}
            </Link>
          </article>
        </div>
      </section>

      <StorageNotice kind={storageNoticePlacements.home} variant="compact" />

      <dialog
        aria-describedby="home-guide-description"
        aria-labelledby="home-guide-title"
        className="home-guide-dialog"
        onClose={() => setIsGuideOpen(false)}
        ref={guideDialogRef}
      >
        <p className="eyebrow">{guide.eyebrow}</p>
        <h2 id="home-guide-title">{guide.title}</h2>
        <p id="home-guide-intro">{guide.intro}</p>
        <p id="home-guide-description">{guide.description}</p>
        <ol className="learning-stage-steps">
          {guide.steps.map((step) => <li key={step}>{step}</li>)}
        </ol>
        <div className="home-guide-actions">
          <Link className="button primary" to="/important-info" onClick={() => setIsGuideOpen(false)}>
            {text("Complete guide", "Πλήρης οδηγός")}
          </Link>
          <button
            className="button secondary"
            type="button"
            onClick={() => setIsGuideOpen(false)}
            ref={guideCloseButtonRef}
          >
            {text("Close", "Κλείσιμο")}
          </button>
        </div>
      </dialog>
    </div>
  );
}
