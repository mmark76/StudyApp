import { useCallback, useEffect, useRef, useState } from "react";
import {
  CloudCoreConnectionError,
  fetchCloudCoreReadiness,
  type CloudCoreHealthResponse,
} from "./cloudCoreClient";

export type CloudCoreConnectionState =
  | { status: "checking" }
  | { status: "available"; health: CloudCoreHealthResponse; checkedAt: string }
  | { status: "unavailable"; message: string; checkedAt: string };

export interface UseCloudCoreConnectionOptions {
  pollIntervalMs?: number;
}

function isBrowserOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export function getCloudCoreConnectionLabel(state: CloudCoreConnectionState): string {
  switch (state.status) {
    case "available":
      return "Online";
    case "unavailable":
      return "Offline";
    default:
      return "Checking";
  }
}

export function getCloudCoreConnectionDescription(state: CloudCoreConnectionState): string {
  if (state.status === "checking") {
    return "Checking the Cloud Core connection…";
  }

  if (state.status === "unavailable") {
    return state.message;
  }

  const databaseCheck = state.health.checks?.find((check) => check.name === "database");
  const databaseMessage = databaseCheck
    ? ` Database: ${databaseCheck.status}${databaseCheck.latencyMs === undefined ? "" : ` (${databaseCheck.latencyMs} ms)`}.`
    : "";

  return `Connected to ${state.health.service} v${state.health.version}.${databaseMessage}`;
}

export function useCloudCoreConnection(
  options: UseCloudCoreConnectionOptions = {},
): {
  state: CloudCoreConnectionState;
  checkConnection: () => Promise<void>;
} {
  const { pollIntervalMs = 0 } = options;
  const [state, setState] = useState<CloudCoreConnectionState>({ status: "checking" });
  const mountedRef = useRef(false);
  const requestSequenceRef = useRef(0);

  const checkConnection = useCallback(async () => {
    const requestSequence = ++requestSequenceRef.current;

    if (mountedRef.current) {
      setState({ status: "checking" });
    }

    if (isBrowserOffline()) {
      if (mountedRef.current && requestSequence === requestSequenceRef.current) {
        setState({
          status: "unavailable",
          message: "No internet connection. Cloud services cannot be reached.",
          checkedAt: new Date().toISOString(),
        });
      }
      return;
    }

    try {
      const health = await fetchCloudCoreReadiness();
      if (mountedRef.current && requestSequence === requestSequenceRef.current) {
        setState({ status: "available", health, checkedAt: new Date().toISOString() });
      }
    } catch (error) {
      if (!mountedRef.current || requestSequence !== requestSequenceRef.current) {
        return;
      }

      setState({
        status: "unavailable",
        message:
          error instanceof CloudCoreConnectionError
            ? error.message
            : "Cloud Core could not be reached.",
        checkedAt: new Date().toISOString(),
      });
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void checkConnection();

    function handleOnline() {
      void checkConnection();
    }

    function handleOffline() {
      requestSequenceRef.current += 1;
      setState({
        status: "unavailable",
        message: "No internet connection. Cloud services cannot be reached.",
        checkedAt: new Date().toISOString(),
      });
    }

    function handleFocus() {
      void checkConnection();
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("focus", handleFocus);

    const intervalId =
      pollIntervalMs > 0
        ? window.setInterval(() => {
            void checkConnection();
          }, pollIntervalMs)
        : undefined;

    return () => {
      mountedRef.current = false;
      requestSequenceRef.current += 1;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("focus", handleFocus);
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
    };
  }, [checkConnection, pollIntervalMs]);

  return { state, checkConnection };
}
