import { useLanguage } from "../../i18n/LanguageContext";
import "./LocalInstallationGuidePage.css";

interface GuideStep {
  title: string;
  description: string;
}

function GuideSteps({ steps }: { steps: readonly GuideStep[] }) {
  return (
    <ol className="local-installation-guide-steps">
      {steps.map((step, index) => (
        <li key={step.title}>
          <span aria-hidden="true">{index + 1}</span>
          <div>
            <h4>{step.title}</h4>
            <p>{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function LocalInstallationGuidePage() {
  const { text } = useLanguage();
  const installationSteps: readonly GuideStep[] = [
    {
      title: text("Check the requirements", "Έλεγξε τις προϋποθέσεις"),
      description: text(
        "Use Windows, Python 3 available to the launcher and a supported web browser. An internet connection and an eligible ChatGPT account are needed only for the optional ChatGPT connection. You do not need Codex or programming experience.",
        "Χρειάζεσαι Windows, Python 3 διαθέσιμο στον launcher και συμβατό πρόγραμμα περιήγησης. Σύνδεση στο διαδίκτυο και κατάλληλος λογαριασμός ChatGPT απαιτούνται μόνο για την προαιρετική σύνδεση ChatGPT. Δεν χρειάζεσαι Codex ή γνώσεις προγραμματισμού.",
      ),
    },
    {
      title: text("Download the Windows Local ZIP", "Κατέβασε το Windows Local ZIP"),
      description: text(
        "Use the official Download Beta control beside this guide to download StudyApp-Local-Windows-vX.Y.Z.zip from the official GitHub Release.",
        "Χρησιμοποίησε το επίσημο κουμπί Λήψη Beta δίπλα σε αυτές τις οδηγίες για να κατεβάσεις το StudyApp-Local-Windows-vX.Y.Z.zip από την επίσημη έκδοση στο GitHub.",
      ),
    },
    {
      title: text("Extract the complete ZIP", "Αποσυμπίεσε ολόκληρο το ZIP"),
      description: text(
        "Extract every file into a permanent folder. Keep all included files and folders together; do not run the launcher from inside the ZIP.",
        "Αποσυμπίεσε όλα τα αρχεία σε έναν μόνιμο φάκελο. Διατήρησε μαζί όλα τα αρχεία και τους φακέλους· μην εκτελείς τον launcher μέσα από το ZIP.",
      ),
    },
    {
      title: text("Install the browser launcher", "Εγκατάστησε τον launcher του browser"),
      description: text(
        "Run Enable Launch Button.bat from the extracted folder. It registers studyapp-local://open for your Windows user, needs no administrator rights and connects the website's Open StudyApp Local action to this folder. Choose to open StudyApp Local when setup asks.",
        "Εκτέλεσε το Enable Launch Button.bat από τον αποσυμπιεσμένο φάκελο. Καταχωρίζει το studyapp-local://open για τον δικό σου χρήστη Windows, δεν χρειάζεται δικαιώματα διαχειριστή και συνδέει την ενέργεια Άνοιγμα StudyApp Local του ιστοτόπου με αυτόν τον φάκελο. Επίλεξε να ανοίξει το StudyApp Local όταν σε ρωτήσει η εγκατάσταση.",
      ),
    },
    {
      title: text("Start StudyApp Local", "Άνοιξε το StudyApp Local"),
      description: text(
        "The launcher opens the Local Workspace in your default browser. The local server is available at http://127.0.0.1:8767. You can also run Start StudyApp Local.bat directly from the extracted folder.",
        "Ο launcher ανοίγει τον Τοπικό Χώρο εργασίας στο προεπιλεγμένο πρόγραμμα περιήγησης. Ο τοπικός server είναι διαθέσιμος στη διεύθυνση http://127.0.0.1:8767. Μπορείς επίσης να εκτελέσεις απευθείας το Start StudyApp Local.bat από τον αποσυμπιεσμένο φάκελο.",
      ),
    },
    {
      title: text("Connect ChatGPT (optional)", "Σύνδεσε το ChatGPT (προαιρετικά)"),
      description: text(
        "In AI Studio select Connect, complete the browser authorization and check that the connection is shown as connected before starting a conversation.",
        "Στο AI Studio επίλεξε Σύνδεση, ολοκλήρωσε την εξουσιοδότηση στο πρόγραμμα περιήγησης και έλεγξε ότι η σύνδεση εμφανίζεται ως ενεργή πριν ξεκινήσεις συνομιλία.",
      ),
    },
    {
      title: text("Attach study files", "Επισύναψε αρχεία μελέτης"),
      description: text(
        "In the Local AI Studio conversation, + accepts PDF, DOCX, PPTX, TXT, MD and CSV. Files are extracted and searched on your device. Review the exact excerpts and approve them before submitting. Only your question and the excerpts you approve are sent to ChatGPT; the original files stay on your device. Requests use store: false. Embedded Office images and charts are not analyzed.",
        "Στη συνομιλία του Τοπικού AI Studio, το + δέχεται PDF, DOCX, PPTX, TXT, MD και CSV. Τα αρχεία εξάγονται και αναζητούνται στη συσκευή σου. Έλεγξε τα ακριβή αποσπάσματα και ενέκρινέ τα πριν από την υποβολή. Στο ChatGPT αποστέλλονται μόνο η ερώτησή σου και τα αποσπάσματα που εγκρίνεις· τα αρχικά αρχεία παραμένουν στη συσκευή σου. Τα αιτήματα χρησιμοποιούν store: false. Οι ενσωματωμένες εικόνες και τα γραφήματα Office δεν αναλύονται.",
      ),
    },
  ];

  const updateSteps: readonly GuideStep[] = [
    {
      title: text("Stop the previous server", "Σταμάτησε τον προηγούμενο server"),
      description: text(
        "Run Stop StudyApp Local Server.bat from the previous extracted folder. It checks that the process belongs to StudyApp Local and will not stop an unrelated process.",
        "Εκτέλεσε το Stop StudyApp Local Server.bat από τον προηγούμενο αποσυμπιεσμένο φάκελο. Ελέγχει ότι η διεργασία ανήκει στο StudyApp Local και δεν σταματά άσχετες διεργασίες.",
      ),
    },
    {
      title: text("Download the latest Windows Local ZIP", "Κατέβασε το πιο πρόσφατο Windows Local ZIP"),
      description: text(
        "Use the official Download Beta control beside this guide to download the latest StudyApp-Local-Windows-vX.Y.Z.zip release.",
        "Χρησιμοποίησε το επίσημο κουμπί Λήψη Beta δίπλα σε αυτές τις οδηγίες για να κατεβάσεις την πιο πρόσφατη έκδοση StudyApp-Local-Windows-vX.Y.Z.zip.",
      ),
    },
    {
      title: text("Extract into a separate folder", "Αποσυμπίεσε σε ξεχωριστό φάκελο"),
      description: text(
        "Use a new version-specific folder and keep the previous folder temporarily in case you need to return to it.",
        "Χρησιμοποίησε νέο φάκελο με την έκδοση και κράτησε προσωρινά τον προηγούμενο φάκελο, σε περίπτωση που χρειαστεί να επιστρέψεις σε αυτόν.",
      ),
    },
    {
      title: text("Update the registered launcher", "Ενημέρωσε τον καταχωρισμένο launcher"),
      description: text(
        "Run Enable Launch Button.bat from the new folder. This updates the registered path to the new package; no administrator rights are required.",
        "Εκτέλεσε το Enable Launch Button.bat από τον νέο φάκελο. Έτσι ενημερώνεται η καταχωρισμένη διαδρομή προς το νέο πακέτο· δεν απαιτούνται δικαιώματα διαχειριστή.",
      ),
    },
    {
      title: text("Start and verify the new version", "Άνοιξε και έλεγξε τη νέα έκδοση"),
      description: text(
        "Start StudyApp Local, then check the version= value in RELEASE.txt in the new folder, confirm the server opens at http://127.0.0.1:8767, check ChatGPT connection status and try basic functionality. Reconnect and approve again if needed; a previous authorization may not remain active.",
        "Άνοιξε το StudyApp Local και έλεγξε την τιμή version= στο RELEASE.txt του νέου φακέλου. Επιβεβαίωσε ότι ανοίγει ο server στη διεύθυνση http://127.0.0.1:8767, έλεγξε την κατάσταση σύνδεσης ChatGPT και δοκίμασε τις βασικές λειτουργίες. Αν χρειάζεται, συνδέσου και ενέκρινε ξανά· η προηγούμενη εξουσιοδότηση μπορεί να μην παραμένει ενεργή.",
      ),
    },
    {
      title: text("Retire the previous package when ready", "Αφαίρεσε το προηγούμενο πακέτο όταν είσαι έτοιμος"),
      description: text(
        "After successful checks, you may remove the old extracted application folder in File Explorer. Do not remove browser profile data or other personal files. The update does not automatically delete files, credentials or study data.",
        "Μετά τους επιτυχείς ελέγχους, μπορείς να αφαιρέσεις τον παλιό φάκελο της εφαρμογής από την Εξερεύνηση αρχείων. Μην αφαιρέσεις δεδομένα προφίλ περιήγησης ή άλλα προσωπικά αρχεία. Η ενημέρωση δεν διαγράφει αυτόματα αρχεία, διαπιστευτήρια ή δεδομένα μελέτης.",
      ),
    },
  ];

  return (
    <main className="local-installation-guide instructions-page stack-lg">
      <header className="content-panel instructions-hero">
        <p className="eyebrow">{text("StudyApp Local · Windows", "StudyApp Local · Windows")}</p>
        <h2>{text("Installation and update guide", "Οδηγός εγκατάστασης και ενημέρωσης")}</h2>
        <p className="instructions-introduction">
          {text(
            "Follow the first-time steps to install StudyApp Local, or use the separate update steps if you already have it.",
            "Ακολούθησε τα βήματα πρώτης εγκατάστασης ή τα ξεχωριστά βήματα ενημέρωσης αν έχεις ήδη το StudyApp Local.",
          )}
        </p>
        <aside className="local-installation-guide-server-notice" role="note">
          <strong>{text("Important — Keep the Local Server Running", "Σημαντικό — Διατήρησε τον Τοπικό Server σε Λειτουργία")}</strong>
          <p>{text(
            "StudyApp Local requires its Command Prompt window to remain open while the application is in use. Closing the window stops the local server.",
            "Το StudyApp Local απαιτεί το παράθυρο γραμμής εντολών (Command Prompt) να παραμένει ανοιχτό κατά τη χρήση της εφαρμογής. Το κλείσιμο του παραθύρου διακόπτει τη λειτουργία του τοπικού server.",
          )}</p>
          <strong>{text(
            "Keep this Terminal running. You can minimize it, but do not close it.",
            "Διατήρησε το παράθυρο ανοιχτό. Μπορείς να το ελαχιστοποιήσεις, αλλά όχι να το κλείσεις.",
          )}</strong>
        </aside>
      </header>

      <section aria-labelledby="local-installation-title" className="content-panel instructions-case">
        <div className="instructions-case-heading">
          <p className="eyebrow">{text("New user", "Νέος χρήστης")}</p>
          <h3 id="local-installation-title">{text("First-time installation", "Πρώτη εγκατάσταση")}</h3>
        </div>
        <GuideSteps steps={installationSteps} />
      </section>

      <section aria-labelledby="local-update-title" className="content-panel instructions-case">
        <div className="instructions-case-heading">
          <p className="eyebrow">{text("Existing user", "Υφιστάμενος χρήστης")}</p>
          <h3 id="local-update-title">{text("Update StudyApp Local", "Ενημέρωση StudyApp Local")}</h3>
        </div>
        <GuideSteps steps={updateSteps} />
      </section>

    </main>
  );
}
