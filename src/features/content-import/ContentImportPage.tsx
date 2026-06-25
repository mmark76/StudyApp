import { type ChangeEvent, useState } from "react";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import {
  IMPORTED_FLASHCARDS_SETTING_KEY,
  IMPORTED_UNITS_SETTING_KEY,
  parseImportedFlashcards,
  parseImportedUnits,
} from "./importedContent";
import { useStudyContent } from "./useStudyContent";

async function readJsonFile(file: File): Promise<unknown> {
  return JSON.parse(await file.text()) as unknown;
}

export function ContentImportPage() {
  const { importedUnits, importedFlashcards } = useStudyContent();
  const [message, setMessage] = useState("");

  async function importUnits(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const units = parseImportedUnits(await readJsonFile(file));
      await studyDatabase.settings.put({ key: IMPORTED_UNITS_SETTING_KEY, value: units });
      setMessage(`${units.length} unit${units.length === 1 ? "" : "s"} imported.`);
    } catch {
      setMessage("The units file is not valid JSON in the required format.");
    } finally {
      event.target.value = "";
    }
  }

  async function importFlashcards(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const flashcards = parseImportedFlashcards(await readJsonFile(file));
      await studyDatabase.settings.put({ key: IMPORTED_FLASHCARDS_SETTING_KEY, value: flashcards });
      setMessage(`${flashcards.length} flashcard${flashcards.length === 1 ? "" : "s"} imported.`);
    } catch {
      setMessage("The flashcards file is not valid JSON in the required format.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">User content</p>
        <h2>Import study content</h2>
        <p>Import units and flashcards from JSON files. Each new import replaces the previous imported content of the same type.</p>
      </header>

      <section className="stats-grid" aria-label="Imported content">
        <article className="stat-card"><strong>{importedUnits.length}</strong><span>Imported units</span></article>
        <article className="stat-card"><strong>{importedFlashcards.length}</strong><span>Imported flashcards</span></article>
      </section>

      <section className="content-panel">
        <h3>Import files</h3>
        <div className="button-row">
          <label className="button primary file-button">
            Import units
            <input accept="application/json,.json" type="file" onChange={(event) => void importUnits(event)} />
          </label>
          <label className="button secondary file-button">
            Import flashcards
            <input accept="application/json,.json" type="file" onChange={(event) => void importFlashcards(event)} />
          </label>
        </div>
        <p className="inline-message" role="status" aria-live="polite">{message}</p>
      </section>

      <section className="content-panel">
        <h3>Required JSON fields</h3>
        <p><strong>Units:</strong> <code>id</code>, <code>number</code>, <code>title</code>, <code>objectives</code>, <code>summary</code>, <code>keyTerms</code>.</p>
        <p><strong>Flashcards:</strong> <code>id</code>, <code>unitId</code>, <code>number</code>, <code>question</code>, <code>answer</code>, <code>tags</code>.</p>
        <p>The file may contain the array directly or an object with a <code>units</code> or <code>flashcards</code> property.</p>
      </section>
    </div>
  );
}
