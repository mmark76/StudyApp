import { type ChangeEvent, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import {
  StorageNotice,
  storageNoticePlacements,
} from "../../shared/components/StorageNotice";
import type { StudyUnit } from "../../shared/types/models";
import { FlashcardForm } from "./FlashcardForm";
import { mergeImportedFlashcards } from "./flashcardIdentity";
import {
  IMPORTED_FLASHCARDS_SETTING_KEY,
  IMPORTED_UNITS_SETTING_KEY,
} from "./importedContent";
import {
  parseFlashcardsSpreadsheet,
  parseUnitsSpreadsheet,
} from "./spreadsheetImport";
import { UnitForm } from "./UnitForm";
import { useStudyContent } from "./useStudyContent";

async function readFile(file: File): Promise<string> {
  return file.text();
}

export function ContentImportPage() {
  const { language, text } = useLanguage();
  const { units, flashcards, importedUnits, importedFlashcards } = useStudyContent();
  const [message, setMessage] = useState("");

  async function importTopics(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const spreadsheetTopics = parseUnitsSpreadsheet(await readFile(file)).map((topic) => {
        const existing = units.find((candidate) => candidate.number === topic.number);
        return existing ? { ...topic, id: existing.id } : topic;
      });
      const byNumber = new Map<number, StudyUnit>(
        importedUnits.map((topic) => [topic.number, topic] as const),
      );
      for (const topic of spreadsheetTopics) byNumber.set(topic.number, topic);
      const nextTopics = [...byNumber.values()].sort((first, second) => first.number - second.number);
      await studyDatabase.settings.put({ key: IMPORTED_UNITS_SETTING_KEY, value: nextTopics });
      setMessage(text(
        `${spreadsheetTopics.length} chapter${spreadsheetTopics.length === 1 ? "" : "s"} saved.`,
        `Αποθηκεύτηκαν ${spreadsheetTopics.length} κεφάλαια.`,
      ));
    } catch (error) {
      setMessage(
        language === "en" && error instanceof Error
          ? error.message
          : text("The chapters file could not be read.", "Το αρχείο κεφαλαίων δεν μπορεί να διαβαστεί."),
      );
    } finally {
      event.target.value = "";
    }
  }

  async function importFlashcards(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const spreadsheetFlashcards = await parseFlashcardsSpreadsheet(await readFile(file), units);
      const nextFlashcards = mergeImportedFlashcards(importedFlashcards, spreadsheetFlashcards);
      await studyDatabase.settings.put({ key: IMPORTED_FLASHCARDS_SETTING_KEY, value: nextFlashcards });
      setMessage(text(
        `${spreadsheetFlashcards.length} flashcard${spreadsheetFlashcards.length === 1 ? "" : "s"} saved.`,
        `Αποθηκεύτηκαν ${spreadsheetFlashcards.length} κάρτες.`,
      ));
    } catch (error) {
      setMessage(
        language === "en" && error instanceof Error
          ? error.message
          : text("The flashcards file could not be read.", "Το αρχείο καρτών δεν μπορεί να διαβαστεί."),
      );
    } finally {
      event.target.value = "";
    }
  }

  async function clearImportedContent() {
    if (!window.confirm(text(
      "Remove all chapters and flashcards you added?",
      "Να διαγραφούν όλα τα κεφάλαια και οι κάρτες που πρόσθεσες;",
    ))) return;

    await studyDatabase.transaction("rw", studyDatabase.settings, studyDatabase.cardProgress, async () => {
      await studyDatabase.settings.delete(IMPORTED_UNITS_SETTING_KEY);
      await studyDatabase.settings.delete(IMPORTED_FLASHCARDS_SETTING_KEY);
      await studyDatabase.cardProgress.bulkDelete(importedFlashcards.map((card) => card.id));
    });
    setMessage(text("Added content removed.", "Το περιεχόμενο διαγράφηκε."));
  }

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">{text("Your content", "Το περιεχόμενό σου")}</p>
        <h2>{text("Add study content", "Προσθήκη περιεχομένου")}</h2>
        <p>{text("Create chapters and flashcards or import them from CSV.", "Δημιούργησε κεφάλαια και κάρτες ή εισήγαγέ τα από CSV.")}</p>
      </header>

      <StorageNotice kind={storageNoticePlacements.contentImport} />

      <section className="stats-grid" aria-label={text("Added content", "Περιεχόμενο που προστέθηκε")}>
        <article className="stat-card"><strong>{importedUnits.length}</strong><span>{text("Chapters added", "Κεφάλαια")}</span></article>
        <article className="stat-card"><strong>{importedFlashcards.length}</strong><span>{text("Flashcards added", "Κάρτες")}</span></article>
      </section>

      <section className="content-panel">
        <h3>{text("Add one chapter", "Προσθήκη κεφαλαίου")}</h3>
        <UnitForm existingUnits={units} importedUnits={importedUnits} onMessage={setMessage} />
      </section>

      <section className="content-panel">
        <h3>{text("Add one flashcard", "Προσθήκη κάρτας")}</h3>
        <FlashcardForm
          units={units}
          existingFlashcards={flashcards}
          importedFlashcards={importedFlashcards}
          onMessage={setMessage}
        />
      </section>

      <section className="content-panel">
        <h3>{text("Import CSV files", "Εισαγωγή αρχείων CSV")}</h3>
        <div className="template-grid">
          <div className="template-card">
            <h4>{text("Chapters", "Κεφάλαια")}</h4>
            <a className="button secondary" download="chapters-template.csv" href={`${import.meta.env.BASE_URL}templates/units-spreadsheet.csv`}>
              {text("Download template", "Λήψη προτύπου")}
            </a>
            <label className="button primary file-button">
              {text("Choose chapters file", "Επιλογή αρχείου κεφαλαίων")}
              <input accept=".csv,text/csv" type="file" onChange={(event) => void importTopics(event)} />
            </label>
          </div>
          <div className="template-card">
            <h4>{text("Flashcards", "Κάρτες")}</h4>
            <a className="button secondary" download="flashcards-template.csv" href={`${import.meta.env.BASE_URL}templates/flashcards-spreadsheet.csv`}>
              {text("Download template", "Λήψη προτύπου")}
            </a>
            <label className="button primary file-button">
              {text("Choose flashcards file", "Επιλογή αρχείου καρτών")}
              <input accept=".csv,text/csv" type="file" onChange={(event) => void importFlashcards(event)} />
            </label>
          </div>
        </div>
      </section>

      <section className="content-panel">
        <h3>{text("Manage content", "Διαχείριση περιεχομένου")}</h3>
        <button className="button danger" onClick={() => void clearImportedContent()}>
          {text("Remove added content", "Διαγραφή περιεχομένου")}
        </button>
      </section>

      <p className="inline-message status-banner" role="status" aria-live="polite">{message}</p>
    </div>
  );
}
