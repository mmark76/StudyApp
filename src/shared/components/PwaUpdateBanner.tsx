import { useSyncExternalStore } from "react";
import {
  applyPwaUpdate,
  dismissPwaUpdate,
  getPwaUpdateState,
  subscribeToPwaUpdate,
} from "../../app/pwaUpdate";
import { useLanguage } from "../../i18n/LanguageContext";

export function PwaUpdateBanner() {
  const { text } = useLanguage();
  const updateState = useSyncExternalStore(
    subscribeToPwaUpdate,
    getPwaUpdateState,
    getPwaUpdateState,
  );

  if (!updateState.isAvailable) return null;

  return (
    <aside className="pwa-update-banner" aria-labelledby="pwa-update-title">
      <div>
        <strong id="pwa-update-title">{text("A StudyApp update is ready.", "Υπάρχει νέα έκδοση του StudyApp.")}</strong>
        <p role="status" aria-live="polite">
          {updateState.errorMessage
            ?? text("Update when you finish your current work.", "Κάνε ενημέρωση όταν ολοκληρώσεις την τρέχουσα εργασία.")}
        </p>
      </div>
      <div className="button-row">
        <button
          className="button primary compact"
          disabled={updateState.isApplying}
          type="button"
          onClick={() => void applyPwaUpdate()}
        >
          {updateState.isApplying
            ? text("Updating...", "Ενημέρωση...")
            : text("Update now", "Ενημέρωση τώρα")}
        </button>
        <button
          className="button secondary compact"
          disabled={updateState.isApplying}
          type="button"
          onClick={dismissPwaUpdate}
        >
          {text("Later", "Αργότερα")}
        </button>
      </div>
    </aside>
  );
}
