import { getConfiguredCloudCoreUrl } from "../../infrastructure/cloud-core/cloudCoreClient";
import {
  getCloudCoreConnectionDescription,
  useCloudCoreConnection,
} from "../../infrastructure/cloud-core/useCloudCoreConnection";

export function CloudCoreStatus() {
  const { state, checkConnection } = useCloudCoreConnection();

  let endpoint = "Not configured";
  try {
    endpoint = getConfiguredCloudCoreUrl();
  } catch {
    // The status message below provides the user-facing configuration error.
  }

  return (
    <section className="content-panel" aria-labelledby="cloud-core-status-heading">
      <p className="eyebrow">Cloud connection</p>
      <h3 id="cloud-core-status-heading">Markellos Cloud Core</h3>
      <p>
        This check sends only an operational availability request. Study material,
        progress, files and settings remain in this browser.
      </p>
      <p>
        <strong>Endpoint:</strong> <code>{endpoint}</code>
      </p>
      <div className="button-row">
        <button
          className="button secondary"
          disabled={state.status === "checking"}
          onClick={() => void checkConnection()}
          type="button"
        >
          {state.status === "checking" ? "Checking…" : "Check connection"}
        </button>
      </div>
      <p className="inline-message" role="status" aria-live="polite">
        {getCloudCoreConnectionDescription(state)}
      </p>
    </section>
  );
}
