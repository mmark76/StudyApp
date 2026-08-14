import { type FormEvent, useRef, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  injectLocalWriteFailure,
  type LocalWriteFailureInjector,
} from "../../infrastructure/database/localWriteFailureInjector";
import type { Flashcard, StudyUnit } from "../../shared/types/models";
import { addImportedPracticeFlashcard } from "./practiceContentRepository";
import { MAX_IMPORTED_TEXT_LENGTH } from "./importedContent";

function splitCommaList(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function FlashcardForm({
  units,
  existingFlashcards,
  failureInjector,
  onMessage,
}: {
  units: readonly StudyUnit[];
  existingFlashcards: readonly Flashcard[];
  failureInjector?: LocalWriteFailureInjector;
  onMessage: (message: string) => void;
}) {
  const { text } = useLanguage();
  const [unitId, setUnitId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionPendingRef = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionPendingRef.current) return;

    const selectedUnit = units.find((unit) => unit.id === unitId);
    if (!selectedUnit) {
      onMessage(text("Choose a practice chapter first.", "Επίλεξε πρώτα κεφάλαιο εξάσκησης."));
      return;
    }

    const unitCards = existingFlashcards.filter((card) => card.unitId === selectedUnit.id);
    const nextNumber = Math.max(0, ...unitCards.map((card) => card.number)) + 1;
    const nextCard: Flashcard = {
      id: `card-${crypto.randomUUID()}`,
      unitId: selectedUnit.id,
      number: nextNumber,
      question: question.trim(),
      answer: answer.trim(),
      tags: splitCommaList(tags),
    };

    if (!nextCard.question || !nextCard.answer) {
      onMessage(text("Enter a question and an answer.", "Γράψε ερώτηση και απάντηση."));
      return;
    }

    submissionPendingRef.current = true;
    setIsSubmitting(true);
    onMessage("");

    try {
      await injectLocalWriteFailure(failureInjector, "flashcard");
      await addImportedPracticeFlashcard(nextCard);
      setQuestion("");
      setAnswer("");
      setTags("");
      onMessage(text("Flashcard added.", "Η κάρτα προστέθηκε."));
    } catch {
      onMessage(
        text(
          "The flashcard could not be saved on this device. Your entries are still here. Try again.",
          "Η κάρτα δεν μπόρεσε να αποθηκευτεί σε αυτή τη συσκευή. Οι καταχωρίσεις σου παραμένουν στη φόρμα. Δοκίμασε ξανά.",
        ),
      );
    } finally {
      submissionPendingRef.current = false;
      setIsSubmitting(false);
    }
  }

  if (units.length === 0) {
    return <p>{text("Add a practice chapter before creating flashcards.", "Πρόσθεσε κεφάλαιο εξάσκησης πριν δημιουργήσεις κάρτες.")}</p>;
  }

  return (
    <form
      aria-busy={isSubmitting}
      className="material-form"
      onSubmit={(event) => void submit(event)}
    >
      <label className="field-label">
        {text("Practice chapter", "Κεφάλαιο εξάσκησης")}
        <select disabled={isSubmitting} required value={unitId} onChange={(event) => setUnitId(event.target.value)}>
          <option value="">{text("Choose a practice chapter", "Επίλεξε κεφάλαιο εξάσκησης")}</option>
          {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.number}. {unit.title}</option>)}
        </select>
      </label>
      <label className="field-label">
        {text("Question", "Ερώτηση")}
        <textarea disabled={isSubmitting} maxLength={MAX_IMPORTED_TEXT_LENGTH} required rows={3} value={question} onChange={(event) => setQuestion(event.target.value)} />
      </label>
      <label className="field-label">
        {text("Answer", "Απάντηση")}
        <textarea disabled={isSubmitting} maxLength={MAX_IMPORTED_TEXT_LENGTH} required rows={4} value={answer} onChange={(event) => setAnswer(event.target.value)} />
      </label>
      <label className="field-label">
        {text("Keywords (optional)", "Λέξεις-κλειδιά (προαιρετικά)")}
        <input disabled={isSubmitting} value={tags} onChange={(event) => setTags(event.target.value)} placeholder={text("Separate with commas", "Χώρισε με κόμματα")} />
      </label>
      <button className="button primary" disabled={isSubmitting} type="submit">
        {isSubmitting
          ? text("Saving flashcard…", "Αποθήκευση κάρτας…")
          : text("Add flashcard", "Προσθήκη κάρτας")}
      </button>
    </form>
  );
}
