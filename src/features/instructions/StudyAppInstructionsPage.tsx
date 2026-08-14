import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import "./StudyAppInstructionsPage.css";

interface InstructionStep {
  title?: string;
  description: string;
}

function InstructionSteps({ steps }: { steps: readonly InstructionStep[] }) {
  return (
    <ol className="instructions-steps" role="list">
      {steps.map((step, index) => (
        <li className="instructions-step" key={`${index}-${step.title ?? step.description}`}>
          <span aria-hidden="true" className="instructions-step-number">
            {index + 1}
          </span>
          <div>
            {step.title ? <h4>{step.title}</h4> : null}
            <p>{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function StudyAppInstructionsPage() {
  const { text } = useLanguage();
  const completeWorkflowSteps: readonly InstructionStep[] = [
    {
      title: text("Download the PDF", "Κατέβασε το PDF"),
      description: text(
        "Download the PDF created by the StudyApp AI Assistant and save it on your device.",
        "Κατέβασε το PDF που δημιούργησε ο Βοηθός AI του StudyApp και αποθήκευσέ το στη συσκευή σου.",
      ),
    },
    {
      title: text("Add the PDF to StudyApp", "Πρόσθεσε το PDF στο StudyApp"),
      description: text(
        "Open Library. In Add material, find Local file, choose a Library type and the PDF under Choose local file, then select Add file.",
        "Άνοιξε τη Βιβλιοθήκη. Στην Προσθήκη υλικού, βρες το Τοπικό αρχείο, επίλεξε Τύπο Βιβλιοθήκης και το PDF στην Επιλογή τοπικού αρχείου και μετά επίλεξε Προσθήκη αρχείου.",
      ),
    },
    {
      title: text("Download the Chapters CSV", "Κατέβασε το Chapters CSV"),
      description: text(
        "Download the file whose name starts with StudyApp_Chapters_.",
        "Κατέβασε το αρχείο του οποίου το όνομα αρχίζει με StudyApp_Chapters_.",
      ),
    },
    {
      title: text("Download the Flashcards CSV", "Κατέβασε το Flashcards CSV"),
      description: text(
        "Download the file whose name starts with StudyApp_Flashcards_.",
        "Κατέβασε το αρχείο του οποίου το όνομα αρχίζει με StudyApp_Flashcards_.",
      ),
    },
    {
      title: text("Open Learn & Practice", "Άνοιξε το Μάθηση & Εξάσκηση"),
      description: text(
        "In StudyApp, open Learn & Practice.",
        "Στο StudyApp, άνοιξε το Μάθηση & Εξάσκηση.",
      ),
    },
    {
      title: text(
        "Find Manage practice content",
        "Βρες τη Διαχείριση περιεχομένου εξάσκησης",
      ),
      description: text(
        "Go to Manage practice content, where Practice Chapters and Flashcards are imported.",
        "Πήγαινε στη Διαχείριση περιεχομένου εξάσκησης, όπου εισάγονται τα Κεφάλαια εξάσκησης και οι Flashcards.",
      ),
    },
    {
      title: text(
        "Import the Chapters CSV FIRST",
        "Εισήγαγε ΠΡΩΤΑ το Chapters CSV",
      ),
      description: text(
        "In Practice Chapters, select Import Chapters CSV and choose the StudyApp_Chapters_ file you downloaded.",
        "Στα Κεφάλαια εξάσκησης, επίλεξε Εισαγωγή Chapters CSV και διάλεξε το αρχείο StudyApp_Chapters_ που κατέβασες.",
      ),
    },
    {
      title: text(
        "Wait for the Chapters import to finish",
        "Περίμενε να ολοκληρωθεί η εισαγωγή των Chapters",
      ),
      description: text(
        "Make sure StudyApp has completed the Chapters import before continuing.",
        "Βεβαιώσου ότι το StudyApp ολοκλήρωσε την εισαγωγή των Chapters πριν συνεχίσεις.",
      ),
    },
    {
      title: text(
        "Import the Flashcards CSV SECOND",
        "Εισήγαγε ΜΕΤΑ το Flashcards CSV",
      ),
      description: text(
        "In Flashcards, select Import Flashcards CSV and choose the StudyApp_Flashcards_ file you downloaded.",
        "Στις Flashcards, επίλεξε Εισαγωγή Flashcards CSV και διάλεξε το αρχείο StudyApp_Flashcards_ που κατέβασες.",
      ),
    },
    {
      title: text("Check the result", "Έλεγξε το αποτέλεσμα"),
      description: text(
        "Confirm that your Practice Chapters and Flashcards now appear in Learn & Practice.",
        "Βεβαιώσου ότι τα Κεφάλαια εξάσκησης και οι Flashcards εμφανίζονται πλέον στο Μάθηση & Εξάσκηση.",
      ),
    },
  ];
  const flashcardsOnlySteps: readonly InstructionStep[] = [
    {
      description: text(
        "Download the Flashcards CSV.",
        "Κατέβασε το Flashcards CSV.",
      ),
    },
    {
      description: text("Open StudyApp.", "Άνοιξε το StudyApp."),
    },
    {
      description: text(
        "Open Learn & Practice.",
        "Άνοιξε το Μάθηση & Εξάσκηση.",
      ),
    },
    {
      description: text(
        "In Manage practice content, go to Flashcards.",
        "Στη Διαχείριση περιεχομένου εξάσκησης, πήγαινε στις Flashcards.",
      ),
    },
    {
      description: text(
        "Select Import Flashcards CSV.",
        "Επίλεξε Εισαγωγή Flashcards CSV.",
      ),
    },
    {
      description: text(
        "Choose the StudyApp_Flashcards_ file you downloaded.",
        "Διάλεξε το αρχείο StudyApp_Flashcards_ που κατέβασες.",
      ),
    },
    {
      description: text(
        "Wait for the import to finish.",
        "Περίμενε να ολοκληρωθεί η εισαγωγή.",
      ),
    },
    {
      description: text(
        "Check that the new flashcards appear under the correct Practice Chapter.",
        "Έλεγξε ότι οι νέες flashcards εμφανίζονται στο σωστό Κεφάλαιο εξάσκησης.",
      ),
    },
  ];

  return (
    <div className="instructions-page stack-lg">
      <header className="content-panel instructions-hero">
        <p className="eyebrow">
          {text("StudyApp instructions", "Οδηγίες StudyApp")}
        </p>
        <h2>
          {text(
            "How to add AI-generated study material to StudyApp",
            "Πώς να προσθέσεις στο StudyApp υλικό από τον Βοηθό AI",
          )}
        </h2>
        <p className="instructions-introduction">
          {text(
            "Files created by the StudyApp AI Assistant are downloaded to your device first. You then add or import them manually into StudyApp.",
            "Τα αρχεία που δημιουργεί ο Βοηθός AI του StudyApp κατεβαίνουν πρώτα στη συσκευή σου. Στη συνέχεια τα προσθέτεις ή τα εισάγεις χειροκίνητα στο StudyApp.",
          )}
        </p>
        <aside
          aria-label={text("Important", "Σημαντικό")}
          className="instructions-notice"
          role="note"
        >
          <strong>{text("Important:", "Σημαντικό:")}</strong>{" "}
          {text(
            "StudyApp does not receive files automatically from ChatGPT. Download the files first, then follow the steps below.",
            "Το StudyApp δεν λαμβάνει αρχεία αυτόματα από το ChatGPT. Κατέβασε πρώτα τα αρχεία και μετά ακολούθησε τα παρακάτω βήματα.",
          )}
        </aside>
      </header>

      <section
        aria-labelledby="complete-workflow-title"
        className="content-panel instructions-case"
        data-instruction-case="complete"
      >
        <div className="instructions-case-heading">
          <p className="eyebrow">{text("Case A", "Περίπτωση Α")}</p>
          <h3 id="complete-workflow-title">
            {text(
              "I have a PDF + Chapters CSV + Flashcards CSV",
              "Έχω PDF + Chapters CSV + Flashcards CSV",
            )}
          </h3>
        </div>

        <InstructionSteps steps={completeWorkflowSteps} />

        <aside className="instructions-import-reminder" role="note">
          <strong>
            {text(
              "Always import Chapters CSV first and Flashcards CSV second.",
              "Πάντα εισάγεις πρώτα το Chapters CSV και μετά το Flashcards CSV.",
            )}
          </strong>
          <p
            aria-label={text(
              "Chapters CSV, then Flashcards CSV",
              "Chapters CSV και μετά Flashcards CSV",
            )}
            className="instructions-import-order"
          >
            <span>Chapters CSV</span>
            <span aria-hidden="true" className="instructions-import-arrow">→</span>
            <span>Flashcards CSV</span>
          </p>
        </aside>
      </section>

      <section
        aria-labelledby="flashcards-only-title"
        className="content-panel instructions-case"
        data-instruction-case="flashcards-only"
      >
        <div className="instructions-case-heading">
          <p className="eyebrow">{text("Case B", "Περίπτωση Β")}</p>
          <h3 id="flashcards-only-title">
            {text(
              "I only have a Flashcards CSV",
              "Έχω μόνο Flashcards CSV",
            )}
          </h3>
          <p>
            {text(
              "Use these steps when the StudyApp AI Assistant created flashcards for a Practice Chapter that already exists in StudyApp.",
              "Ακολούθησε αυτά τα βήματα όταν ο Βοηθός AI του StudyApp δημιούργησε flashcards για ένα Κεφάλαιο εξάσκησης που υπάρχει ήδη στο StudyApp.",
            )}
          </p>
        </div>

        <InstructionSteps steps={flashcardsOnlySteps} />
      </section>

      <nav
        aria-label={text("Instruction actions", "Ενέργειες οδηγιών")}
        className="content-panel instructions-actions"
      >
        <Link className="button primary" to="/learn">
          {text("Open Learn & Practice", "Άνοιξε το Μάθηση & Εξάσκηση")}
        </Link>
        <Link className="button secondary" to="/ai-assistant-guide">
          {text("Back to AI Assistant", "Πίσω στον Βοηθό AI")}
        </Link>
      </nav>
    </div>
  );
}
