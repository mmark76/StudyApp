import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage, type AppLanguage } from "../../i18n/LanguageContext";

type AssistantScreen = "modes" | "tasks" | "companion";
type CompanionTaskId = "ask" | "flashcards" | "quiz" | "summarize" | "explain";

interface AssistantPanelProps {
  open: boolean;
  onClose: () => void;
}

const companionTasks: readonly {
  id: CompanionTaskId;
  en: string;
  el: string;
}[] = [
  { id: "ask", en: "Ask a question", el: "Κάνε μια ερώτηση" },
  { id: "flashcards", en: "Create flashcards", el: "Δημιούργησε κάρτες" },
  { id: "quiz", en: "Create a quiz", el: "Δημιούργησε κουίζ" },
  { id: "summarize", en: "Summarize", el: "Κάνε περίληψη" },
  { id: "explain", en: "Explain a concept", el: "Εξήγησε μια έννοια" },
] as const;

function buildCompanionPrompt(
  taskId: CompanionTaskId,
  material: string,
  language: AppLanguage,
): string {
  const instructions: Record<CompanionTaskId, { en: string; el: string }> = {
    ask: {
      en: "Answer my question using only the study material below. If information is missing, say so clearly.",
      el: "Απάντησε στην ερώτησή μου χρησιμοποιώντας μόνο το παρακάτω υλικό. Αν λείπουν πληροφορίες, ανέφερέ το καθαρά.",
    },
    flashcards: {
      en: "Create 10 concise study flashcards from the material below. Use a clear Question / Answer format.",
      el: "Δημιούργησε 10 σύντομες κάρτες μελέτης από το παρακάτω υλικό, σε μορφή Ερώτηση / Απάντηση.",
    },
    quiz: {
      en: "Create a 10-question multiple-choice quiz from the material below. Include the correct answer and a short explanation.",
      el: "Δημιούργησε κουίζ 10 ερωτήσεων πολλαπλής επιλογής από το παρακάτω υλικό. Πρόσθεσε τη σωστή απάντηση και σύντομη εξήγηση.",
    },
    summarize: {
      en: "Summarize the study material below into clear headings and key points.",
      el: "Σύνοψε το παρακάτω υλικό με σαφείς τίτλους και βασικά σημεία.",
    },
    explain: {
      en: "Explain the main concept in the study material below simply, with one useful example.",
      el: "Εξήγησε απλά τη βασική έννοια του παρακάτω υλικού και δώσε ένα χρήσιμο παράδειγμα.",
    },
  };

  const instruction = instructions[taskId][language];
  const responseLanguage = language === "el"
    ? "Απάντησε στα ελληνικά."
    : "Answer in English.";

  return `${instruction}\n\n${responseLanguage}\n\nSTUDY MATERIAL:\n${material.trim()}`;
}

export function AssistantPanel({ open, onClose }: AssistantPanelProps) {
  const { language, text } = useLanguage();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [screen, setScreen] = useState<AssistantScreen>("modes");
  const [taskId, setTaskId] = useState<CompanionTaskId>("ask");
  const [material, setMaterial] = useState("");
  const [message, setMessage] = useState("");

  const prompt = useMemo(
    () => material.trim() ? buildCompanionPrompt(taskId, material, language) : "",
    [language, material, taskId],
  );

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.classList.add("assistant-panel-open");
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("assistant-panel-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  function showComingSoon(isPaid = false) {
    setMessage(
      isPaid
        ? text("Coming soon — no charges yet.", "Σύντομα — δεν γίνεται χρέωση ακόμη.")
        : text("Coming soon.", "Σύντομα."),
    );
  }

  function selectTask(nextTaskId: CompanionTaskId) {
    setTaskId(nextTaskId);
    setMessage("");
    setScreen("companion");
  }

  async function copyPrompt() {
    if (!prompt) {
      setMessage(text("Add study text first.", "Πρόσθεσε πρώτα υλικό μελέτης."));
      return;
    }

    try {
      await navigator.clipboard.writeText(prompt);
      setMessage(text("Prompt copied.", "Το prompt αντιγράφηκε."));
    } catch {
      setMessage(text("Copy failed.", "Η αντιγραφή απέτυχε."));
    }
  }

  function openChatGpt() {
    window.open("https://chatgpt.com/", "_blank", "noopener,noreferrer");
  }

  return (
    <div className="assistant-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside
        aria-labelledby="assistant-title"
        aria-modal="true"
        className="assistant-panel"
        role="dialog"
      >
        <header className="assistant-header">
          <div className="assistant-identity">
            <img alt="" className="assistant-avatar-small" src="/study-assistant-avatar.svg" />
            <div>
              <p className="assistant-kicker">StudyApp</p>
              <h2 id="assistant-title">{text("AI Assistant", "Βοηθός AI")}</h2>
            </div>
          </div>
          <button
            aria-label={text("Close AI Assistant", "Κλείσιμο Βοηθού AI")}
            className="assistant-close"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            ×
          </button>
        </header>

        <div className="assistant-content">
          {screen === "modes" && (
            <section className="assistant-welcome">
              <img alt="" className="assistant-avatar-hero" src="/study-assistant-avatar.svg" />
              <p className="eyebrow">{text("Choose mode", "Επίλεξε τρόπο")}</p>
              <h3>{text("How do you want to use AI?", "Πώς θέλεις να χρησιμοποιήσεις το AI;")}</h3>

              <div className="assistant-mode-grid">
                <button className="assistant-mode-card" onClick={() => { setMessage(""); setScreen("tasks"); }} type="button">
                  <span className="assistant-mode-status available">{text("Available", "Διαθέσιμο")}</span>
                  <strong>ChatGPT Companion</strong>
                  <small>{text("Copy a prompt and open ChatGPT.", "Αντιγραφή prompt και άνοιγμα ChatGPT.")}</small>
                </button>

                <button className="assistant-mode-card" onClick={() => showComingSoon()} type="button">
                  <span className="assistant-mode-status soon">{text("Coming soon", "Σύντομα")}</span>
                  <strong>ChatGPT App / MCP</strong>
                  <small>{text("Use StudyApp inside ChatGPT.", "Χρήση του StudyApp μέσα στο ChatGPT.")}</small>
                </button>

                <button className="assistant-mode-card" onClick={() => showComingSoon(true)} type="button">
                  <span className="assistant-mode-status soon">{text("Coming soon", "Σύντομα")}</span>
                  <strong>StudyApp AI</strong>
                  <small>{text("Automatic AI with StudyApp credits.", "Αυτόματο AI με credits του StudyApp.")}</small>
                </button>
              </div>
            </section>
          )}

          {screen === "tasks" && (
            <section>
              <button className="assistant-back" onClick={() => setScreen("modes")} type="button">
                ← {text("Back", "Πίσω")}
              </button>
              <p className="eyebrow">ChatGPT Companion</p>
              <h3>{text("Choose a task", "Επίλεξε εργασία")}</h3>
              <div className="assistant-task-grid">
                {companionTasks.map((task) => (
                  <button
                    className="assistant-task-card"
                    key={task.id}
                    onClick={() => selectTask(task.id)}
                    type="button"
                  >
                    <strong>{text(task.en, task.el)}</strong>
                  </button>
                ))}
              </div>
            </section>
          )}

          {screen === "companion" && (
            <section>
              <button className="assistant-back" onClick={() => setScreen("tasks")} type="button">
                ← {text("Back", "Πίσω")}
              </button>
              <p className="eyebrow">ChatGPT Companion</p>
              <h3>{text(
                companionTasks.find((task) => task.id === taskId)?.en ?? "Task",
                companionTasks.find((task) => task.id === taskId)?.el ?? "Εργασία",
              )}</h3>

              <label className="field-label assistant-paste-field">
                {text("Study text", "Υλικό μελέτης")}
                <textarea
                  maxLength={12_000}
                  onChange={(event) => setMaterial(event.target.value)}
                  placeholder={text("Paste the text you want to use", "Επικόλλησε το κείμενο που θέλεις να χρησιμοποιήσεις")}
                  rows={8}
                  value={material}
                />
              </label>

              {prompt && (
                <label className="field-label assistant-prompt-preview">
                  {text("Prepared prompt", "Έτοιμο prompt")}
                  <textarea readOnly rows={10} value={prompt} />
                </label>
              )}

              <div className="assistant-actions">
                <button className="button primary" onClick={() => void copyPrompt()} type="button">
                  {text("Copy prompt", "Αντιγραφή prompt")}
                </button>
                <button className="button secondary" onClick={openChatGpt} type="button">
                  {text("Open ChatGPT", "Άνοιγμα ChatGPT")}
                </button>
              </div>
            </section>
          )}

          {message && <p className="assistant-status" role="status" aria-live="polite">{message}</p>}
        </div>
      </aside>
    </div>
  );
}
