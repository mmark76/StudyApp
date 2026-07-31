import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { getStudyAppAssistantUrl } from "./assistantDestination";

type AssistantScreen = "intro" | "modes";

interface AssistantPanelProps {
  open: boolean;
  onClose: () => void;
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
  const { text } = useLanguage();
  const [screen, setScreen] = useState<AssistantScreen>("intro");
  const [message, setMessage] = useState("");
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const assistantUrl = getStudyAppAssistantUrl();

  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

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
    setMessage("");
    setScreen("modes");
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
                className="assistant-avatar-hero"
                src="/study-assistant-avatar.svg"
              />
              <p className="eyebrow">{text("Available", "Διαθέσιμο")}</p>
              <h3>{text("Study with ChatGPT", "Μελέτη με το ChatGPT")}</h3>
              <p className="assistant-intro-copy">
                {text(
                  "Open the dedicated StudyApp AI Assistant in ChatGPT to study, summarize, create flashcards or prepare quizzes.",
                  "Άνοιξε τον ειδικό Βοηθό AI του StudyApp στο ChatGPT για μελέτη, περιλήψεις, κάρτες ή κουίζ.",
                )}
              </p>

              <div className="assistant-actions">
                <a
                  className="button primary"
                  href={assistantUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {text("Start", "Έναρξη")}
                </a>
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
