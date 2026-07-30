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

type AssistantScreen = "intro" | "modes" | "material" | "goal" | "review";
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

function openAttachedStudyAppAssistant(): void {
  const availableWidth = window.screen.availWidth || window.outerWidth;
  const availableHeight = window.screen.availHeight || window.outerHeight;
  const popupWidth = Math.min(560, Math.max(360, availableWidth - 40));
  const popupHeight = Math.min(720, Math.max(480, availableHeight - 80));
  const panelRect = document
    .querySelector<HTMLElement>(".assistant-panel")
    ?.getBoundingClientRect();

  const horizontalBrowserChrome = Math.max(
    0,
    (window.outerWidth - window.innerWidth) / 2,
  );
  const verticalBrowserChrome = Math.max(
    0,
    window.outerHeight - window.innerHeight - horizontalBrowserChrome,
  );
  const viewportScreenLeft = window.screenX + horizontalBrowserChrome;
  const viewportScreenTop = window.screenY + verticalBrowserChrome;
  const gap = 12;

  const desiredLeft = panelRect
    ? viewportScreenLeft + panelRect.left - popupWidth - gap
    : viewportScreenLeft + window.innerWidth - popupWidth - 420 - gap;
  const desiredTop = panelRect
    ? viewportScreenTop + panelRect.top
    : viewportScreenTop + 24;

  const positionedScreen = window.screen as Screen & {
    availLeft?: number;
    availTop?: number;
  };
  const minimumLeft = positionedScreen.availLeft ?? 0;
  const minimumTop = positionedScreen.availTop ?? 0;
  const maximumLeft = Math.max(
    minimumLeft,
    minimumLeft + availableWidth - popupWidth,
  );
  const maximumTop = Math.max(
    minimumTop,
    minimumTop + availableHeight - popupHeight,
  );
  const left = Math.round(
    Math.min(maximumLeft, Math.max(minimumLeft, desiredLeft)),
  );
  const top = Math.round(
    Math.min(maximumTop, Math.max(minimumTop, desiredTop)),
  );

  window.open(
    STUDYAPP_AI_ASSISTANT_URL,
    "studyapp-ai-assistant",
    [
      "popup=yes",
      `width=${popupWidth}`,
      `height=${popupHeight}`,
      `left=${left}`,
      `top=${top}`,
      "noopener",
      "noreferrer",
    ].join(","),
  );
}

async function copyToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value.trim());
    return true;
  } catch {
    return false;
  }
}

export function AssistantPanel({ open, onClose }: AssistantPanelProps) {
  const { language, text } = useLanguage();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [screen, setScreen] = useState<AssistantScreen>("intro");
  const [taskId, setTaskId] = useState<CompanionTaskId | null>(null);
  const [material, setMaterial] = useState("");
  const [importedFileName, setImportedFileName] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [customRequest, setCustomRequest] = useState("");
  const [message, setMessage] = useState("");

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
    setMessage("");
    setScreen(nextScreen);
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

    setIsImporting(true);
    setMessage(text("Reading the file locally...", "Ανάγνωση του αρχείου τοπικά..."));

    try {
      const result = await extractAssistantMaterial(file);
      const copied = await copyToClipboard(result.text);

      setMaterial(result.text);
      setImportedFileName(file.name);
      setMessage(
        result.truncated
          ? text(
              copied
                ? `Imported ${file.name}. The first 12,000 extracted characters were copied to the clipboard.`
                : `Imported ${file.name}. The first 12,000 extracted characters will be used, but clipboard access was unavailable.`,
              copied
                ? `Έγινε εισαγωγή του ${file.name}. Οι πρώτοι 12.000 χαρακτήρες που εξήχθησαν αντιγράφηκαν στο πρόχειρο.`
                : `Έγινε εισαγωγή του ${file.name}. Θα χρησιμοποιηθούν οι πρώτοι 12.000 χαρακτήρες, αλλά δεν ήταν διαθέσιμη η πρόσβαση στο πρόχειρο.`,
            )
          : text(
              copied
                ? `Imported ${file.name}. The extracted text was copied to the clipboard.`
                : `Imported ${file.name}. The extracted text is ready, but clipboard access was unavailable.`,
              copied
                ? `Έγινε εισαγωγή του ${file.name}. Το εξαγόμενο κείμενο αντιγράφηκε στο πρόχειρο.`
                : `Έγινε εισαγωγή του ${file.name}. Το εξαγόμενο κείμενο είναι έτοιμο, αλλά δεν ήταν διαθέσιμη η πρόσβαση στο πρόχειρο.`,
            ),
      );
    } catch (error) {
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
      setIsImporting(false);
    }
  }

  function clearImportedMaterial() {
    setImportedFileName(null);
    setMaterial("");
    setMessage(text("Imported material removed.", "Το εισαγόμενο υλικό αφαιρέθηκε."));
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
    setScreen("goal");
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

    setScreen("review");
    openAttachedStudyAppAssistant();

    void copyToClipboard(prompt).then((copied) => {
      setMessage(
        copied
          ? text(
              "The request was copied. Paste it into the StudyApp AI Assistant window.",
              "Το αίτημα αντιγράφηκε. Επικόλλησέ το στο παράθυρο του StudyApp AI Assistant.",
            )
          : text(
              "The StudyApp AI Assistant opened, but copying failed. Allow clipboard access and return to the previous step to try again.",
              "Το StudyApp AI Assistant άνοιξε, αλλά η αντιγραφή απέτυχε. Επίτρεψε την πρόσβαση στο πρόχειρο και επέστρεψε στο προηγούμενο βήμα για νέα προσπάθεια.",
            ),
      );
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
                  className="button secondary"
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
                  <div className="assistant-imported-file">
                    <div className="assistant-imported-file-info">
                      <span
                        aria-hidden="true"
                        className="assistant-imported-file-icon"
                      >
                        FILE
                      </span>
                      <span>
                        <strong title={importedFileName}>
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
                      className="text-link"
                      onClick={clearImportedMaterial}
                      type="button"
                    >
                      {text("Remove", "Αφαίρεση")}
                    </button>
                  </div>

                  <div className="assistant-import-controls assistant-import-replace">
                    <label className="button secondary assistant-file-button">
                      {isImporting
                        ? text("Reading...", "Ανάγνωση...")
                        : text("Replace file", "Αντικατάσταση αρχείου")}
                      <input
                        accept={ASSISTANT_IMPORT_ACCEPT}
                        disabled={isImporting}
                        type="file"
                        onChange={(event) => void importMaterialFile(event)}
                      />
                    </label>
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
                    <label className="button secondary assistant-file-button">
                      {isImporting
                        ? text("Reading...", "Ανάγνωση...")
                        : text("Choose file", "Επιλογή αρχείου")}
                      <input
                        accept={ASSISTANT_IMPORT_ACCEPT}
                        disabled={isImporting}
                        type="file"
                        onChange={(event) => void importMaterialFile(event)}
                      />
                    </label>
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
                onClick={() => goTo("material")}
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

          {screen === "review" && (
            <section>
              <button
                className="assistant-back"
                onClick={() => goTo("goal")}
                type="button"
              >
                ← {text("Back", "Πίσω")}
              </button>
              <p className="assistant-progress">
                {text("Step 3 of 3", "Βήμα 3 από 3")}
              </p>
              <h3>
                {text(
                  "Continue in the StudyApp AI Assistant",
                  "Συνέχισε στο StudyApp AI Assistant",
                )}
              </h3>
              <p className="assistant-step-intro">
                {text(
                  "The assistant window opened beside this panel. Paste the copied request into its message box.",
                  "Το παράθυρο του βοηθού άνοιξε δίπλα σε αυτό το panel. Επικόλλησε το αντιγραμμένο αίτημα στο πεδίο μηνύματός του.",
                )}
              </p>
            </section>
          )}

          {message && (
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
