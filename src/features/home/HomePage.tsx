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
  fileSupport?: string;
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
      fileSupport: text(
        "Supported files: PDF · DOC/DOCX · TXT/MD · CSV · PNG/JPG · WebP · GIF",
        "Υποστηριζόμενα αρχεία: PDF · DOC/DOCX · TXT/MD · CSV · PNG/JPG · WebP · GIF",
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
      fileSupport: text(
        "Supported files: PDF · DOC/DOCX · TXT/MD · CSV · PNG/JPG · WebP · GIF",
        "Υποστηριζόμενα αρχεία: PDF · DOC/DOCX · TXT/MD · CSV · PNG/JPG · WebP · GIF",
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
      fileSupport: text(
        "Practice content import: CSV",
        "Εισαγωγή υλικού εξάσκησης: CSV",
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
      fileSupport: text(
        "Supported files: PDF only",
        "Υποστηριζόμενα αρχεία: μόνο PDF",
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
      fileSupport: text(
        "AI file processing depends on file type and size, device resources, and your ChatGPT plan. For large PDFs, split first.",
        "Η επεξεργασία αρχείων από το AI εξαρτάται από τον τύπο και το μέγεθος, τους πόρους της συσκευής και το πλάνο ChatGPT. Για μεγάλα PDF, κάνε πρώτα διαχωρισμό.",
      ),
      action: text("Open AI guide", "Άνοιγμα οδηγού AI"),
      to: "/ai-assistant-guide",
    },
    {
      eyebrow: text("Getting started", "Ξεκίνημα"),
      title: text("How to use StudyApp", "Πώς να χρησιμοποιήσετε το StudyApp"),
      description: text(
        "A simple path from source material to practice.",
        "Μια απλή διαδρομή από το υλικό στην εξάσκηση.",
      ),
      action: text("Open guide", "Άνοιγμα οδηγού"),
      guideSteps: [
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
      <section className="learning-stage-grid" aria-label={text("Home study spaces", "Χώροι μελέτης")}>
        {homeSpaces.map((space) => (
          <article className="learning-stage-card" key={space.title}>
            <p className="eyebrow">{space.eyebrow}</p>
            <h2>{space.title}</h2>
            <p>{space.description}</p>
            {space.fileSupport ? <p className="field-help">{space.fileSupport}</p> : null}
            {space.guideSteps ? (
              <button className="button primary" type="button" onClick={() => setIsGuideOpen(true)}>{space.action}</button>
            ) : (
              <Link className="button primary" to={space.to ?? "/"}>{space.action}</Link>
            )}
          </article>
        ))}
      </section>

      <StorageNotice kind={storageNoticePlacements.home} variant="compact" />

      {guideSpace && (
        <dialog
          aria-describedby="home-guide-description"
          aria-labelledby="home-guide-title"
          className="home-guide-dialog"
          onClose={() => setIsGuideOpen(false)}
          ref={guideDialogRef}
        >
          <p className="eyebrow">{guideSpace.eyebrow}</p>
          <h2 id="home-guide-title">{guideSpace.title}</h2>
          <p id="home-guide-description">{guideSpace.description}</p>
          <ol className="learning-stage-steps">
            {guideSpace.guideSteps?.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <div className="home-guide-actions">
            <Link className="button primary" to="/important-info" onClick={() => setIsGuideOpen(false)}>
              {text("Complete guide", "Πλήρης οδηγός")}
            </Link>
            <button autoFocus className="button secondary" type="button" onClick={() => setIsGuideOpen(false)}>
              {text("Close", "Κλείσιμο")}
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}
