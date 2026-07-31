import type {
  LocalWriteFailureInjector,
  LocalWriteKind,
} from "../infrastructure/database/localWriteFailureInjector";

interface E2ELocalWriteControl {
  attempts?: Partial<Record<LocalWriteKind, number>>;
  failNext?: LocalWriteKind;
  pauseNext?: LocalWriteKind;
  releasePending?: () => void;
}

declare global {
  interface Window {
    __STUDYAPP_E2E_LOCAL_WRITE__?: E2ELocalWriteControl;
  }
}

function getControl(): E2ELocalWriteControl {
  window.__STUDYAPP_E2E_LOCAL_WRITE__ ??= {};
  return window.__STUDYAPP_E2E_LOCAL_WRITE__;
}

export function createE2ELocalWriteFailureInjector(): LocalWriteFailureInjector {
  return {
    async beforeWrite(kind) {
      const control = getControl();
      control.attempts ??= {};
      control.attempts[kind] = (control.attempts[kind] ?? 0) + 1;

      if (control.failNext === kind) {
        delete control.failNext;
        throw new Error(`E2E ${kind} local write failure`);
      }

      if (control.pauseNext === kind) {
        delete control.pauseNext;
        await new Promise<void>((resolve) => {
          control.releasePending = () => {
            delete control.releasePending;
            resolve();
          };
        });
      }
    },
  };
}
