import { type FormEvent, useState } from "react";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { StudyUnit } from "../../shared/types/models";
import { IMPORTED_UNITS_SETTING_KEY } from "./importedContent";

function splitLines(value: string): string[] {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function splitCommaList(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function UnitForm({
  existingUnits,
  importedUnits,
  onMessage,
}: {
  existingUnits: readonly StudyUnit[];
  importedUnits: readonly StudyUnit[];
  onMessage: (message: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [objectives, setObjectives] = useState("");
  const [summary, setSummary] = useState("");
  const [keyTerms, setKeyTerms] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextNumber = Math.max(0, ...existingUnits.map((unit) => unit.number)) + 1;
    const nextUnit: StudyUnit = {
      id: `unit-${crypto.randomUUID()}`,
      number: nextNumber,
      title: title.trim(),
      objectives: splitLines(objectives),
      summary: splitLines(summary),
      keyTerms: splitCommaList(keyTerms),
    };

    if (!nextUnit.title) {
      onMessage("Enter a title for the chapter.");
      return;
    }

    await studyDatabase.settings.put({ key: IMPORTED_UNITS_SETTING_KEY, value: [...importedUnits, nextUnit] });
    setTitle("");
    setObjectives("");
    setSummary("");
    setKeyTerms("");
    onMessage("The chapter was added.");
  }

  return (
    <form className="material-form" onSubmit={(event) => void submit(event)}>
      <label className="field-label">Chapter title<input required value={title} onChange={(event) => setTitle(event.target.value)} /></label>
      <label className="field-label">What should you learn?<textarea rows={4} value={objectives} onChange={(event) => setObjectives(event.target.value)} placeholder="Write one learning goal per line" /></label>
      <label className="field-label">Key points<textarea rows={5} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Write one key point per line" /></label>
      <label className="field-label">Important terms<input value={keyTerms} onChange={(event) => setKeyTerms(event.target.value)} placeholder="Separate terms with commas" /></label>
      <button className="button primary" type="submit">Add chapter</button>
    </form>
  );
}
