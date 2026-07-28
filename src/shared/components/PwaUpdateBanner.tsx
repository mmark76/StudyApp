import { useSyncExternalStore } from "react";
import {
  applyPwaUpdate,
  dismissPwaUpdate,
  getPwaUpdateState,
  subscribeToPwaUpdate,
} from "../../app/pwaUpdate";

export function PwaUpdateBanner() {
  const updateState = useSyncExternalStore(
    subscribeToPwaUpdate,
    getPwaUpdateState,
    getPwaUpdateState,
  );

  if (!updateState.isAvailable) {
    return null;
  }

  return (
    <aside className="pwa-update-banner" aria-labelledby="pwa-update-title">
      <div>
        <strong id="pwa-update-title">A StudyApp update is ready.</strong>
        <p role="status" aria-live="polite">
          {updateState.errorMessage
            ?? "Apply it when you have finished your current input. StudyApp will reload only after you choose Update now."}
        </p>
      </div>
      <div className="button-row">
        <button
          className="button primary compact"
          disabled={updateState.isApplying}
          type="button"
          onClick={() => void applyPwaUpdate()}
        >
          {updateState.isApplying ? "Updating..." : "Update now"}
        </button>
        <button
          className="button secondary compact"
          disabled={updateState.isApplying}
          type="button"
          onClick={dismissPwaUpdate}
        >
          Later
        </button>
      </div>
    </aside>
  );
}
