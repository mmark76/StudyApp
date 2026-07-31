import { useSyncExternalStore } from "react";
import {
  applyPwaUpdate,
  dismissPwaUpdate,
  getPwaUpdateState,
  subscribeToPwaUpdate,
  type PwaUpdateState,
} from "../../app/pwaUpdate";
import {
  useLanguage,
  type AppLanguage,
} from "../../i18n/LanguageContext";

export const PWA_UPDATE_COPY = {
  en: {
    title: "Update available",
    message: "A newer version of StudyApp is available.",
    update: "Update",
    later: "Later",
    applying: "Updating...",
    failure: "The update could not be completed. Try again.",
  },
  el: {
    title: "Διαθέσιμη ενημέρωση",
    message: "Υπάρχει νεότερη έκδοση του StudyApp.",
    update: "Ενημέρωση",
    later: "Αργότερα",
    applying: "Ενημέρωση...",
    failure: "Η ενημέρωση δεν ολοκληρώθηκε. Δοκίμασε ξανά.",
  },
} as const;

interface PwaUpdateNotificationProps {
  language: AppLanguage;
  onApply: () => void;
  onDismiss: () => void;
  updateState: PwaUpdateState;
}

export function PwaUpdateNotification({
  language,
  onApply,
  onDismiss,
  updateState,
}: PwaUpdateNotificationProps) {
  if (!updateState.isAvailable) return null;

  const copy = PWA_UPDATE_COPY[language];
  const message =
    updateState.errorCode === "apply-failed" ? copy.failure : copy.message;

  return (
    <aside
      aria-describedby="pwa-update-message"
      aria-labelledby="pwa-update-title"
      className="pwa-update-toast"
    >
      <div className="pwa-update-toast-copy">
        <h2 className="pwa-update-toast-title" id="pwa-update-title">
          {copy.title}
        </h2>
        <p
          aria-atomic="true"
          aria-live="polite"
          className={
            updateState.errorCode
              ? "pwa-update-toast-message is-error"
              : "pwa-update-toast-message"
          }
          id="pwa-update-message"
          role="status"
        >
          {message}
        </p>
      </div>
      <div className="pwa-update-toast-actions">
        <button
          className="button primary compact"
          disabled={updateState.isApplying}
          onClick={onApply}
          type="button"
        >
          {updateState.isApplying ? copy.applying : copy.update}
        </button>
        <button
          className="button secondary compact"
          disabled={updateState.isApplying}
          onClick={onDismiss}
          type="button"
        >
          {copy.later}
        </button>
      </div>
    </aside>
  );
}

export function PwaUpdateToast() {
  const { language } = useLanguage();
  const updateState = useSyncExternalStore(
    subscribeToPwaUpdate,
    getPwaUpdateState,
    getPwaUpdateState,
  );

  return (
    <PwaUpdateNotification
      language={language}
      onApply={() => void applyPwaUpdate()}
      onDismiss={dismissPwaUpdate}
      updateState={updateState}
    />
  );
}
