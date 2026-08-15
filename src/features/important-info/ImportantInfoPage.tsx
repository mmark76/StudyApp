import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { MAX_SPREADSHEET_FILE_SIZE } from "../content-import/spreadsheetImport";
import { MAX_LOCAL_FILE_SIZE } from "../study-materials/localStudyFiles";
import "./ImportantInfoPage.css";

function formatMegabytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

export function ImportantInfoPage() {
  const { text } = useLanguage();
  const localFileLimit = formatMegabytes(MAX_LOCAL_FILE_SIZE);
  const practiceCsvLimit = formatMegabytes(MAX_SPREADSHEET_FILE_SIZE);

  return (
    <div className="important-info-page stack-lg">
      <header className="content-panel important-info-hero">
        <p className="eyebrow">{text("Important Info", "Σημαντικές πληροφορίες")}</p>
        <h2>{text("Complete StudyApp guide", "Πλήρης οδηγός StudyApp")}</h2>
        <p>
          {text(
            "Use this page as the main reference for how StudyApp works, what each area is for, supported files and limits, AI Assistant boundaries, local data, backups and common problems.",
            "Χρησιμοποίησε αυτή τη σελίδα ως τον βασικό οδηγό για τον τρόπο λειτουργίας του StudyApp, τον ρόλο κάθε ενότητας, τα υποστηριζόμενα αρχεία και όρια, τα όρια του Βοηθού AI, τα τοπικά δεδομένα, τα αντίγραφα ασφαλείας και τα συνηθισμένα προβλήματα.",
          )}
        </p>
        <aside className="important-info-callout" role="note">
          <strong>{text("The most important rule", "Ο σημαντικότερος κανόνας")}</strong>
          <p>
            {text(
              "StudyApp is local-first. Keep original study files and important backups outside the app as well. Browser data can be lost if site data is cleared or the device/browser fails.",
              "Το StudyApp είναι local-first. Κράτα τα πρωτότυπα αρχεία μελέτης και σημαντικά αντίγραφα ασφαλείας και εκτός της εφαρμογής. Τα δεδομένα του browser μπορούν να χαθούν αν διαγραφούν τα δεδομένα ιστοτόπου ή παρουσιαστεί βλάβη στη συσκευή ή στον browser.",
            )}
          </p>
        </aside>
      </header>

      <nav className="important-info-jump-links" aria-label={text("Guide sections", "Ενότητες οδηγού")}>
        <a href="#important-info-workflow">{text("Workflow", "Ροή εργασίας")}</a>
        <a href="#important-info-areas">{text("App areas", "Ενότητες εφαρμογής")}</a>
        <a href="#important-info-files">{text("Files & limits", "Αρχεία & όρια")}</a>
        <a href="#important-info-ai">{text("AI Assistant", "Βοηθός AI")}</a>
        <a href="#important-info-data">{text("Data & backup", "Δεδομένα & backup")}</a>
        <a href="#important-info-troubleshooting">{text("Troubleshooting", "Αντιμετώπιση προβλημάτων")}</a>
      </nav>

      <section className="content-panel important-info-section" id="important-info-workflow">
        <p className="eyebrow">{text("Recommended workflow", "Προτεινόμενη ροή")}</p>
        <h3>{text("From source material to active practice", "Από το αρχικό υλικό στην ενεργή εξάσκηση")}</h3>
        <ol className="important-info-steps">
          <li>
            <strong>{text("Add your source material.", "Πρόσθεσε το αρχικό υλικό.")}</strong>{" "}
            {text(
              "Use Library for books, papers, articles, notes and summaries, or Structured Study when you want material organised by contents, chapters, sections, concepts, references and diagrams.",
              "Χρησιμοποίησε τη Βιβλιοθήκη για βιβλία, εργασίες, άρθρα, σημειώσεις και περιλήψεις ή τη Δομημένη Μελέτη όταν θέλεις το υλικό οργανωμένο σε περιεχόμενα, κεφάλαια, ενότητες, έννοιες, αναφορές και διαγράμματα.",
            )}
          </li>
          <li>
            <strong>{text("Split large PDFs when useful.", "Διαχώρισε μεγάλα PDF όταν χρειάζεται.")}</strong>{" "}
            {text(
              "Smaller, focused PDFs are usually easier to manage locally and easier to provide to an AI assistant.",
              "Μικρότερα και στοχευμένα PDF είναι συνήθως ευκολότερα στη διαχείριση τοπικά και στην παροχή τους σε έναν βοηθό AI.",
            )}
          </li>
          <li>
            <strong>{text("Use the StudyApp AI Assistant only when you choose to.", "Χρησιμοποίησε τον Βοηθό AI του StudyApp μόνο όταν το επιλέγεις.")}</strong>{" "}
            {text(
              "StudyApp opens the dedicated Custom GPT in ChatGPT. You choose what material to upload or paste there.",
              "Το StudyApp ανοίγει το ειδικό Custom GPT στο ChatGPT. Εσύ επιλέγεις ποιο υλικό θα ανεβάσεις ή θα επικολλήσεις εκεί.",
            )}
          </li>
          <li>
            <strong>{text("Download AI-generated files to your device.", "Κατέβασε τα αρχεία που δημιουργεί το AI στη συσκευή σου.")}</strong>{" "}
            {text(
              "Files are not transferred automatically back into StudyApp.",
              "Τα αρχεία δεν μεταφέρονται αυτόματα πίσω στο StudyApp.",
            )}
          </li>
          <li>
            <strong>{text("Import practice content in the correct order.", "Εισήγαγε το υλικό εξάσκησης με τη σωστή σειρά.")}</strong>{" "}
            {text(
              "For a new set, import Chapters CSV first and Flashcards CSV second.",
              "Για νέο σύνολο, εισήγαγε πρώτα το Chapters CSV και μετά το Flashcards CSV.",
            )}
          </li>
          <li>
            <strong>{text("Study and review.", "Μελέτησε και κάνε επανάληψη.")}</strong>{" "}
            {text(
              "Use Flashcards, Review, Quiz and Progress to turn source material into repeated practice.",
              "Χρησιμοποίησε Flashcards, Review, Quiz και Progress για να μετατρέψεις το αρχικό υλικό σε επαναλαμβανόμενη εξάσκηση.",
            )}
          </li>
          <li>
            <strong>{text("Back up your local data regularly.", "Δημιούργησε τακτικά αντίγραφα ασφαλείας των τοπικών δεδομένων.")}</strong>
          </li>
        </ol>
      </section>

      <section className="content-panel important-info-section" id="important-info-areas">
        <p className="eyebrow">{text("App areas", "Ενότητες εφαρμογής")}</p>
        <h3>{text("What each part of StudyApp is for", "Σε τι χρησιμεύει κάθε μέρος του StudyApp")}</h3>
        <div className="important-info-card-grid">
          <article className="important-info-card">
            <h4>{text("Library", "Βιβλιοθήκη")}</h4>
            <p>{text("Store and organise source material such as books, articles, papers, external notes, personal notes and summaries.", "Αποθήκευσε και οργάνωσε πρωτογενές υλικό όπως βιβλία, άρθρα, εργασίες, εξωτερικές σημειώσεις, προσωπικές σημειώσεις και περιλήψεις.")}</p>
            <Link className="text-link" to="/library">{text("Open Library", "Άνοιγμα Βιβλιοθήκης")}</Link>
          </article>
          <article className="important-info-card">
            <h4>{text("Structured Study", "Δομημένη Μελέτη")}</h4>
            <p>{text("Organise material by contents, chapters, sections, key concepts, references and images/diagrams.", "Οργάνωσε υλικό ανά περιεχόμενα, κεφάλαια, ενότητες, βασικές έννοιες, αναφορές και εικόνες/διαγράμματα.")}</p>
            <Link className="text-link" to="/study/theory">{text("Open Structured Study", "Άνοιγμα Δομημένης Μελέτης")}</Link>
          </article>
          <article className="important-info-card">
            <h4>{text("Learn & Practice", "Μάθηση & Εξάσκηση")}</h4>
            <p>{text("Create or import practice chapters and flashcards, then use flashcards, review, quizzes and progress tracking.", "Δημιούργησε ή εισήγαγε κεφάλαια εξάσκησης και flashcards και μετά χρησιμοποίησε flashcards, επανάληψη, κουίζ και παρακολούθηση προόδου.")}</p>
            <Link className="text-link" to="/learn">{text("Open Learn & Practice", "Άνοιγμα Μάθησης & Εξάσκησης")}</Link>
          </article>
          <article className="important-info-card">
            <h4>{text("Split PDF Tool", "Διαχωρισμός PDF")}</h4>
            <p>{text("Split a PDF locally into smaller page ranges and save or download the generated PDFs.", "Διαχώρισε ένα PDF τοπικά σε μικρότερες περιοχές σελίδων και αποθήκευσε ή κατέβασε τα νέα PDF.")}</p>
            <Link className="text-link" to="/tools#split-pdf">{text("Open Split PDF Tool", "Άνοιγμα εργαλείου PDF")}</Link>
          </article>
          <article className="important-info-card">
            <h4>{text("AI Assistant", "Βοηθός AI")}</h4>
            <p>{text("Open the dedicated StudyApp Custom GPT in ChatGPT. The current handoff is manual and does not automatically send your StudyApp library.", "Άνοιξε το ειδικό Custom GPT του StudyApp στο ChatGPT. Η σημερινή μεταφορά είναι χειροκίνητη και δεν στέλνει αυτόματα τη βιβλιοθήκη του StudyApp.")}</p>
            <Link className="text-link" to="/ai-assistant-guide">{text("Open AI guide", "Άνοιγμα οδηγού AI")}</Link>
          </article>
          <article className="important-info-card">
            <h4>{text("Settings & appearance", "Ρυθμίσεις & εμφάνιση")}</h4>
            <p>{text("Adjust the interface appearance and language for the current browser/device.", "Ρύθμισε την εμφάνιση της διεπαφής και τη γλώσσα για τον τρέχοντα browser/συσκευή.")}</p>
            <Link className="text-link" to="/appearance">{text("Open Settings", "Άνοιγμα Ρυθμίσεων")}</Link>
          </article>
        </div>
      </section>

      <section className="content-panel important-info-section" id="important-info-files">
        <p className="eyebrow">{text("Files and limits", "Αρχεία και όρια")}</p>
        <h3>{text("What StudyApp accepts locally", "Τι δέχεται το StudyApp τοπικά")}</h3>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{text("Area", "Ενότητα")}</th>
                <th>{text("Supported input", "Υποστηριζόμενη είσοδος")}</th>
                <th>{text("Current StudyApp limit", "Τρέχον όριο StudyApp")}</th>
                <th>{text("Important note", "Σημαντική σημείωση")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{text("Library / Structured Study", "Βιβλιοθήκη / Δομημένη Μελέτη")}</td>
                <td>PDF · DOC/DOCX · TXT/MD · CSV · PNG/JPG/JPEG · WebP · GIF</td>
                <td>{text(`${localFileLimit} per local file`, `${localFileLimit} ανά τοπικό αρχείο`)}</td>
                <td>{text("Files are validated before storage and again before opening.", "Τα αρχεία ελέγχονται πριν από την αποθήκευση και ξανά πριν από το άνοιγμα.")}</td>
              </tr>
              <tr>
                <td>{text("Learn & Practice import", "Εισαγωγή Μάθησης & Εξάσκησης")}</td>
                <td>Chapters CSV · Flashcards CSV</td>
                <td>{text(`${practiceCsvLimit} per CSV`, `${practiceCsvLimit} ανά CSV`)}</td>
                <td>{text("For new content, import Chapters first and Flashcards second.", "Για νέο υλικό, εισήγαγε πρώτα Chapters και μετά Flashcards.")}</td>
              </tr>
              <tr>
                <td>{text("Split PDF Tool", "Διαχωρισμός PDF")}</td>
                <td>PDF</td>
                <td>{text(`Local files up to ${localFileLimit}`, `Τοπικά αρχεία έως ${localFileLimit}`)}</td>
                <td>{text("A file that is within the size limit can still be demanding on memory, especially on phones or older devices.", "Ένα αρχείο που βρίσκεται εντός του ορίου μεγέθους μπορεί παρ’ όλα αυτά να απαιτεί πολλή μνήμη, ιδιαίτερα σε κινητά ή παλαιότερες συσκευές.")}</td>
              </tr>
              <tr>
                <td>{text("StudyApp AI Assistant", "Βοηθός AI του StudyApp")}</td>
                <td>{text("Files you choose to provide directly in ChatGPT", "Αρχεία που επιλέγεις να δώσεις απευθείας στο ChatGPT")}</td>
                <td>{text("Controlled by ChatGPT/OpenAI, not StudyApp", "Καθορίζεται από ChatGPT/OpenAI, όχι από το StudyApp")}</td>
                <td>{text("Actual processing depends on file type and size, current ChatGPT plan limits and the service's current rules. Device resources also affect local preparation, splitting and upload reliability.", "Η πραγματική επεξεργασία εξαρτάται από τον τύπο και το μέγεθος του αρχείου, τα ισχύοντα όρια του πλάνου ChatGPT και τους τρέχοντες κανόνες της υπηρεσίας. Οι πόροι της συσκευής επηρεάζουν επίσης την τοπική προετοιμασία, τον διαχωρισμό και την αξιοπιστία του upload.")}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <aside className="important-info-callout" role="note">
          <strong>{text("Why StudyApp does not show one fixed AI maximum", "Γιατί το StudyApp δεν εμφανίζει ένα σταθερό μέγιστο όριο AI")}</strong>
          <p>{text("ChatGPT file and usage limits can vary by file type, account/plan and current OpenAI policy. StudyApp therefore explains the factors instead of hard-coding a number that may become outdated.", "Τα όρια αρχείων και χρήσης του ChatGPT μπορούν να διαφέρουν ανά τύπο αρχείου, λογαριασμό/πλάνο και ισχύουσα πολιτική της OpenAI. Γι’ αυτό το StudyApp εξηγεί τους παράγοντες αντί να ενσωματώνει έναν αριθμό που μπορεί να γίνει παρωχημένος.")}</p>
        </aside>
      </section>

      <section className="content-panel important-info-section" id="important-info-ai">
        <p className="eyebrow">{text("AI Assistant", "Βοηθός AI")}</p>
        <h3>{text("What happens when you use the StudyApp AI Assistant", "Τι συμβαίνει όταν χρησιμοποιείς τον Βοηθό AI του StudyApp")}</h3>
        <div className="important-info-two-column">
          <div>
            <h4>{text("Available now", "Διαθέσιμο τώρα")}</h4>
            <ul>
              <li>{text("StudyApp opens the approved dedicated Custom GPT in a new ChatGPT tab.", "Το StudyApp ανοίγει το εγκεκριμένο ειδικό Custom GPT σε νέα καρτέλα ChatGPT.")}</li>
              <li>{text("You choose which files or text to provide in ChatGPT.", "Εσύ επιλέγεις ποια αρχεία ή κείμενο θα δώσεις στο ChatGPT.")}</li>
              <li>{text("StudyApp does not automatically read, copy or send your Library or IndexedDB content during this handoff.", "Το StudyApp δεν διαβάζει, αντιγράφει ή στέλνει αυτόματα τη Βιβλιοθήκη ή το περιεχόμενο IndexedDB κατά τη μεταφορά αυτή.")}</li>
              <li>{text("Generated files must be downloaded and then added/imported manually into StudyApp.", "Τα αρχεία που δημιουργούνται πρέπει να κατέβουν και μετά να προστεθούν/εισαχθούν χειροκίνητα στο StudyApp.")}</li>
              <li>{text("For large PDFs, use Split PDF Tool first when a smaller focused section is sufficient.", "Για μεγάλα PDF, χρησιμοποίησε πρώτα τον Διαχωρισμό PDF όταν αρκεί μια μικρότερη στοχευμένη ενότητα.")}</li>
            </ul>
          </div>
          <div>
            <h4>{text("Not active yet", "Δεν είναι ενεργό ακόμη")}</h4>
            <ul>
              <li>{text("ChatGPT App / MCP is a future option and is currently inactive.", "Το ChatGPT App / MCP είναι μελλοντική επιλογή και σήμερα είναι ανενεργό.")}</li>
              <li>{text("StudyApp AI automatic processing is also inactive.", "Η αυτόματη επεξεργασία StudyApp AI είναι επίσης ανενεργή.")}</li>
              <li>{text("There are currently no StudyApp AI charges, credit purchases or automatic paid AI requests.", "Σήμερα δεν υπάρχουν χρεώσεις StudyApp AI, αγορές credits ή αυτόματα επί πληρωμή AI requests.")}</li>
            </ul>
          </div>
        </div>
        <div className="button-row important-info-actions">
          <Link className="button primary" to="/ai-assistant-guide">{text("AI Assistant guide", "Οδηγός Βοηθού AI")}</Link>
          <Link className="button secondary" to="/instructions">{text("AI files → StudyApp instructions", "Οδηγίες αρχείων AI → StudyApp")}</Link>
        </div>
      </section>

      <section className="content-panel important-info-section" id="important-info-data">
        <p className="eyebrow">{text("Local data and backup", "Τοπικά δεδομένα και backup")}</p>
        <h3>{text("Where your StudyApp data lives", "Πού βρίσκονται τα δεδομένα του StudyApp")}</h3>
        <div className="important-info-two-column">
          <div>
            <h4>{text("Stored locally", "Αποθηκεύονται τοπικά")}</h4>
            <p>{text("Study content, progress, settings, saved links and uploaded file blobs are stored in the current browser/device. StudyApp currently has no user account, cloud storage or cloud sync for this data.", "Το υλικό μελέτης, η πρόοδος, οι ρυθμίσεις, οι αποθηκευμένοι σύνδεσμοι και τα uploaded file blobs αποθηκεύονται στον τρέχοντα browser/συσκευή. Το StudyApp σήμερα δεν διαθέτει λογαριασμό χρήστη, cloud storage ή cloud sync για αυτά τα δεδομένα.")}</p>
          </div>
          <div>
            <h4>{text("JSON backup", "JSON backup")}</h4>
            <p>{text("The backup covers progress, sessions, supported settings, imported chapters and flashcards, and saved links. Uploaded or generated local file blobs are not included.", "Το backup καλύπτει πρόοδο, sessions, υποστηριζόμενες ρυθμίσεις, εισαγόμενα κεφάλαια και flashcards και αποθηκευμένους συνδέσμους. Τα uploaded ή generated τοπικά file blobs δεν περιλαμβάνονται.")}</p>
          </div>
        </div>
        <aside className="important-info-warning" role="note">
          <strong>{text("Keep original files outside StudyApp", "Κράτα τα πρωτότυπα αρχεία εκτός StudyApp")}</strong>
          <p>{text("The JSON backup is not a complete backup of your local file library. Keep important PDFs, documents, images and other originals in normal device/cloud backup storage as well.", "Το JSON backup δεν είναι πλήρες αντίγραφο της τοπικής βιβλιοθήκης αρχείων. Κράτα σημαντικά PDF, έγγραφα, εικόνες και άλλα πρωτότυπα και σε κανονικό χώρο backup της συσκευής ή cloud.")}</p>
        </aside>
      </section>

      <section className="content-panel important-info-section">
        <p className="eyebrow">{text("Safety and privacy", "Ασφάλεια και απόρρητο")}</p>
        <h3>{text("Practical protections and boundaries", "Πρακτικές προστασίες και όρια")}</h3>
        <ul>
          <li>{text("StudyApp validates supported local file types and rejects active web/executable content such as HTML, SVG, JavaScript and executables.", "Το StudyApp ελέγχει τους υποστηριζόμενους τύπους τοπικών αρχείων και απορρίπτει ενεργό web/executable περιεχόμενο όπως HTML, SVG, JavaScript και executables.")}</li>
          <li>{text("Local files are revalidated before they are opened or downloaded from StudyApp.", "Τα τοπικά αρχεία ελέγχονται ξανά πριν ανοίξουν ή κατέβουν από το StudyApp.")}</li>
          <li>{text("External study links open separately. Only save links you trust.", "Οι εξωτερικοί σύνδεσμοι μελέτης ανοίγουν ξεχωριστά. Αποθήκευε μόνο συνδέσμους που εμπιστεύεσαι.")}</li>
          <li>{text("The current AI Assistant handoff does not automatically transmit StudyApp content. ChatGPT remains a separate service with its own account, plan, privacy and usage rules.", "Η σημερινή μεταφορά προς τον Βοηθό AI δεν μεταδίδει αυτόματα περιεχόμενο του StudyApp. Το ChatGPT παραμένει ξεχωριστή υπηρεσία με δικούς του κανόνες λογαριασμού, πλάνου, απορρήτου και χρήσης.")}</li>
        </ul>
        <Link className="text-link" to="/legal/privacy">{text("Read StudyApp Privacy", "Διάβασε το Απόρρητο του StudyApp")}</Link>
      </section>

      <section className="content-panel important-info-section">
        <p className="eyebrow">{text("Browser, device and PWA", "Browser, συσκευή και PWA")}</p>
        <h3>{text("Performance, storage and updates", "Απόδοση, αποθήκευση και ενημερώσεις")}</h3>
        <ul>
          <li>{text("Available local storage is controlled by the browser and device and is not guaranteed.", "Ο διαθέσιμος τοπικός χώρος καθορίζεται από τον browser και τη συσκευή και δεν είναι εγγυημένος.")}</li>
          <li>{text("Large PDF operations may use substantial RAM even when the file is below the nominal size limit.", "Οι εργασίες σε μεγάλα PDF μπορεί να χρησιμοποιούν σημαντική RAM ακόμη και όταν το αρχείο είναι κάτω από το ονομαστικό όριο μεγέθους.")}</li>
          <li>{text("On phones or memory-limited devices, prefer smaller PDFs and narrower page ranges.", "Σε κινητά ή συσκευές με περιορισμένη μνήμη, προτίμησε μικρότερα PDF και μικρότερα ranges σελίδων.")}</li>
          <li>{text("When an app update is ready, StudyApp asks you to choose Update or Later; it does not force an immediate reload of active work.", "Όταν είναι έτοιμη ενημέρωση της εφαρμογής, το StudyApp σε αφήνει να επιλέξεις Ενημέρωση ή Αργότερα· δεν επιβάλλει άμεσο reload της ενεργής εργασίας.")}</li>
        </ul>
      </section>

      <section className="content-panel important-info-section" id="important-info-troubleshooting">
        <p className="eyebrow">{text("Troubleshooting", "Αντιμετώπιση προβλημάτων")}</p>
        <h3>{text("If something does not work", "Αν κάτι δεν λειτουργεί")}</h3>
        <div className="important-info-card-grid">
          <article className="important-info-card">
            <h4>{text("A file is rejected", "Ένα αρχείο απορρίπτεται")}</h4>
            <p>{text("Check the extension, original file type and size. Do not rename an unsupported file to a supported extension. Use the original file.", "Έλεγξε την επέκταση, τον πραγματικό τύπο και το μέγεθος του αρχείου. Μην μετονομάζεις μη υποστηριζόμενο αρχείο σε υποστηριζόμενη επέκταση. Χρησιμοποίησε το πρωτότυπο αρχείο.")}</p>
          </article>
          <article className="important-info-card">
            <h4>{text("A large PDF is slow or fails", "Ένα μεγάλο PDF είναι αργό ή αποτυγχάνει")}</h4>
            <p>{text("Close unnecessary tabs, try a smaller page range, use a device with more available memory or split the source into smaller PDFs.", "Κλείσε περιττές καρτέλες, δοκίμασε μικρότερο range σελίδων, χρησιμοποίησε συσκευή με περισσότερη διαθέσιμη μνήμη ή χώρισε το αρχικό σε μικρότερα PDF.")}</p>
          </article>
          <article className="important-info-card">
            <h4>{text("ChatGPT cannot process a file", "Το ChatGPT δεν μπορεί να επεξεργαστεί αρχείο")}</h4>
            <p>{text("Try a smaller or simpler file, split a PDF, check your internet connection and confirm the current limits of your ChatGPT account/plan.", "Δοκίμασε μικρότερο ή απλούστερο αρχείο, χώρισε το PDF, έλεγξε τη σύνδεση στο διαδίκτυο και επιβεβαίωσε τα τρέχοντα όρια του λογαριασμού/πλάνου ChatGPT.")}</p>
          </article>
          <article className="important-info-card">
            <h4>{text("CSV import fails", "Η εισαγωγή CSV αποτυγχάνει")}</h4>
            <p>{text("Use the StudyApp templates/expected structure, keep each CSV below the import limit, and import Chapters before Flashcards for new content.", "Χρησιμοποίησε τα templates/την αναμενόμενη δομή του StudyApp, κράτα κάθε CSV κάτω από το όριο εισαγωγής και εισήγαγε Chapters πριν από Flashcards για νέο υλικό.")}</p>
          </article>
          <article className="important-info-card">
            <h4>{text("Local data disappeared", "Χάθηκαν τοπικά δεδομένα")}</h4>
            <p>{text("Browser site-data clearing, browser reset, private browsing or device failure can remove local data. Restore from a valid JSON backup where possible and keep originals separately.", "Η διαγραφή δεδομένων ιστοτόπου, reset browser, private browsing ή βλάβη συσκευής μπορεί να αφαιρέσει τοπικά δεδομένα. Κάνε restore από έγκυρο JSON backup όπου είναι δυνατό και κράτα τα πρωτότυπα ξεχωριστά.")}</p>
          </article>
          <article className="important-info-card">
            <h4>{text("Need the exact AI import steps", "Χρειάζεσαι τα ακριβή βήματα εισαγωγής AI")}</h4>
            <p>{text("Use the dedicated bilingual instructions page for PDF + Chapters CSV + Flashcards CSV workflows.", "Χρησιμοποίησε την ειδική δίγλωσση σελίδα οδηγιών για ροές PDF + Chapters CSV + Flashcards CSV.")}</p>
            <Link className="text-link" to="/instructions">{text("Open instructions", "Άνοιγμα οδηγιών")}</Link>
          </article>
        </div>
      </section>

      <nav className="content-panel important-info-footer-actions" aria-label={text("Important Info actions", "Ενέργειες Σημαντικών πληροφοριών")}>
        <div>
          <p className="eyebrow">{text("Ready to continue", "Συνέχισε από εδώ")}</p>
          <h3>{text("Choose your next StudyApp area", "Επίλεξε την επόμενη ενότητα του StudyApp")}</h3>
        </div>
        <div className="button-row">
          <Link className="button primary" to="/library">{text("Library", "Βιβλιοθήκη")}</Link>
          <Link className="button secondary" to="/study/theory">{text("Structured Study", "Δομημένη Μελέτη")}</Link>
          <Link className="button secondary" to="/learn">{text("Learn & Practice", "Μάθηση & Εξάσκηση")}</Link>
          <Link className="button secondary" to="/tools#split-pdf">{text("Split PDF", "Διαχωρισμός PDF")}</Link>
        </div>
      </nav>
    </div>
  );
}
