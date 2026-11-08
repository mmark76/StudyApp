import { useId, useRef } from "react";
import { useLanguage } from "../../i18n/LanguageContext";

export function LocalPortNote() {
  const { text } = useLanguage();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <span className="workspace-local-port-note">
      <button className="workspace-local-port-note-trigger" onClick={() => dialog.current?.showModal()} type="button">
        {text("IMPORTANT NOTE", "ΣΗΜΑΝΤΙΚΗ ΣΗΜΕΙΩΣΗ")}
      </button>
      <dialog aria-labelledby={titleId} className="workspace-local-port-note-dialog" ref={dialog}>
        <h2 id={titleId}>{text("Starting StudyApp Local", "Εκκίνηση του StudyApp Local")}</h2>
        <p>{text(
          "StudyApp Local needs port 8767. If another app is using it, close that app and try again.",
          "Το StudyApp Local χρειάζεται τη θύρα 8767. Αν τη χρησιμοποιεί άλλη εφαρμογή, κλείσε την και δοκίμασε ξανά.",
        )}</p>
        <p>{text(
          "If an earlier StudyApp Local is running, close its window or run Stop StudyApp Local Server.bat from its extracted folder. This file does not stop other apps.",
          "Αν λειτουργεί παλαιότερο StudyApp Local, κλείσε το παράθυρό του ή εκτέλεσε το Stop StudyApp Local Server.bat από τον αποσυμπιεσμένο φάκελό του. Το αρχείο δεν σταματά άλλες εφαρμογές.",
        )}</p>
        <button autoFocus onClick={() => dialog.current?.close()} type="button">{text("Close", "Κλείσιμο")}</button>
      </dialog>
    </span>
  );
}
