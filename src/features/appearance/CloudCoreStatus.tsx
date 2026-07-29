import { useCallback, useEffect, useState } from "react";
import {
  CloudCoreConnectionError,
  fetchCloudCoreReadiness,
  getConfiguredCloudCoreUrl,
  type CloudCoreHealthResponse,
} from "../../infrastructure/cloud-core/cloudCoreClient";

type ConnectionState =
  | { status: "checking" }
  | { status: "connected"; health: CloudCoreHealthResponse }
  | { status: "error"; message: string };

function getConnectionMessage(state: ConnectionState): string {
  if (state.status === "checking") {
    return "Checking the Cloud Core connection…";
  }

  if (state.status === "error") {
    return state.message;
  }

  const databaseCheck = state.health.checks?.find((check) => check.name === "database");
  const databaseMessage = databaseCheck
    ? ` Database: ${databaseCheck.status}${databaseCheck.latencyMs === undefined ? "" : ` (${databaseCheck.latencyMs} ms)`}.`
    : "";

  return `Connected to ${state.health.service} v${state.health.version}.${databaseMessage}`;
}

export function CloudCoreStatus() {
  const [state, setState] = useState<ConnectionState>({ status: "checking" });

  const checkConnection = useCallback(async () => {
    setState({ status: "checking" });

    try {
      const health = await fetchCloudCoreReadiness();
      setState({ status: "connected", health });
    } catch (error) {
      const message =
        error instanceof CloudCoreConnectionError
          ? error.message
          : "Cloud Core could not be reached.";
      setState({ status: "error", message });
    }
  }, []);

  useEffect(() => {
    void checkConnection();
  }, [checkConnection]);

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
        {getConnectionMessage(state)}
      </p>
    </section>
  );
}
