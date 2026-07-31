import { type FormEvent, useRef, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  injectLocalWriteFailure,
  type LocalWriteFailureInjector,
} from "../../infrastructure/database/localWriteFailureInjector";
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
  failureInjector,
  importedUnits,
  onMessage,
}: {
  existingUnits: readonly StudyUnit[];
  failureInjector?: LocalWriteFailureInjector;
  importedUnits: readonly StudyUnit[];
  onMessage: (message: string) => void;
}) {
  const { text } = useLanguage();
  const [title, setTitle] = useState("");
  const [objectives, setObjectives] = useState("");
  const [summary, setSummary] = useState("");
  const [keyTerms, setKeyTerms] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionPendingRef = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionPendingRef.current) return;

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
      onMessage(text("Enter a chapter title.", "Γράψε τίτλο κεφαλαίου."));
      return;
    }

    submissionPendingRef.current = true;
    setIsSubmitting(true);
    onMessage("");

    try {
      await injectLocalWriteFailure(failureInjector, "chapter");
      await studyDatabase.settings.put({
        key: IMPORTED_UNITS_SETTING_KEY,
        value: [...importedUnits, nextUnit],
      });
      setTitle("");
      setObjectives("");
      setSummary("");
      setKeyTerms("");
      onMessage(text("Chapter added.", "Το κεφάλαιο προστέθηκε."));
    } catch {
      onMessage(
        text(
          "The chapter could not be saved on this device. Your entries are still here. Try again.",
          "Το κεφάλαιο δεν μπόρεσε να αποθηκευτεί σε αυτή τη συσκευή. Οι καταχωρίσεις σου παραμένουν στη φόρμα. Δοκίμασε ξανά.",
        ),
      );
    } finally {
      submissionPendingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form
      aria-busy={isSubmitting}
      className="material-form"
      onSubmit={(event) => void submit(event)}
    >
      <label className="field-label">
        {text("Chapter title", "Τίτλος κεφαλαίου")}
        <input disabled={isSubmitting} required value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label className="field-label">
        {text("Learning goals", "Στόχοι μάθησης")}
        <textarea disabled={isSubmitting} rows={4} value={objectives} onChange={(event) => setObjectives(event.target.value)} placeholder={text("One goal per line", "Ένας στόχος ανά γραμμή")} />
      </label>
      <label className="field-label">
        {text("Key points", "Βασικά σημεία")}
        <textarea disabled={isSubmitting} rows={5} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder={text("One point per line", "Ένα σημείο ανά γραμμή")} />
      </label>
      <label className="field-label">
        {text("Important terms", "Σημαντικοί όροι")}
        <input disabled={isSubmitting} value={keyTerms} onChange={(event) => setKeyTerms(event.target.value)} placeholder={text("Separate with commas", "Χώρισε με κόμματα")} />
      </label>
      <button className="button primary" disabled={isSubmitting} type="submit">
        {isSubmitting
          ? text("Saving chapter…", "Αποθήκευση κεφαλαίου…")
          : text("Add chapter", "Προσθήκη κεφαλαίου")}
      </button>
    </form>
  );
}
