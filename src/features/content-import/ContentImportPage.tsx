import { type ChangeEvent, useState } from "react";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { Flashcard, StudyUnit } from "../../shared/types/models";
import { FlashcardForm } from "./FlashcardForm";
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
      setMessage(`${spreadsheetTopics.length} chapter${spreadsheetTopics.length === 1 ? "" : "s"} added or updated successfully.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not read the chapters file. Download a fresh template and keep the column headings unchanged.");
    } finally {
      event.target.value = "";
    }
  }

  async function importFlashcards(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const spreadsheetFlashcards = parseFlashcardsSpreadsheet(await readFile(file), units);
      const byId = new Map<string, Flashcard>(
        importedFlashcards.map((card) => [card.id, card] as const),
      );
      for (const card of spreadsheetFlashcards) byId.set(card.id, card);
      const nextFlashcards = [...byId.values()];
      await studyDatabase.settings.put({ key: IMPORTED_FLASHCARDS_SETTING_KEY, value: nextFlashcards });
      setMessage(`${spreadsheetFlashcards.length} flashcard${spreadsheetFlashcards.length === 1 ? "" : "s"} added or updated successfully.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not read the flashcards file. Make sure its chapter numbers match chapters already added to the app.");
    } finally {
      event.target.value = "";
    }
  }

  async function clearImportedContent() {
    if (!window.confirm("Remove all chapters and flashcards that you added?")) return;
    await studyDatabase.transaction("rw", studyDatabase.settings, studyDatabase.cardProgress, async () => {
      await studyDatabase.settings.delete(IMPORTED_UNITS_SETTING_KEY);
      await studyDatabase.settings.delete(IMPORTED_FLASHCARDS_SETTING_KEY);
      await studyDatabase.cardProgress.bulkDelete(importedFlashcards.map((card) => card.id));
    });
    setMessage("Your added study content was removed.");
  }

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Your content</p>
        <h2>Add study content</h2>
        <p>Create chapters and flashcards directly in the app, or add many at once with familiar spreadsheet files.</p>
      </header>

      <section className="stats-grid" aria-label="Your added content">
        <article className="stat-card"><strong>{importedUnits.length}</strong><span>Chapters added</span></article>
        <article className="stat-card"><strong>{importedFlashcards.length}</strong><span>Flashcards added</span></article>
      </section>

      <section className="content-panel">
        <h3>Add one chapter</h3>
        <p>Give the chapter a title and add the main learning points. Numbering is handled automatically.</p>
        <UnitForm existingUnits={units} importedUnits={importedUnits} onMessage={setMessage} />
      </section>

      <section className="content-panel">
        <h3>Add one flashcard</h3>
        <p>Choose its chapter, then enter the question and answer.</p>
        <FlashcardForm
          units={units}
          existingFlashcards={flashcards}
          importedFlashcards={importedFlashcards}
          onMessage={setMessage}
        />
      </section>

      <section className="content-panel">
        <h3>Add many items at once</h3>
        <ol className="friendly-steps">
          <li>Download the spreadsheet you need.</li>
          <li>Open it in Excel, Numbers, or Google Sheets and replace the examples.</li>
          <li>Save it, then choose the completed file below.</li>
        </ol>
        <div className="template-grid">
          <div className="template-card">
            <h4>Chapters</h4>
            <a className="button secondary" download="chapters-template.csv" href={`${import.meta.env.BASE_URL}templates/units-spreadsheet.csv`}>Download chapters spreadsheet</a>
            <label className="button primary file-button">Choose completed chapters file<input accept=".csv,text/csv" type="file" onChange={(event) => void importTopics(event)} /></label>
          </div>
          <div className="template-card">
            <h4>Flashcards</h4>
            <a className="button secondary" download="flashcards-template.csv" href={`${import.meta.env.BASE_URL}templates/flashcards-spreadsheet.csv`}>Download flashcards spreadsheet</a>
            <label className="button primary file-button">Choose completed flashcards file<input accept=".csv,text/csv" type="file" onChange={(event) => void importFlashcards(event)} /></label>
          </div>
        </div>
      </section>

      <section className="content-panel">
        <h3>Manage your content</h3>
        <button className="button danger" onClick={() => void clearImportedContent()}>Remove all content I added</button>
      </section>

      <p className="inline-message status-banner" role="status" aria-live="polite">{message}</p>
    </div>
  );
}
