import {
  type ChangeEvent,
  type FormEvent,
  useRef,
  useState,
} from "react";
import { type AppLanguage, useLanguage } from "../../i18n/LanguageContext";
import type { LocalWriteFailureInjector } from "../../infrastructure/database/localWriteFailureInjector";
import {
  StorageNotice,
  storageNoticePlacements,
} from "../../shared/components/StorageNotice";
import type { Flashcard, StudyUnit } from "../../shared/types/models";
import { FlashcardForm } from "./FlashcardForm";
import {
  importPracticeFlashcards,
  importPracticeUnits,
  removeImportedPracticeFlashcard,
  removeImportedPracticeUnit,
  renameImportedPracticeUnit,
  updateImportedPracticeFlashcard,
} from "./practiceContentRepository";
import {
  MAX_SPREADSHEET_FILE_SIZE,
  parseFlashcardsSpreadsheet,
  parseUnitsSpreadsheet,
} from "./spreadsheetImport";
import { UnitForm } from "./UnitForm";
import { useStudyContent } from "./useStudyContent";
import { MAX_IMPORTED_TEXT_LENGTH } from "./importedContent";
import "./PracticeContentManager.css";

type OpenForm = "flashcard" | "chapter" | null;
type ImportKind = "flashcards" | "chapters" | null;

const addImportGuidance: Record<AppLanguage, string> = {
  en: "Add creates one item manually. Import adds multiple items from a CSV file.",
  el: "Το Add δημιουργεί χειροκίνητα μία εγγραφή. Το Import εισάγει πολλές εγγραφές από αρχείο CSV.",
};

async function readFile(file: File): Promise<string> {
  return file.text();
}

function splitCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function FlashcardEditor({
  card,
  units,
  onCancel,
  onMessage,
}: {
  card: Flashcard;
  units: readonly StudyUnit[];
  onCancel: () => void;
  onMessage: (message: string) => void;
}) {
  const { text } = useLanguage();
  const [unitId, setUnitId] = useState(card.unitId);
  const [question, setQuestion] = useState(card.question);
  const [answer, setAnswer] = useState(card.answer);
  const [tags, setTags] = useState(card.tags.join(", "));
  const [isSaving, setIsSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuestion = question.trim();
    const normalizedAnswer = answer.trim();
    if (!normalizedQuestion || !normalizedAnswer) {
      onMessage(text("Enter a question and an answer.", "Γράψε ερώτηση και απάντηση."));
      return;
    }

    setIsSaving(true);
    onMessage("");
    try {
      await updateImportedPracticeFlashcard({
        ...card,
        unitId,
        question: normalizedQuestion,
        answer: normalizedAnswer,
        tags: splitCommaList(tags),
      });
      onMessage(text("Flashcard updated.", "Η flashcard ενημερώθηκε."));
      onCancel();
    } catch {
      onMessage(text("The flashcard could not be updated.", "Η flashcard δεν μπόρεσε να ενημερωθεί."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      aria-busy={isSaving}
      className="material-form practice-content-editor"
      onSubmit={(event) => void save(event)}
    >
      <label className="field-label">
        {text("Practice chapter", "Κεφάλαιο εξάσκησης")}
        <select disabled={isSaving} required value={unitId} onChange={(event) => setUnitId(event.target.value)}>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>{unit.number}. {unit.title}</option>
          ))}
        </select>
      </label>
      <label className="field-label">
        {text("Question", "Ερώτηση")}
        <textarea disabled={isSaving} maxLength={MAX_IMPORTED_TEXT_LENGTH} required rows={3} value={question} onChange={(event) => setQuestion(event.target.value)} />
      </label>
      <label className="field-label">
        {text("Answer", "Απάντηση")}
        <textarea disabled={isSaving} maxLength={MAX_IMPORTED_TEXT_LENGTH} required rows={4} value={answer} onChange={(event) => setAnswer(event.target.value)} />
      </label>
      <label className="field-label">
        {text("Keywords (optional)", "Λέξεις-κλειδιά (προαιρετικά)")}
        <input disabled={isSaving} value={tags} onChange={(event) => setTags(event.target.value)} />
      </label>
      <div className="button-row">
        <button className="button primary" disabled={isSaving} type="submit">
          {isSaving ? text("Saving…", "Αποθήκευση…") : text("Save changes", "Αποθήκευση αλλαγών")}
        </button>
        <button className="button secondary" disabled={isSaving} onClick={onCancel} type="button">
          {text("Cancel", "Ακύρωση")}
        </button>
      </div>
    </form>
  );
}

interface PracticeContentManagerProps {
  failureInjector?: LocalWriteFailureInjector;
}

export function PracticeContentManager({ failureInjector }: PracticeContentManagerProps = {}) {
  const { language, text } = useLanguage();
  const {
    units,
    flashcards,
    importedUnits,
    importedFlashcards,
    hasStoredContentError,
  } = useStudyContent();
  const [message, setMessage] = useState("");
  const [openForm, setOpenForm] = useState<OpenForm>(null);
  const [viewedUnitId, setViewedUnitId] = useState<string | null>(null);
  const [viewedCardId, setViewedCardId] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [importing, setImporting] = useState<ImportKind>(null);
  const importPendingRef = useRef(false);
  const flashcardsInputRef = useRef<HTMLInputElement>(null);
  const chaptersInputRef = useRef<HTMLInputElement>(null);

  async function importChapters(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file || importPendingRef.current || hasStoredContentError) return;

    importPendingRef.current = true;
    setImporting("chapters");
    setMessage("");
    try {
      if (file.size > MAX_SPREADSHEET_FILE_SIZE) {
        throw new Error("The CSV file is larger than the 10 MB limit.");
      }
      const spreadsheetUnits = parseUnitsSpreadsheet(await readFile(file)).map((unit) => {
        const existing = units.find((candidate) => candidate.number === unit.number);
        return existing ? { ...unit, id: existing.id } : unit;
      });
      await importPracticeUnits(spreadsheetUnits);
      setMessage(text(
        `${spreadsheetUnits.length} practice chapter${spreadsheetUnits.length === 1 ? "" : "s"} saved.`,
        `Αποθηκεύτηκαν ${spreadsheetUnits.length} κεφάλαια εξάσκησης.`,
      ));
    } catch (error) {
      setMessage(language === "en" && error instanceof Error
        ? error.message
        : text("The Chapters CSV could not be read.", "Το Chapters CSV δεν μπόρεσε να διαβαστεί."));
    } finally {
      input.value = "";
      importPendingRef.current = false;
      setImporting(null);
    }
  }

  async function importFlashcards(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file || importPendingRef.current || hasStoredContentError) return;

    importPendingRef.current = true;
    setImporting("flashcards");
    setMessage("");
    try {
      if (file.size > MAX_SPREADSHEET_FILE_SIZE) {
        throw new Error("The CSV file is larger than the 10 MB limit.");
      }
      const spreadsheetFlashcards = await parseFlashcardsSpreadsheet(await readFile(file), units);
      await importPracticeFlashcards(spreadsheetFlashcards);
      setMessage(text(
        `${spreadsheetFlashcards.length} flashcard${spreadsheetFlashcards.length === 1 ? "" : "s"} saved.`,
        `Αποθηκεύτηκαν ${spreadsheetFlashcards.length} flashcards.`,
      ));
    } catch (error) {
      setMessage(language === "en" && error instanceof Error
        ? error.message
        : text("The Flashcards CSV could not be read.", "Το Flashcards CSV δεν μπόρεσε να διαβαστεί."));
    } finally {
      input.value = "";
      importPendingRef.current = false;
      setImporting(null);
    }
  }

  async function renameUnit(unit: StudyUnit) {
    const nextTitle = window.prompt(
      text("Rename this practice chapter:", "Μετονομασία κεφαλαίου εξάσκησης:"),
      unit.title,
    );
    if (nextTitle === null) return;

    try {
      await renameImportedPracticeUnit(unit.id, nextTitle);
      setMessage(text("Practice chapter renamed.", "Το κεφάλαιο εξάσκησης μετονομάστηκε."));
    } catch {
      setMessage(text("Enter a valid practice chapter name.", "Γράψε έγκυρο όνομα κεφαλαίου εξάσκησης."));
    }
  }

  async function removeUnit(unit: StudyUnit) {
    const affectedCards = importedFlashcards.filter((card) => card.unitId === unit.id).length;
    const warning = affectedCards > 0
      ? text(
          `Remove “${unit.title}” and its ${affectedCards} flashcard${affectedCards === 1 ? "" : "s"}? Their saved progress will also be removed.`,
          `Να αφαιρεθεί το «${unit.title}» και ${affectedCards} συνδεδεμέν${affectedCards === 1 ? "η flashcard" : "ες flashcards"}; Θα αφαιρεθεί και η αποθηκευμένη πρόοδός τους.`,
        )
      : text(`Remove “${unit.title}”?`, `Να αφαιρεθεί το «${unit.title}»;`);
    if (!window.confirm(warning)) return;

    try {
      const removedCards = await removeImportedPracticeUnit(unit.id);
      setViewedUnitId(null);
      setMessage(text(
        removedCards > 0
          ? `Practice chapter and ${removedCards} flashcard${removedCards === 1 ? "" : "s"} removed.`
          : "Practice chapter removed.",
        removedCards > 0
          ? `Αφαιρέθηκε το κεφάλαιο εξάσκησης και ${removedCards} flashcard${removedCards === 1 ? "" : "s"}.`
          : "Το κεφάλαιο εξάσκησης αφαιρέθηκε.",
      ));
    } catch {
      setMessage(text("The practice chapter could not be removed.", "Το κεφάλαιο εξάσκησης δεν μπόρεσε να αφαιρεθεί."));
    }
  }

  async function removeFlashcard(card: Flashcard) {
    if (!window.confirm(text(
      `Remove the flashcard “${card.question}”? Its saved progress will also be removed.`,
      `Να αφαιρεθεί η flashcard «${card.question}»; Θα αφαιρεθεί και η αποθηκευμένη πρόοδός της.`,
    ))) return;

    try {
      await removeImportedPracticeFlashcard(card.id);
      setViewedCardId(null);
      setEditingCardId(null);
      setMessage(text("Flashcard removed.", "Η flashcard αφαιρέθηκε."));
    } catch {
      setMessage(text("The flashcard could not be removed.", "Η flashcard δεν μπόρεσε να αφαιρεθεί."));
    }
  }

  return (
    <section aria-labelledby="practice-content-title" className="content-panel practice-content-manager" id="practice-content">
      <div className="practice-content-heading">
        <p className="eyebrow">{text("PRACTICE CONTENT", "ΠΕΡΙΕΧΟΜΕΝΟ ΕΞΑΣΚΗΣΗΣ")}</p>
        <h3 id="practice-content-title">{text("Manage practice content", "Διαχείριση περιεχομένου εξάσκησης")}</h3>
        <p>{text(
          "Add, import or manage your flashcards and practice chapters.",
          "Προσθέστε, εισαγάγετε ή διαχειριστείτε τις flashcards και τα κεφάλαια εξάσκησης.",
        )}</p>
      </div>

      <StorageNotice kind={storageNoticePlacements.contentImport} />

      {hasStoredContentError ? (
        <p className="inline-message status-banner" role="alert">
          {text(
            "Saved practice content is damaged or incompatible. Nothing was changed. Restore a valid backup before adding or importing content.",
            "Το αποθηκευμένο περιεχόμενο εξάσκησης είναι κατεστραμμένο ή ασύμβατο. Δεν άλλαξε τίποτα. Επαναφέρετε έγκυρο backup πριν από προσθήκη ή εισαγωγή περιεχομένου.",
          )}
        </p>
      ) : null}

      <p className="practice-import-order">{text(
        "New content? Import the Chapters CSV first, then the Flashcards CSV.",
        "Νέο περιεχόμενο; Εισαγάγετε πρώτα το Chapters CSV και μετά το Flashcards CSV.",
      )}</p>

      {message ? <p className="inline-message status-banner" role="status" aria-live="polite">{message}</p> : null}

      <div
        aria-describedby="practice-content-add-import-note"
        aria-label={text("Practice content options", "Επιλογές περιεχομένου εξάσκησης")}
        className="practice-content-options"
        role="group"
      >
        <article className="template-card practice-content-option">
          <h4>{text("Flashcards", "Flashcards")}</h4>
          <p>{text(
            "Add one flashcard or import many from CSV.",
            "Προσθέστε μία flashcard ή εισαγάγετε πολλές από CSV.",
          )}</p>
          <div className="button-row">
            <button aria-expanded={openForm === "flashcard"} className="button secondary" disabled={hasStoredContentError} onClick={() => setOpenForm((current) => current === "flashcard" ? null : "flashcard")} type="button">
              {text("Add Flashcard", "Προσθήκη Flashcard")}
            </button>
            <button
              className="button primary"
              disabled={importing !== null || hasStoredContentError}
              onClick={() => flashcardsInputRef.current?.click()}
              type="button"
            >
              {importing === "flashcards" ? text("Importing…", "Εισαγωγή…") : text("Import Flashcards CSV", "Εισαγωγή Flashcards CSV")}
            </button>
            <input
              accept=".csv,text/csv"
              aria-hidden="true"
              disabled={importing !== null || hasStoredContentError}
              hidden
              name="flashcards-csv"
              ref={flashcardsInputRef}
              tabIndex={-1}
              type="file"
              onChange={(event) => void importFlashcards(event)}
            />
            <a className="button secondary" download="flashcards-template.csv" href={`${import.meta.env.BASE_URL}templates/flashcards-spreadsheet.csv`}>
              {text("Download CSV template", "Λήψη προτύπου CSV")}
            </a>
          </div>
          {openForm === "flashcard" && !hasStoredContentError ? (
            <div className="practice-content-form-panel">
              <FlashcardForm existingFlashcards={flashcards} failureInjector={failureInjector} onMessage={setMessage} units={units} />
            </div>
          ) : null}
        </article>

        <article className="template-card practice-content-option">
          <h4>{text("Practice Chapters", "Κεφάλαια εξάσκησης")}</h4>
          <p>{text(
            "Practice chapters group and organize your flashcards. They are not files stored in Structured Study.",
            "Τα κεφάλαια εξάσκησης οργανώνουν τις flashcards. Δεν είναι αρχεία του Structured Study.",
          )}</p>
          <div className="button-row">
            <button aria-expanded={openForm === "chapter"} className="button secondary" disabled={hasStoredContentError} onClick={() => setOpenForm((current) => current === "chapter" ? null : "chapter")} type="button">
              {text("Add Chapter", "Προσθήκη Κεφαλαίου")}
            </button>
            <button
              className="button primary"
              disabled={importing !== null || hasStoredContentError}
              onClick={() => chaptersInputRef.current?.click()}
              type="button"
            >
              {importing === "chapters" ? text("Importing…", "Εισαγωγή…") : text("Import Chapters CSV", "Εισαγωγή Chapters CSV")}
            </button>
            <input
              accept=".csv,text/csv"
              aria-hidden="true"
              disabled={importing !== null || hasStoredContentError}
              hidden
              name="chapters-csv"
              ref={chaptersInputRef}
              tabIndex={-1}
              type="file"
              onChange={(event) => void importChapters(event)}
            />
            <a className="button secondary" download="chapters-template.csv" href={`${import.meta.env.BASE_URL}templates/units-spreadsheet.csv`}>
              {text("Download CSV template", "Λήψη προτύπου CSV")}
            </a>
          </div>
          {openForm === "chapter" && !hasStoredContentError ? (
            <div className="practice-content-form-panel">
              <UnitForm existingUnits={units} failureInjector={failureInjector} onMessage={setMessage} />
            </div>
          ) : null}
        </article>
      </div>

      <p className="practice-content-add-import-note" id="practice-content-add-import-note" role="note">
        {addImportGuidance[language]}
      </p>

      <div aria-labelledby="imported-practice-content-title" className="practice-content-library">
        <div>
          <p className="eyebrow">{text("IMPORTED PRACTICE CONTENT", "ΕΙΣΑΓΟΜΕΝΟ ΠΕΡΙΕΧΟΜΕΝΟ ΕΞΑΣΚΗΣΗΣ")}</p>
          <h4 id="imported-practice-content-title">{text("Manage imported content", "Διαχείριση εισαγόμενου περιεχομένου")}</h4>
        </div>

        <div className="practice-content-lists">
          <section aria-labelledby="imported-practice-chapters-title" className="practice-content-list-panel">
            <h5 id="imported-practice-chapters-title">{text("Practice Chapters", "Κεφάλαια εξάσκησης")} ({importedUnits.length})</h5>
            {importedUnits.length === 0 ? (
              <p>{text("No imported practice chapters yet.", "Δεν υπάρχουν ακόμη εισαγόμενα κεφάλαια εξάσκησης.")}</p>
            ) : (
              <ul className="local-file-list">
                {importedUnits.map((unit) => {
                  const cardCount = importedFlashcards.filter((card) => card.unitId === unit.id).length;
                  const isViewed = viewedUnitId === unit.id;
                  return (
                    <li className="practice-content-item" key={unit.id}>
                      <div className="local-file-row">
                        <div><strong>{unit.number}. {unit.title}</strong><span>{cardCount} flashcard{cardCount === 1 ? "" : "s"}</span></div>
                        <div className="local-file-actions">
                          <button aria-expanded={isViewed} aria-label={text(`View practice chapter ${unit.title}`, `Προβολή κεφαλαίου εξάσκησης ${unit.title}`)} className="button secondary compact-square" onClick={() => setViewedUnitId((current) => current === unit.id ? null : unit.id)} type="button">{text("View", "Προβολή")}</button>
                          <button aria-label={text(`Rename practice chapter ${unit.title}`, `Μετονομασία κεφαλαίου εξάσκησης ${unit.title}`)} className="button secondary compact-square" onClick={() => void renameUnit(unit)} type="button">{text("Rename", "Μετονομασία")}</button>
                          <button aria-label={text(`Remove practice chapter ${unit.title}`, `Αφαίρεση κεφαλαίου εξάσκησης ${unit.title}`)} className="button danger compact-square" onClick={() => void removeUnit(unit)} type="button">{text("Remove", "Αφαίρεση")}</button>
                        </div>
                      </div>
                      {isViewed ? (
                        <dl className="practice-content-details">
                          <div><dt>{text("Learning goals", "Στόχοι μάθησης")}</dt><dd>{unit.objectives.join(" · ") || text("None", "Κανένας")}</dd></div>
                          <div><dt>{text("Key points", "Βασικά σημεία")}</dt><dd>{unit.summary.join(" · ") || text("None", "Κανένα")}</dd></div>
                          <div><dt>{text("Important terms", "Σημαντικοί όροι")}</dt><dd>{unit.keyTerms.join(", ") || text("None", "Κανένας")}</dd></div>
                        </dl>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="imported-flashcards-title" className="practice-content-list-panel">
            <h5 id="imported-flashcards-title">{text("Flashcards", "Flashcards")} ({importedFlashcards.length})</h5>
            {importedFlashcards.length === 0 ? (
              <p>{text("No imported flashcards yet.", "Δεν υπάρχουν ακόμη εισαγόμενες flashcards.")}</p>
            ) : (
              <ul className="local-file-list">
                {importedFlashcards.map((card) => {
                  const unit = units.find((candidate) => candidate.id === card.unitId);
                  const isViewed = viewedCardId === card.id;
                  const isEditing = editingCardId === card.id;
                  return (
                    <li className="practice-content-item" key={card.id}>
                      <div className="local-file-row">
                        <div><strong>{card.question}</strong><span>{unit?.title ?? text("Unknown practice chapter", "Άγνωστο κεφάλαιο εξάσκησης")}</span></div>
                        <div className="local-file-actions">
                          <button aria-expanded={isViewed} aria-label={text(`View flashcard ${card.question}`, `Προβολή flashcard ${card.question}`)} className="button secondary compact-square" onClick={() => setViewedCardId((current) => current === card.id ? null : card.id)} type="button">{text("View", "Προβολή")}</button>
                          <button aria-expanded={isEditing} aria-label={text(`Edit flashcard ${card.question}`, `Επεξεργασία flashcard ${card.question}`)} className="button secondary compact-square" onClick={() => setEditingCardId((current) => current === card.id ? null : card.id)} type="button">{text("Edit", "Επεξεργασία")}</button>
                          <button aria-label={text(`Remove flashcard ${card.question}`, `Αφαίρεση flashcard ${card.question}`)} className="button danger compact-square" onClick={() => void removeFlashcard(card)} type="button">{text("Remove", "Αφαίρεση")}</button>
                        </div>
                      </div>
                      {isViewed ? (
                        <dl className="practice-content-details">
                          <div><dt>{text("Answer", "Απάντηση")}</dt><dd>{card.answer}</dd></div>
                          <div><dt>{text("Keywords", "Λέξεις-κλειδιά")}</dt><dd>{card.tags.join(", ") || text("None", "Καμία")}</dd></div>
                        </dl>
                      ) : null}
                      {isEditing ? <FlashcardEditor card={card} onCancel={() => setEditingCardId(null)} onMessage={setMessage} units={units} /> : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
