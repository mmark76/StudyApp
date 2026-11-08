import { useId, useRef } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { STUDYAPP_LOCAL_STOP_PROTOCOL_URL } from "../../infrastructure/local-companion/localCompanionClient";

export function LocalPortNote() {
  const { text } = useLanguage();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <span className="workspace-local-port-note">
      <button className="workspace-local-port-note-trigger" onClick={() => dialog.current?.showModal()} type="button">
        {text("IMPORTANT NOTE", "ΣΗΜΑΝΤΙΚΗ ΣΗΜΕΙΩΣΗ")}
      </button>
      <a className="workspace-local-port-note-trigger" href={STUDYAPP_LOCAL_STOP_PROTOCOL_URL}>
        {text("Stop StudyApp Local", "Διακοπή StudyApp Local")}
      </a>
      <dialog aria-labelledby={titleId} className="workspace-local-port-note-dialog" ref={dialog}>
        <h2 id={titleId}>{text("Starting StudyApp Local", "Εκκίνηση του StudyApp Local")}</h2>
        <p>{text(
          "StudyApp Local cannot start until port 8767 is available. If another app is using it, close that app and its server window, then try again.",
          "Το StudyApp Local δεν μπορεί να ξεκινήσει μέχρι να είναι διαθέσιμη η θύρα 8767. Αν τη χρησιμοποιεί άλλη εφαρμογή, κλείσε την και το παράθυρο του server της και δοκίμασε ξανά.",
        )}</p>
        <p>{text(
          "Even when all windows are closed, an app may still be running in the background and using the port. Stop displays the process name when it can be identified.",
          "Ακόμη κι αν όλα τα παράθυρα είναι κλειστά, μια εφαρμογή μπορεί να παραμένει ενεργή στο παρασκήνιο και να χρησιμοποιεί τη θύρα. Η Διακοπή εμφανίζει το όνομα της διεργασίας, όταν μπορεί να εντοπιστεί.",
        )}</p>
        <p>{text(
          "Use Stop StudyApp Local to stop the verified server, even if its window is hidden. If an identified app holds the port, Stop may offer to close it only after your confirmation. Unsaved work may be lost.",
          "Χρησιμοποίησε τη Διακοπή StudyApp Local για να σταματήσεις τον επιβεβαιωμένο server, ακόμη κι αν το παράθυρό του είναι κρυφό. Αν μια αναγνωρισμένη εφαρμογή κρατά τη θύρα, η Διακοπή μπορεί να προτείνει το κλείσιμό της μόνο μετά την επιβεβαίωσή σου. Μη αποθηκευμένη εργασία μπορεί να χαθεί.",
        )}</p>
        <p>{text(
          "The Stop button requires the latest Windows Local ZIP and Enable Launch Button.bat to be run from that folder.",
          "Το κουμπί Διακοπή απαιτεί το νέο Windows Local ZIP και την εκτέλεση του Enable Launch Button.bat από τον φάκελό του.",
        )}</p>
        <button autoFocus onClick={() => dialog.current?.close()} type="button">{text("Close", "Κλείσιμο")}</button>
      </dialog>
    </span>
  );
}
