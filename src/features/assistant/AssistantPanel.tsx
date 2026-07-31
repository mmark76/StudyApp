import {
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  useLanguage,
  type AppLanguage,
} from "../../i18n/LanguageContext";
import { getStudyAppAssistantUrl } from "./assistantDestination";
import {
  ASSISTANT_WELCOME_COMPLETE_LABEL,
  ASSISTANT_WELCOME_COPY,
  TypewriterWelcome,
} from "./TypewriterWelcome";

type AssistantScreen = "intro" | "modes";

interface AssistantPanelProps {
  open: boolean;
  onClose: () => void;
}

export const ASSISTANT_AVATAR_ACTIVATION_DURATION_MS = 500;
export const ASSISTANT_OPENING_STATE_DURATION_MS = 800;

export const ASSISTANT_START_COPY = {
  en: {
    openingAccessibleName: "Opening StudyApp AI Assistant",
    openingLabel: "Opening...",
    startLabel: "Start",
  },
  el: {
    openingAccessibleName: "Άνοιγμα του Βοηθού AI του StudyApp",
    openingLabel: "Άνοιγμα...",
    startLabel: "Έναρξη",
  },
} as const;

export interface AssistantOpeningState {
  isAvatarActive: boolean;
  isOpening: boolean;
}

interface AssistantOpeningTimerApi {
  clearTimeout: (handle: ReturnType<typeof globalThis.setTimeout>) => void;
  setTimeout: (
    callback: () => void,
    delayMs: number,
  ) => ReturnType<typeof globalThis.setTimeout>;
}

export interface AssistantOpeningController {
  dispose: () => void;
  getState: () => AssistantOpeningState;
  reset: () => void;
  start: () => void;
}

const inactiveOpeningState: AssistantOpeningState = {
  isAvatarActive: false,
  isOpening: false,
};

export function createAssistantOpeningController(
  onStateChange: (state: AssistantOpeningState) => void,
  timerApi: AssistantOpeningTimerApi = {
    clearTimeout: (handle) => globalThis.clearTimeout(handle),
    setTimeout: (callback, delayMs) =>
      globalThis.setTimeout(callback, delayMs),
  },
): AssistantOpeningController {
  let avatarTimer: ReturnType<typeof globalThis.setTimeout> | undefined;
  let disposed = false;
  let openingTimer: ReturnType<typeof globalThis.setTimeout> | undefined;
  let state = inactiveOpeningState;

  function clearTimers() {
    if (avatarTimer !== undefined) {
      timerApi.clearTimeout(avatarTimer);
      avatarTimer = undefined;
    }
    if (openingTimer !== undefined) {
      timerApi.clearTimeout(openingTimer);
      openingTimer = undefined;
    }
  }

  function publish(nextState: AssistantOpeningState) {
    if (disposed) return;
    state = nextState;
    onStateChange(nextState);
  }

  function reset() {
    clearTimers();
    if (!state.isOpening && !state.isAvatarActive) return;
    publish(inactiveOpeningState);
  }

  function start() {
    if (disposed) return;
    clearTimers();
    publish({ isAvatarActive: true, isOpening: true });

    avatarTimer = timerApi.setTimeout(() => {
      avatarTimer = undefined;
      if (!state.isOpening) return;
      publish({ isAvatarActive: false, isOpening: true });
    }, ASSISTANT_AVATAR_ACTIVATION_DURATION_MS);

    openingTimer = timerApi.setTimeout(() => {
      openingTimer = undefined;
      publish(inactiveOpeningState);
    }, ASSISTANT_OPENING_STATE_DURATION_MS);
  }

  return {
    dispose: () => {
      clearTimers();
      disposed = true;
    },
    getState: () => state,
    reset,
    start,
  };
}

interface AssistantStartLinkProps {
  assistantUrl: string;
  isOpening: boolean;
  language: AppLanguage;
  linkRef?: RefObject<HTMLAnchorElement | null>;
  onActivate: () => void;
}

export function AssistantStartLink({
  assistantUrl,
  isOpening,
  language,
  linkRef,
  onActivate,
}: AssistantStartLinkProps) {
  const copy = ASSISTANT_START_COPY[language];

  return (
    <a
      aria-disabled={isOpening ? "true" : undefined}
      aria-label={isOpening ? copy.openingAccessibleName : undefined}
      className={
        isOpening
          ? "button primary assistant-start-link is-opening"
          : "button primary assistant-start-link"
      }
      href={assistantUrl}
      onClick={onActivate}
      ref={linkRef}
      rel="noopener noreferrer"
      tabIndex={isOpening ? -1 : undefined}
      target="_blank"
    >
      {isOpening ? (
        <span aria-hidden="true" className="assistant-start-spinner" />
      ) : null}
      <span>{isOpening ? copy.openingLabel : copy.startLabel}</span>
    </a>
  );
}

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector))
    .filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true");
}

export function AssistantPanel({ open, onClose }: AssistantPanelProps) {
  const { language, text } = useLanguage();
  const [screen, setScreen] = useState<AssistantScreen>("intro");
  const [message, setMessage] = useState("");
  const [openingState, setOpeningState] = useState<AssistantOpeningState>(
    inactiveOpeningState,
  );
  const openingControllerRef = useRef<AssistantOpeningController | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const startLinkRef = useRef<HTMLAnchorElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const assistantUrl = getStudyAppAssistantUrl();

  onCloseRef.current = onClose;

  useEffect(() => {
    const controller = createAssistantOpeningController(setOpeningState);
    openingControllerRef.current = controller;

    return () => {
      controller.dispose();
      if (openingControllerRef.current === controller) {
        openingControllerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!open) {
      openingControllerRef.current?.reset();
      return;
    }

    openingControllerRef.current?.reset();
    setScreen("intro");
    setMessage("");
    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const overlay = overlayRef.current;
    const backgroundElements = overlay?.parentElement
      ? Array.from(overlay.parentElement.children)
          .filter((element): element is HTMLElement =>
            element instanceof HTMLElement && element !== overlay,
          )
          .map((element) => ({ element, wasInert: element.inert }))
      : [];

    for (const { element } of backgroundElements) {
      element.inert = true;
    }

    document.body.classList.add("assistant-panel-open");
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusableElements = getFocusableElements(dialogRef.current);
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;
      const focusIsOutsideDialog =
        !(activeElement instanceof Node) ||
        !dialogRef.current.contains(activeElement);

      if (event.shiftKey && (activeElement === firstElement || focusIsOutsideDialog)) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && (activeElement === lastElement || focusIsOutsideDialog)) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("assistant-panel-open");
      openingControllerRef.current?.reset();

      for (const { element, wasInert } of backgroundElements) {
        element.inert = wasInert;
      }

      const previouslyFocused = previouslyFocusedRef.current;
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
      previouslyFocusedRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  function showModes() {
    openingControllerRef.current?.reset();
    setMessage("");
    setScreen("modes");
  }

  function startOpeningEffect() {
    openingControllerRef.current?.start();
    startLinkRef.current?.blur();
  }

  function showComingSoon(includeNoCharges = false) {
    setMessage(
      includeNoCharges
        ? text(
            "Coming soon. No charges yet.",
            "Σύντομα. Δεν γίνεται χρέωση ακόμη.",
          )
        : text("Coming soon.", "Σύντομα."),
    );
  }

  return (
    <div
      className="assistant-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current();
      }}
      ref={overlayRef}
    >
      <aside
        aria-labelledby="assistant-title"
        aria-modal="true"
        className="assistant-panel"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="assistant-header">
          <div className="assistant-identity">
            <img
              alt=""
              className="assistant-avatar-small"
              src="/study-assistant-avatar.svg"
            />
            <div>
              <p className="assistant-kicker">StudyApp</p>
              <h2 id="assistant-title">{text("AI Assistant", "Βοηθός AI")}</h2>
            </div>
          </div>
          <button
            aria-label={text("Close AI Assistant", "Κλείσιμο Βοηθού AI")}
            className="assistant-close"
            onClick={() => onCloseRef.current()}
            ref={closeButtonRef}
            type="button"
          >
            ×
          </button>
        </header>

        <div className="assistant-content">
          {screen === "intro" ? (
            <section className="assistant-welcome">
              <img
                alt=""
                className={
                  openingState.isAvatarActive
                    ? "assistant-avatar-hero is-activating"
                    : "assistant-avatar-hero"
                }
                src="/study-assistant-avatar.svg"
              />
              <p className="eyebrow">{text("Available", "Διαθέσιμο")}</p>
              <h3>{text("Study with ChatGPT", "Μελέτη με το ChatGPT")}</h3>
              <TypewriterWelcome
                completeLabel={text(
                  ASSISTANT_WELCOME_COMPLETE_LABEL.en,
                  ASSISTANT_WELCOME_COMPLETE_LABEL.el,
                )}
                restartKey={language}
                text={text(
                  ASSISTANT_WELCOME_COPY.en,
                  ASSISTANT_WELCOME_COPY.el,
                )}
              />

              <div className="assistant-actions">
                <AssistantStartLink
                  assistantUrl={assistantUrl}
                  isOpening={openingState.isOpening}
                  language={language}
                  linkRef={startLinkRef}
                  onActivate={startOpeningEffect}
                />
                <button
                  className="button secondary assistant-secondary-action"
                  onClick={showModes}
                  type="button"
                >
                  {text(
                    "View other AI options",
                    "Προβολή άλλων επιλογών AI",
                  )}
                </button>
              </div>
            </section>
          ) : (
            <section>
              <button
                aria-label={text(
                  "Back to Study with ChatGPT",
                  "Πίσω στη Μελέτη με το ChatGPT",
                )}
                className="assistant-back"
                onClick={() => {
                  openingControllerRef.current?.reset();
                  setMessage("");
                  setScreen("intro");
                }}
                type="button"
              >
                ← {text("Back", "Πίσω")}
              </button>
              <p className="eyebrow">{text("AI options", "Επιλογές AI")}</p>
              <h3>{text("Other AI options", "Άλλες επιλογές AI")}</h3>

              <div className="assistant-mode-grid">
                <a
                  aria-label={text(
                    "Open StudyApp AI Assistant in ChatGPT",
                    "Άνοιγμα του Βοηθού AI του StudyApp στο ChatGPT",
                  )}
                  className="assistant-mode-card"
                  href={assistantUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className="assistant-mode-status available">
                    {text("Available", "Διαθέσιμο")}
                  </span>
                  <strong>
                    {text(
                      "StudyApp AI Assistant",
                      "Βοηθός AI του StudyApp",
                    )}
                  </strong>
                  <small>
                    {text(
                      "Open the dedicated assistant in ChatGPT and provide your study material directly.",
                      "Άνοιξε τον ειδικό βοηθό στο ChatGPT και πρόσθεσε απευθείας το υλικό μελέτης σου.",
                    )}
                  </small>
                </a>

                <button
                  className="assistant-mode-card"
                  onClick={() => showComingSoon()}
                  type="button"
                >
                  <span className="assistant-mode-status soon">
                    {text("Coming soon", "Σύντομα")}
                  </span>
                  <strong>ChatGPT App / MCP</strong>
                  <small>
                    {text(
                      "Use StudyApp inside ChatGPT.",
                      "Χρήση του StudyApp μέσα στο ChatGPT.",
                    )}
                  </small>
                </button>

                <button
                  className="assistant-mode-card"
                  onClick={() => showComingSoon(true)}
                  type="button"
                >
                  <span className="assistant-mode-status soon">
                    {text("Coming soon", "Σύντομα")}
                  </span>
                  <strong>StudyApp AI</strong>
                  <small>
                    {text(
                      "Automatic AI is not active. No charges yet.",
                      "Το αυτόματο AI δεν είναι ενεργό. Δεν γίνεται χρέωση ακόμη.",
                    )}
                  </small>
                </button>
              </div>
            </section>
          )}

          {message ? (
            <p className="assistant-status" role="status" aria-live="polite">
              {message}
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
