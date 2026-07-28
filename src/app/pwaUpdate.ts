export interface PwaUpdateState {
  isAvailable: boolean;
  isApplying: boolean;
  errorMessage: string | null;
}

type PwaUpdateHandler = () => Promise<void>;
type PwaUpdateListener = () => void;

let updateHandler: PwaUpdateHandler | null = null;
let state: PwaUpdateState = {
  isAvailable: false,
  isApplying: false,
  errorMessage: null,
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
    errorMessage: null,
  });
}

export function dismissPwaUpdate(): void {
  publish({
    isAvailable: false,
    isApplying: false,
    errorMessage: null,
  });
}

export async function applyPwaUpdate(): Promise<void> {
  if (!updateHandler || state.isApplying) {
    return;
  }

  publish({
    isAvailable: true,
    isApplying: true,
    errorMessage: null,
  });

  try {
    await updateHandler();
    publish({
      isAvailable: false,
      isApplying: false,
      errorMessage: null,
    });
  } catch {
    publish({
      isAvailable: true,
      isApplying: false,
      errorMessage: "The update could not be applied. Your work is unchanged; try again when convenient.",
    });
  }
}
