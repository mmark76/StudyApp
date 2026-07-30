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

export function AssistantPanel({ open, onClose }: AssistantPanelProps) {
  const { language, text } = useLanguage();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [screen, setScreen] = useState<AssistantScreen>("intro");
  const [taskId, setTaskId] = useState<CompanionTaskId | null>(null);
  const [material, setMaterial] = useState("");
  const [importedFileName, setImportedFileName] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [customRequest, setCustomRequest] = useState("");
  const [preparedPrompt, setPreparedPrompt] = useState("");
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
      setMaterial(result.text);
      setImportedFileName(file.name);
      setPreparedPrompt("");
      setMessage(result.truncated
        ? text(
            `Imported ${file.name}. The first 12,000 extracted characters will be used.`,
            `Έγινε εισαγωγή του ${file.name}. Θα χρησιμοποιηθούν οι πρώτοι 12.000 χαρακτήρες που εξήχθησαν.`,
          )
        : text(
            `Imported ${file.name}. The extracted text is ready for the next step.`,
            `Έγινε εισαγωγή του ${file.name}. Το εξαγόμενο κείμενο είναι έτοιμο για το επόμενο βήμα.`,
          ));
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
    setPreparedPrompt("");
    setMessage(text("Imported material removed.", "Το εισαγόμενο υλικό αφαιρέθηκε."));
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

    setPreparedPrompt(buildCompanionPrompt(taskId, material, language, customRequest));
    goTo("review");
  }

  async function copyAndOpenStudyAppAssistant() {
    if (!preparedPrompt.trim()) {
      setMessage(text("Prepare the study request first.", "Προετοίμασε πρώτα το αίτημα μελέτης."));
      return;
    }

    window.open(
      STUDYAPP_AI_ASSISTANT_URL,
      "studyapp-ai-assistant",
      "popup=yes,width=760,height=860,noopener,noreferrer",
    );

    try {
      await navigator.clipboard.writeText(preparedPrompt.trim());
      setMessage(text(
        "Study material copied. Paste it into the StudyApp AI Assistant message box.",
        "Το υλικό μελέτης αντιγράφηκε. Επικόλλησέ το στο πεδίο μηνύματος του StudyApp AI Assistant.",
      ));
    } catch {
      setMessage(text(
        "Copy failed. Allow clipboard access and try again.",
        "Η αντιγραφή απέτυχε. Επίτρεψε την πρόσβαση στο πρόχειρο και δοκίμασε ξανά.",
      ));
    }
  }

  return (
    <div className="assistant-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside aria-labelledby="assistant-title" aria-modal="true" className="assistant-panel" role="dialog">
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
          {screen === "intro" && (
            <section className="assistant-welcome assistant-onboarding">
              <img alt="" className="assistant-avatar-hero" src="/study-assistant-avatar.svg" />
              <p className="eyebrow">{text("Available now", "Διαθέσιμο τώρα")}</p>
              <h3>{text("Study with ChatGPT", "Μελέτη με το ChatGPT")}</h3>
              <p className="assistant-onboarding-copy">{text(
                "StudyApp will guide you through three clear steps. You will always see and control what is copied.",
                "Το StudyApp θα σε καθοδηγήσει σε τρία σαφή βήματα. Θα βλέπεις και θα ελέγχεις πάντα τι αντιγράφεται.",
              )}</p>

              <ol className="assistant-onboarding-steps">
                {[
                  text("Add or import the study text you choose.", "Πρόσθεσε ή εισήγαγε το υλικό μελέτης που επιλέγεις."),
                  text("Choose what you want ChatGPT to do.", "Επίλεξε τι θέλεις να κάνει το ChatGPT."),
                  text("Review the instructions, then copy them and continue in ChatGPT.", "Έλεγξε τις οδηγίες, αντέγραψέ τες και συνέχισε στο ChatGPT."),
                ].map((step, index) => (
                  <li key={step}>
                    <span aria-hidden="true">{index + 1}</span>
                    <strong>{step}</strong>
                  </li>
                ))}
              </ol>

              <p className="assistant-privacy-note assistant-privacy-note-compact">{text(
                "StudyApp does not automatically read your library. Only text you paste or explicitly import here is used to prepare the instructions.",
                "Το StudyApp δεν διαβάζει αυτόματα τη βιβλιοθήκη σου. Χρησιμοποιείται μόνο το κείμενο που επικολλάς ή εισάγεις ρητά εδώ.",
              )}</p>

              <div className="assistant-actions">
                <button className="button primary" onClick={() => goTo("material")} type="button">
                  {text("Start", "Έναρξη")}
                </button>
                <button className="button secondary" onClick={() => goTo("modes")} type="button">
                  {text("View other AI options", "Προβολή άλλων επιλογών AI")}
                </button>
              </div>
            </section>
          )}

          {screen === "modes" && (
            <section>
              <button className="assistant-back" onClick={() => goTo("intro")} type="button">
                ← {text("Back", "Πίσω")}
              </button>
              <p className="eyebrow">{text("AI options", "Επιλογές AI")}</p>
              <h3>{text("Choose how to continue", "Επίλεξε πώς θέλεις να συνεχίσεις")}</h3>

              <div className="assistant-mode-grid">
                <button className="assistant-mode-card" onClick={() => goTo("material")} type="button">
                  <span className="assistant-mode-status available">{text("Available", "Διαθέσιμο")}</span>
                  <strong>ChatGPT Companion</strong>
                  <small>{text(
                    "Follow guided steps to prepare your study session in ChatGPT.",
                    "Ακολούθησε καθοδηγούμενα βήματα για να προετοιμάσεις τη μελέτη σου στο ChatGPT.",
                  )}</small>
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

          {screen === "material" && (
            <section>
              <button className="assistant-back" onClick={() => goTo("intro")} type="button">
                ← {text("Back", "Πίσω")}
              </button>
              <p className="assistant-progress">{text("Step 1 of 3", "Βήμα 1 από 3")}</p>
              <h3>{text("Add study material", "Πρόσθεσε υλικό μελέτης")}</h3>
              <p className="assistant-step-intro">{text(
                "Paste text below, or import a local file. Imported files are shown as an attachment, not inside the text box.",
                "Επικόλλησε κείμενο ή εισήγαγε τοπικό αρχείο. Τα εισαγόμενα αρχεία εμφανίζονται ως συνημμένα και όχι μέσα στο πεδίο κειμένου.",
              )}</p>

              {importedFileName ? (
                <div className="assistant-imported-material">
                  <div className="assistant-imported-file">
                    <div className="assistant-imported-file-info">
                      <span aria-hidden="true" className="assistant-imported-file-icon">FILE</span>
                      <span>
                        <strong title={importedFileName}>{importedFileName}</strong>
                        <small>{text(
                          `Ready • ${material.length.toLocaleString("en-US")} extracted characters`,
                          `Έτοιμο • ${material.length.toLocaleString("el-GR")} χαρακτήρες εξαγόμενου κειμένου`,
                        )}</small>
                      </span>
                    </div>
                    <button className="text-link" onClick={clearImportedMaterial} type="button">
                      {text("Remove", "Αφαίρεση")}
                    </button>
                  </div>

                  <div className="assistant-import-controls assistant-import-replace">
                    <label className="button secondary assistant-file-button">
                      {isImporting ? text("Reading...", "Ανάγνωση...") : text("Replace file", "Αντικατάσταση αρχείου")}
                      <input
                        accept={ASSISTANT_IMPORT_ACCEPT}
                        disabled={isImporting}
                        type="file"
                        onChange={(event) => void importMaterialFile(event)}
                      />
                    </label>
                    <small>{text(
                      "The extracted text will be used in the next steps.",
                      "Το εξαγόμενο κείμενο θα χρησιμοποιηθεί στα επόμενα βήματα.",
                    )}</small>
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
                        setPreparedPrompt("");
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
                      {material.length.toLocaleString(language === "el" ? "el-GR" : "en-US")} / 12,000
                    </small>
                  </label>

                  <div className="assistant-import-divider">
                    <span>{text("or import a file", "ή εισήγαγε αρχείο")}</span>
                  </div>

                  <div className="assistant-import-controls">
                    <label className="button secondary assistant-file-button">
                      {isImporting ? text("Reading...", "Ανάγνωση...") : text("Choose file", "Επιλογή αρχείου")}
                      <input
                        accept={ASSISTANT_IMPORT_ACCEPT}
                        disabled={isImporting}
                        type="file"
                        onChange={(event) => void importMaterialFile(event)}
                      />
                    </label>
                    <small>{text(
                      "PDF, TXT, Markdown, or CSV • up to 50 MB",
                      "PDF, TXT, Markdown ή CSV • έως 50 MB",
                    )}</small>
                  </div>
                </>
              )}

              <div className="assistant-actions">
                <button
                  className="button primary"
                  disabled={!material.trim() || isImporting}
                  onClick={() => goTo("goal")}
                  type="button"
                >
                  {text("Continue", "Συνέχεια")}
                </button>
              </div>
            </section>
          )}

          {screen === "goal" && (
            <section>
              <button className="assistant-back" onClick={() => goTo("material")} type="button">
                ← {text("Back", "Πίσω")}
              </button>
              <p className="assistant-progress">{text("Step 2 of 3", "Βήμα 2 από 3")}</p>
              <h3>{text("Choose a study goal", "Επίλεξε στόχο μελέτης")}</h3>
              <p className="assistant-step-intro">{text(
                "Select one option. A clear confirmation will appear, then continue with the button below.",
                "Επίλεξε μία επιλογή. Θα εμφανιστεί σαφής επιβεβαίωση και μετά συνέχισε με το κουμπί πιο κάτω.",
              )}</p>

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
                        setPreparedPrompt("");
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
                      <small>{text(task.descriptionEn, task.descriptionEl)}</small>
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
                      setPreparedPrompt("");
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
                    : text("Choose an option above", "Επίλεξε μια επιλογή πιο πάνω")}
                </button>
              </div>
            </section>
          )}

          {screen === "review" && (
            <section>
              <button className="assistant-back" onClick={() => goTo("goal")} type="button">
                ← {text("Back", "Πίσω")}
              </button>
              <p className="assistant-progress">{text("Step 3 of 3", "Βήμα 3 από 3")}</p>

              <div className="assistant-actions">
                <button
                  className="button primary"
                  disabled={!preparedPrompt.trim()}
                  onClick={() => void copyAndOpenStudyAppAssistant()}
                  type="button"
                >
                  {text(
                    "Copy & Open StudyApp AI Assistant",
                    "Αντιγραφή & άνοιγμα StudyApp AI Assistant",
                  )}
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
