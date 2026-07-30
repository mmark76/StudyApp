import {
  type ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLanguage, type AppLanguage } from "../../i18n/LanguageContext";
import {
  ASSISTANT_IMPORT_ACCEPT,
  extractAssistantMaterial,
} from "./assistantMaterialImport";
import {
  openStudyAppAssistant,
  type AssistantPopupResult,
} from "./assistantPopupPositioning";

type AssistantScreen = "intro" | "modes" | CompanionStepScreen;
export type CompanionStepScreen = "material" | "goal" | "review";
type CompanionTaskId = "explain" | "summarize" | "flashcards" | "quiz" | "custom";

interface AssistantPanelProps {
  open: boolean;
  onClose: () => void;
}

const companionTasks: readonly {
  id: CompanionTaskId;
  en: string;
  el: string;
  descriptionEn: string;
  descriptionEl: string;
  continueEn: string;
  continueEl: string;
}[] = [
  {
    id: "explain",
    en: "Explain the material",
    el: "Εξήγηση του υλικού",
    descriptionEn: "Clarify the main ideas with an example.",
    descriptionEl: "Αποσαφήνισε τις βασικές ιδέες με παράδειγμα.",
    continueEn: "Continue: Explain material",
    continueEl: "Συνέχεια: Εξήγηση υλικού",
  },
  {
    id: "summarize",
    en: "Create a summary",
    el: "Δημιουργία περίληψης",
    descriptionEn: "Organize the content into headings and key points.",
    descriptionEl: "Οργάνωσε το περιεχόμενο σε τίτλους και βασικά σημεία.",
    continueEn: "Continue: Create summary",
    continueEl: "Συνέχεια: Δημιουργία περίληψης",
  },
  {
    id: "flashcards",
    en: "Create flashcards",
    el: "Δημιουργία καρτών",
    descriptionEn: "Turn the material into concise question-and-answer cards.",
    descriptionEl: "Μετέτρεψε το υλικό σε σύντομες κάρτες ερώτησης και απάντησης.",
    continueEn: "Continue: Create flashcards",
    continueEl: "Συνέχεια: Δημιουργία καρτών",
  },
  {
    id: "quiz",
    en: "Create a quiz",
    el: "Δημιουργία κουίζ",
    descriptionEn: "Prepare multiple-choice questions with explanations.",
    descriptionEl: "Ετοίμασε ερωτήσεις πολλαπλής επιλογής με επεξηγήσεις.",
    continueEn: "Continue: Create quiz",
    continueEl: "Συνέχεια: Δημιουργία κουίζ",
  },
  {
    id: "custom",
    en: "Custom request",
    el: "Προσαρμοσμένο αίτημα",
    descriptionEn: "Write exactly what you want ChatGPT to do.",
    descriptionEl: "Γράψε ακριβώς τι θέλεις να κάνει το ChatGPT.",
    continueEn: "Continue with custom request",
    continueEl: "Συνέχεια με προσαρμοσμένο αίτημα",
  },
] as const;

const STUDYAPP_AI_ASSISTANT_URL =
  (import.meta.env as Record<string, string | undefined>)
    .VITE_STUDYAPP_AI_ASSISTANT_URL?.trim() || "https://chatgpt.com/";

const companionStepSequence: readonly CompanionStepScreen[] = [
  "material",
  "goal",
  "review",
];

export function moveCompanionStep(
  current: CompanionStepScreen,
  direction: "back" | "next",
): CompanionStepScreen {
  const currentIndex = companionStepSequence.indexOf(current);
  const offset = direction === "next" ? 1 : -1;
  const nextIndex = Math.min(
    companionStepSequence.length - 1,
    Math.max(0, currentIndex + offset),
  );

  return companionStepSequence[nextIndex];
}

export function buildCompanionPrompt(
  taskId: CompanionTaskId,
  material: string,
  language: AppLanguage,
  customRequest = "",
): string {
  const lines = [
    `STUDYAPP TASK: ${taskId}`,
    `RESPONSE LANGUAGE: ${language}`,
  ];

  if (taskId === "custom") {
    lines.push("", "CUSTOM REQUEST:", customRequest.trim());
  }

  lines.push("", "STUDY MATERIAL:", material.trim());
  return lines.join("\n");
}

type ClipboardWriter = (value: string) => Promise<void>;

export async function copyToClipboard(
  value: string,
  writeText: ClipboardWriter = (text) => navigator.clipboard.writeText(text),
): Promise<boolean> {
  try {
    await writeText(value.trim());
    return true;
  } catch {
    return false;
  }
}

type AssistantText = (english: string, greek: string) => string;
export type ClipboardOutcome = "idle" | "copied" | "failed";
type AssistantFileAction = "choose" | "replace";

interface AssistantFileButtonProps {
  action: AssistantFileAction;
  isImporting: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  text: AssistantText;
}

export function AssistantFileButton({
  action,
  isImporting,
  onChange,
  text,
}: AssistantFileButtonProps) {
  const inputId = `assistant-${action}-file`;
  const actionLabel =
    action === "replace"
      ? text("Replace file", "Αντικατάσταση αρχείου")
      : text("Choose file", "Επιλογή αρχείου");

  return (
    <label
      aria-busy={isImporting}
      aria-disabled={isImporting}
      className="button secondary assistant-secondary-action assistant-file-button"
      htmlFor={inputId}
    >
      {isImporting ? text("Reading...", "Ανάγνωση...") : actionLabel}
      <input
        accept={ASSISTANT_IMPORT_ACCEPT}
        disabled={isImporting}
        id={inputId}
        type="file"
        onChange={onChange}
      />
    </label>
  );
}

export function getAssistantPopupStatusMessage(
  popupResult: AssistantPopupResult,
  text: AssistantText,
): string {
  if (popupResult.status === "invalid-url") {
    return text(
      "The configured assistant link is not allowed, so no popup was opened. Use the safe fallback link below.",
      "Ο ρυθμισμένος σύνδεσμος του βοηθού δεν επιτρέπεται και δεν άνοιξε αναδυόμενο παράθυρο. Χρησιμοποίησε τον ασφαλή σύνδεσμο παρακάτω.",
    );
  }

  if (popupResult.status === "blocked") {
    return text(
      "The assistant popup was blocked. Use the fallback link below.",
      "Το αναδυόμενο παράθυρο του βοηθού αποκλείστηκε. Χρησιμοποίησε τον σύνδεσμο παρακάτω.",
    );
  }

  return text(
    "The StudyApp AI Assistant popup opened.",
    "Το αναδυόμενο παράθυρο του StudyApp AI Assistant άνοιξε.",
  );
}

export function getAssistantClipboardStatusMessage(
  clipboardOutcome: Exclude<ClipboardOutcome, "idle">,
  text: AssistantText,
): string {
  return clipboardOutcome === "copied"
    ? text(
        "The request was copied. Paste it into the assistant window.",
        "Το αίτημα αντιγράφηκε. Επικόλλησέ το στο παράθυρο του βοηθού.",
      )
    : text(
        "Clipboard access failed. The prepared request remains available below for manual copy and paste.",
        "Η πρόσβαση στο πρόχειρο απέτυχε. Το έτοιμο αίτημα παραμένει διαθέσιμο παρακάτω για χειροκίνητη αντιγραφή και επικόλληση.",
      );
}

export function getAssistantImportStatusMessage(
  copied: boolean,
  truncated: boolean,
  text: AssistantText,
): string {
  if (copied) {
    return text(
      "The extracted text was copied to the clipboard.",
      "Το εξαγόμενο κείμενο αντιγράφηκε στο πρόχειρο.",
    );
  }

  return truncated
    ? text(
        "Clipboard access was unavailable. The first 12,000 extracted characters are ready and can still be used.",
        "Δεν ήταν διαθέσιμη η πρόσβαση στο πρόχειρο. Οι πρώτοι 12.000 χαρακτήρες του εξαγόμενου κειμένου είναι έτοιμοι και μπορούν να χρησιμοποιηθούν.",
      )
    : text(
        "Clipboard access was unavailable. The extracted text is ready and can still be used.",
        "Δεν ήταν διαθέσιμη η πρόσβαση στο πρόχειρο. Το εξαγόμενο κείμενο είναι έτοιμο και μπορεί να χρησιμοποιηθεί.",
      );
}

interface AssistantReviewStepProps {
  clipboardOutcome: ClipboardOutcome;
  onBack: () => void;
  popupResult: AssistantPopupResult;
  preparedPrompt: string;
  text: AssistantText;
}

export function AssistantReviewStep({
  clipboardOutcome,
  onBack,
  popupResult,
  preparedPrompt,
  text,
}: AssistantReviewStepProps) {
  const popupFailed = popupResult.status !== "opened";

  return (
    <>
      <section>
        <button
          className="assistant-back"
          onClick={onBack}
          type="button"
        >
          ←{" "}
          {text(
            "Back to previous step",
            "Πίσω στο προηγούμενο βήμα",
          )}
        </button>
        <p className="assistant-progress">
          {text("Step 3 of 3", "Βήμα 3 από 3")}
        </p>
        <h3 className="assistant-review-heading">
          {text(
            "Continue in the StudyApp AI Assistant",
            "Συνέχισε στο StudyApp AI Assistant",
          )}
        </h3>
        <p className="assistant-step-intro">
          {popupFailed
            ? text(
                "Open the assistant with the safe link below, then paste the prepared request manually.",
                "Άνοιξε τον βοηθό από τον ασφαλή σύνδεσμο παρακάτω και μετά επικόλλησε χειροκίνητα το έτοιμο αίτημα.",
              )
            : text(
                "The assistant window opened beside this panel. Paste the copied request into its message box.",
                "Το παράθυρο του βοηθού άνοιξε δίπλα σε αυτό το panel. Επικόλλησε το αντιγραμμένο αίτημα στο πεδίο μηνύματός του.",
              )}
        </p>

        {popupFailed ? (
          <a
            className="button secondary assistant-secondary-action assistant-popup-fallback"
            href={popupResult.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            {text(
              "Continue in the StudyApp AI Assistant",
              "Συνέχισε στο StudyApp AI Assistant",
            )}
          </a>
        ) : null}

        <label className="field-label assistant-prompt-preview">
          {text("Prepared request", "Έτοιμο αίτημα")}
          <textarea readOnly rows={10} value={preparedPrompt} />
          <small>
            {text(
              "You can always select, copy and paste this request manually.",
              "Μπορείς πάντα να επιλέξεις, να αντιγράψεις και να επικολλήσεις αυτό το αίτημα χειροκίνητα.",
            )}
          </small>
        </label>
      </section>

      <p className="assistant-status" role="status" aria-live="polite">
        {getAssistantPopupStatusMessage(popupResult, text)}
      </p>

      {clipboardOutcome !== "idle" ? (
        <p className="assistant-status" role="status" aria-live="polite">
          {getAssistantClipboardStatusMessage(clipboardOutcome, text)}
        </p>
      ) : null}
    </>
  );
}

export function AssistantPanel({ open, onClose }: AssistantPanelProps) {
  const { language, text } = useLanguage();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const importAttemptRef = useRef(0);
  const reviewAttemptRef = useRef(0);
  const [screen, setScreen] = useState<AssistantScreen>("intro");
  const [taskId, setTaskId] = useState<CompanionTaskId | null>(null);
  const [material, setMaterial] = useState("");
  const [importedFileName, setImportedFileName] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [customRequest, setCustomRequest] = useState("");
  const [message, setMessage] = useState("");
  const [popupResult, setPopupResult] = useState<AssistantPopupResult | null>(
    null,
  );
  const [clipboardOutcome, setClipboardOutcome] =
    useState<ClipboardOutcome>("idle");
  const [preparedPrompt, setPreparedPrompt] = useState("");

  const selectedTask = useMemo(
    () => companionTasks.find((task) => task.id === taskId) ?? null,
    [taskId],
  );
  const canContinueFromGoal = Boolean(
    taskId && (taskId !== "custom" || customRequest.trim()),
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

  function goTo(nextScreen: AssistantScreen) {
    reviewAttemptRef.current += 1;
    setMessage("");
    setPopupResult(null);
    setClipboardOutcome("idle");
    setScreen(nextScreen);
  }

  function moveStep(direction: "back" | "next") {
    reviewAttemptRef.current += 1;
    setMessage("");
    setPopupResult(null);
    setClipboardOutcome("idle");
    setScreen((current) =>
      current === "material" || current === "goal" || current === "review"
        ? moveCompanionStep(current, direction)
        : current,
    );
  }

  function showComingSoon(isPaid = false) {
    setMessage(
      isPaid
        ? text("Coming soon — no charges yet.", "Σύντομα — δεν γίνεται χρέωση ακόμη.")
        : text("Coming soon.", "Σύντομα."),
    );
  }

  async function importMaterialFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file || isImporting) return;

    const importAttempt = importAttemptRef.current + 1;
    importAttemptRef.current = importAttempt;
    setIsImporting(true);
    setMessage(text("Reading the file locally...", "Ανάγνωση του αρχείου τοπικά..."));

    try {
      const result = await extractAssistantMaterial(file);
      if (importAttemptRef.current !== importAttempt) return;

      setMaterial(result.text);
      setImportedFileName(file.name);
      const copied = await copyToClipboard(result.text);
      if (importAttemptRef.current !== importAttempt) return;

      setMessage(getAssistantImportStatusMessage(copied, result.truncated, text));
    } catch (error) {
      if (importAttemptRef.current !== importAttempt) return;

      setMessage(
        language === "en" && error instanceof Error
          ? error.message
          : text(
              "The file could not be imported. Choose a PDF, TXT, Markdown, or CSV file.",
              "Το αρχείο δεν μπορεί να εισαχθεί. Επίλεξε PDF, TXT, Markdown ή CSV.",
            ),
      );
    } finally {
      input.value = "";
      if (importAttemptRef.current === importAttempt) {
        setIsImporting(false);
      }
    }
  }

  function clearImportedMaterial() {
    importAttemptRef.current += 1;
    setImportedFileName(null);
    setMaterial("");
    setMessage("");
    setIsImporting(false);
  }

  async function continueFromMaterial() {
    if (!material.trim()) {
      setMessage(text("Add study text first.", "Πρόσθεσε πρώτα υλικό μελέτης."));
      return;
    }

    const copied = await copyToClipboard(material);
    setMessage(
      copied
        ? text(
            "Study material copied to the clipboard.",
            "Το υλικό μελέτης αντιγράφηκε στο πρόχειρο.",
          )
        : text(
            "Clipboard access was unavailable. You can still continue.",
            "Δεν ήταν διαθέσιμη η πρόσβαση στο πρόχειρο. Μπορείς να συνεχίσεις.",
          ),
    );
    setScreen(moveCompanionStep("material", "next"));
  }

  function continueToReview() {
    if (!material.trim()) {
      setScreen("material");
      setMessage(text("Add study text first.", "Πρόσθεσε πρώτα υλικό μελέτης."));
      return;
    }

    if (!taskId) {
      setMessage(text("Choose a study goal first.", "Επίλεξε πρώτα στόχο μελέτης."));
      return;
    }

    if (!canContinueFromGoal) {
      setMessage(text("Write your custom request first.", "Γράψε πρώτα το προσαρμοσμένο αίτημά σου."));
      return;
    }

    const prompt = buildCompanionPrompt(
      taskId,
      material,
      language,
      customRequest,
    );

    const reviewAttempt = reviewAttemptRef.current + 1;
    reviewAttemptRef.current = reviewAttempt;
    const nextPopupResult = openStudyAppAssistant(
      STUDYAPP_AI_ASSISTANT_URL,
    );
    setPreparedPrompt(prompt);
    setPopupResult(nextPopupResult);
    setClipboardOutcome("idle");
    setScreen(moveCompanionStep("goal", "next"));

    void copyToClipboard(prompt).then((copied) => {
      if (reviewAttemptRef.current !== reviewAttempt) return;
      setClipboardOutcome(copied ? "copied" : "failed");
    });
  }

  return (
    <div
      className="assistant-overlay"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <aside
        aria-labelledby="assistant-title"
        aria-modal="true"
        className="assistant-panel"
        role="dialog"
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
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            ×
          </button>
        </header>

        <div className="assistant-content">
          {screen === "intro" && (
            <section className="assistant-welcome assistant-onboarding">
              <img
                alt=""
                className="assistant-avatar-hero"
                src="/study-assistant-avatar.svg"
              />
              <p className="eyebrow">{text("Available now", "Διαθέσιμο τώρα")}</p>
              <h3>{text("Study with ChatGPT", "Μελέτη με το ChatGPT")}</h3>
              <p className="assistant-onboarding-copy">
                {text(
                  "StudyApp will guide you through three clear steps. You will always see and control what is copied.",
                  "Το StudyApp θα σε καθοδηγήσει σε τρία σαφή βήματα. Θα βλέπεις και θα ελέγχεις πάντα τι αντιγράφεται.",
                )}
              </p>

              <ol className="assistant-onboarding-steps">
                {[
                  text(
                    "Add or import the study text you choose.",
                    "Πρόσθεσε ή εισήγαγε το υλικό μελέτης που επιλέγεις.",
                  ),
                  text(
                    "Choose what you want ChatGPT to do.",
                    "Επίλεξε τι θέλεις να κάνει το ChatGPT.",
                  ),
                  text(
                    "Open the StudyApp AI Assistant and paste the prepared request.",
                    "Άνοιξε το StudyApp AI Assistant και επικόλλησε το έτοιμο αίτημα.",
                  ),
                ].map((step, index) => (
                  <li key={step}>
                    <span aria-hidden="true">{index + 1}</span>
                    <strong>{step}</strong>
                  </li>
                ))}
              </ol>

              <p className="assistant-privacy-note assistant-privacy-note-compact">
                {text(
                  "StudyApp does not automatically read your library. Only text you paste or explicitly import here is used to prepare the request.",
                  "Το StudyApp δεν διαβάζει αυτόματα τη βιβλιοθήκη σου. Χρησιμοποιείται μόνο το κείμενο που επικολλάς ή εισάγεις ρητά εδώ.",
                )}
              </p>

              <div className="assistant-actions">
                <button
                  className="button primary"
                  onClick={() => goTo("material")}
                  type="button"
                >
                  {text("Start", "Έναρξη")}
                </button>
                <button
                  className="button secondary assistant-secondary-action"
                  onClick={() => goTo("modes")}
                  type="button"
                >
                  {text("View other AI options", "Προβολή άλλων επιλογών AI")}
                </button>
              </div>
            </section>
          )}

          {screen === "modes" && (
            <section>
              <button
                className="assistant-back"
                onClick={() => goTo("intro")}
                type="button"
              >
                ← {text("Back", "Πίσω")}
              </button>
              <p className="eyebrow">{text("AI options", "Επιλογές AI")}</p>
              <h3>{text("Choose how to continue", "Επίλεξε πώς θέλεις να συνεχίσεις")}</h3>

              <div className="assistant-mode-grid">
                <button
                  className="assistant-mode-card"
                  onClick={() => goTo("material")}
                  type="button"
                >
                  <span className="assistant-mode-status available">
                    {text("Available", "Διαθέσιμο")}
                  </span>
                  <strong>ChatGPT Companion</strong>
                  <small>
                    {text(
                      "Follow guided steps to prepare your study session in ChatGPT.",
                      "Ακολούθησε καθοδηγούμενα βήματα για να προετοιμάσεις τη μελέτη σου στο ChatGPT.",
                    )}
                  </small>
                </button>

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
                      "Automatic AI with StudyApp credits.",
                      "Αυτόματο AI με credits του StudyApp.",
                    )}
                  </small>
                </button>
              </div>
            </section>
          )}

          {screen === "material" && (
            <section>
              <button
                className="assistant-back"
                onClick={() => goTo("intro")}
                type="button"
              >
                ← {text("Back", "Πίσω")}
              </button>
              <p className="assistant-progress">
                {text("Step 1 of 3", "Βήμα 1 από 3")}
              </p>
              <h3>{text("Add study material", "Πρόσθεσε υλικό μελέτης")}</h3>
              <p className="assistant-step-intro">
                {text(
                  "Paste text below, or import a local file. Imported files are shown as an attachment, not inside the text box.",
                  "Επικόλλησε κείμενο ή εισήγαγε τοπικό αρχείο. Τα εισαγόμενα αρχεία εμφανίζονται ως συνημμένα και όχι μέσα στο πεδίο κειμένου.",
                )}
              </p>

              {importedFileName ? (
                <div className="assistant-imported-material">
                  <div
                    aria-labelledby="assistant-imported-file-name"
                    className="assistant-imported-file"
                    role="group"
                  >
                    <div className="assistant-imported-file-info">
                      <span
                        aria-hidden="true"
                        className="assistant-imported-file-icon"
                      >
                        FILE
                      </span>
                      <span>
                        <strong
                          id="assistant-imported-file-name"
                          title={importedFileName}
                        >
                          {importedFileName}
                        </strong>
                        <small>
                          {text(
                            `Ready • ${material.length.toLocaleString("en-US")} extracted characters`,
                            `Έτοιμο • ${material.length.toLocaleString("el-GR")} χαρακτήρες εξαγόμενου κειμένου`,
                          )}
                        </small>
                      </span>
                    </div>
                    <button
                      aria-label={text(
                        `Remove ${importedFileName}`,
                        `Αφαίρεση ${importedFileName}`,
                      )}
                      className="text-link"
                      onClick={clearImportedMaterial}
                      type="button"
                    >
                      {text("Remove", "Αφαίρεση")}
                    </button>
                  </div>

                  <div className="assistant-import-controls assistant-import-replace">
                    <AssistantFileButton
                      action="replace"
                      isImporting={isImporting}
                      onChange={(event) => void importMaterialFile(event)}
                      text={text}
                    />
                    <small>
                      {text(
                        "The extracted text will be used in the next steps.",
                        "Το εξαγόμενο κείμενο θα χρησιμοποιηθεί στα επόμενα βήματα.",
                      )}
                    </small>
                  </div>
                </div>
              ) : (
                <>
                  <label className="field-label assistant-paste-field">
                    {text("Study text", "Υλικό μελέτης")}
                    <textarea
                      maxLength={12_000}
                      onChange={(event) => {
                        setMaterial(event.target.value);
                        setMessage("");
                      }}
                      placeholder={text(
                        "Paste a chapter, notes, or another text excerpt",
                        "Επικόλλησε ένα κεφάλαιο, σημειώσεις ή άλλο απόσπασμα κειμένου",
                      )}
                      rows={10}
                      value={material}
                    />
                    <small className="assistant-character-count">
                      {material.length.toLocaleString(
                        language === "el" ? "el-GR" : "en-US",
                      )}{" "}
                      / 12,000
                    </small>
                  </label>

                  <div className="assistant-import-divider">
                    <span>{text("or import a file", "ή εισήγαγε αρχείο")}</span>
                  </div>

                  <div className="assistant-import-controls">
                    <AssistantFileButton
                      action="choose"
                      isImporting={isImporting}
                      onChange={(event) => void importMaterialFile(event)}
                      text={text}
                    />
                    <small>
                      {text(
                        "PDF, TXT, Markdown, or CSV • up to 50 MB",
                        "PDF, TXT, Markdown ή CSV • έως 50 MB",
                      )}
                    </small>
                  </div>
                </>
              )}

              <div className="assistant-actions">
                <button
                  className="button primary"
                  disabled={!material.trim() || isImporting}
                  onClick={() => void continueFromMaterial()}
                  type="button"
                >
                  {text("Continue", "Συνέχεια")}
                </button>
              </div>
            </section>
          )}

          {screen === "goal" && (
            <section>
              <button
                className="assistant-back"
                onClick={() => moveStep("back")}
                type="button"
              >
                ← {text("Back", "Πίσω")}
              </button>
              <p className="assistant-progress">
                {text("Step 2 of 3", "Βήμα 2 από 3")}
              </p>
              <h3>{text("Choose a study goal", "Επίλεξε στόχο μελέτης")}</h3>
              <p className="assistant-step-intro">
                {text(
                  "Select one option. Continuing will open the StudyApp AI Assistant beside this panel.",
                  "Επίλεξε μία επιλογή. Με τη συνέχεια θα ανοίξει το StudyApp AI Assistant δίπλα σε αυτό το panel.",
                )}
              </p>

              <div className="assistant-task-grid">
                {companionTasks.map((task) => {
                  const selected = task.id === taskId;
                  return (
                    <button
                      aria-pressed={selected}
                      className={`assistant-task-card${selected ? " selected" : ""}`}
                      key={task.id}
                      onClick={() => {
                        setTaskId(task.id);
                        setMessage("");
                      }}
                      type="button"
                    >
                      {selected ? (
                        <span className="assistant-task-selected">
                          ✓ {text("Selected", "Επιλέχθηκε")}
                        </span>
                      ) : null}
                      <strong>{text(task.en, task.el)}</strong>
                      <small>
                        {text(task.descriptionEn, task.descriptionEl)}
                      </small>
                    </button>
                  );
                })}
              </div>

              {taskId === "custom" && (
                <label className="field-label assistant-custom-field">
                  {text("Your request", "Το αίτημά σου")}
                  <textarea
                    maxLength={1_000}
                    onChange={(event) => {
                      setCustomRequest(event.target.value);
                      setMessage("");
                    }}
                    placeholder={text(
                      "Example: Compare the two main theories and show their differences in a table.",
                      "Παράδειγμα: Σύγκρινε τις δύο βασικές θεωρίες και παρουσίασε τις διαφορές τους σε πίνακα.",
                    )}
                    rows={4}
                    value={customRequest}
                  />
                </label>
              )}

              {selectedTask ? (
                <p className="assistant-selected-goal" aria-live="polite">
                  <strong>{text("Selected:", "Επιλέχθηκε:")}</strong>{" "}
                  {text(selectedTask.en, selectedTask.el)}
                </p>
              ) : null}

              <div className="assistant-actions">
                <button
                  className="button primary"
                  disabled={!canContinueFromGoal}
                  onClick={continueToReview}
                  type="button"
                >
                  {selectedTask
                    ? text(selectedTask.continueEn, selectedTask.continueEl)
                    : text(
                        "Choose an option above",
                        "Επίλεξε μια επιλογή πιο πάνω",
                      )}
                </button>
              </div>
            </section>
          )}

          {screen === "review" && popupResult && (
            <AssistantReviewStep
              clipboardOutcome={clipboardOutcome}
              onBack={() => moveStep("back")}
              popupResult={popupResult}
              preparedPrompt={preparedPrompt}
              text={text}
            />
          )}

          {screen !== "review" && message && (
            <p
              className="assistant-status"
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
