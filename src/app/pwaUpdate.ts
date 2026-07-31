export type PwaUpdateErrorCode = "apply-failed";

export interface PwaUpdateState {
  isAvailable: boolean;
  isApplying: boolean;
  errorCode: PwaUpdateErrorCode | null;
}

type PwaUpdateHandler = () => Promise<void>;
type PwaUpdateListener = () => void;
type E2EPwaUpdateMode = "failure" | "pending" | "success";

interface E2EPwaUpdateControl {
  attempts: number;
  getState: () => PwaUpdateState;
  releasePending?: () => void;
  show: (mode: E2EPwaUpdateMode) => void;
}

declare global {
  interface Window {
    __STUDYAPP_E2E_PWA_UPDATE__?: E2EPwaUpdateControl;
  }
}

let updateHandler: PwaUpdateHandler | null = null;
let state: PwaUpdateState = {
  isAvailable: false,
  isApplying: false,
  errorCode: null,
};
const listeners = new Set<PwaUpdateListener>();

function publish(nextState: PwaUpdateState): void {
  state = nextState;
  listeners.forEach((listener) => listener());
}

export function getPwaUpdateState(): PwaUpdateState {
  return state;
}

export function subscribeToPwaUpdate(listener: PwaUpdateListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setPwaUpdateHandler(handler: PwaUpdateHandler | null): void {
  updateHandler = handler;
}

export function announcePwaUpdate(): void {
  publish({
    isAvailable: true,
    isApplying: false,
    errorCode: null,
  });
}

export function dismissPwaUpdate(): void {
  publish({
    isAvailable: false,
    isApplying: false,
    errorCode: null,
  });
}

export async function applyPwaUpdate(): Promise<void> {
  if (!updateHandler || state.isApplying) {
    return;
  }

  publish({
    isAvailable: true,
    isApplying: true,
    errorCode: null,
  });

  try {
    await updateHandler();
    publish({
      isAvailable: false,
      isApplying: false,
      errorCode: null,
    });
  } catch {
    publish({
      isAvailable: true,
      isApplying: false,
      errorCode: "apply-failed",
    });
  }
}

if (import.meta.env.MODE === "e2e" && typeof window !== "undefined") {
  const control: E2EPwaUpdateControl = {
    attempts: 0,
    getState: getPwaUpdateState,
    show(mode) {
      control.attempts = 0;
      delete control.releasePending;
      setPwaUpdateHandler(async () => {
        control.attempts += 1;

        if (mode === "failure") {
          throw new Error("E2E service worker update failure");
        }

        if (mode === "pending") {
          await new Promise<void>((resolve) => {
            control.releasePending = () => {
              delete control.releasePending;
              resolve();
            };
          });
        }
      });
      announcePwaUpdate();
    },
  };

  window.__STUDYAPP_E2E_PWA_UPDATE__ = control;
}
