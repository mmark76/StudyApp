import { type FormEvent, useState } from "react";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { Flashcard, StudyUnit } from "../../shared/types/models";
import { IMPORTED_FLASHCARDS_SETTING_KEY } from "./importedContent";

function splitCommaList(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function FlashcardForm({
  units,
  existingFlashcards,
  importedFlashcards,
  onMessage,
}: {
  units: readonly StudyUnit[];
  existingFlashcards: readonly Flashcard[];
  importedFlashcards: readonly Flashcard[];
  onMessage: (message: string) => void;
}) {
  const [unitId, setUnitId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [tags, setTags] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedUnit = units.find((unit) => unit.id === unitId);
    if (!selectedUnit) {
      onMessage("Choose a chapter first.");
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
      onMessage("Enter both a question and an answer.");
      return;
    }

    await studyDatabase.settings.put({ key: IMPORTED_FLASHCARDS_SETTING_KEY, value: [...importedFlashcards, nextCard] });
    setQuestion("");
    setAnswer("");
    setTags("");
    onMessage("The flashcard was added.");
  }

  if (units.length === 0) {
    return <p>Add a chapter before creating flashcards.</p>;
  }

  return (
    <form className="material-form" onSubmit={(event) => void submit(event)}>
      <label className="field-label">Chapter<select required value={unitId} onChange={(event) => setUnitId(event.target.value)}><option value="">Choose a chapter</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.number}. {unit.title}</option>)}</select></label>
      <label className="field-label">Question<textarea required rows={3} value={question} onChange={(event) => setQuestion(event.target.value)} /></label>
      <label className="field-label">Answer<textarea required rows={4} value={answer} onChange={(event) => setAnswer(event.target.value)} /></label>
      <label className="field-label">Keywords (optional)<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Separate keywords with commas" /></label>
      <button className="button primary" type="submit">Add flashcard</button>
    </form>
  );
}
