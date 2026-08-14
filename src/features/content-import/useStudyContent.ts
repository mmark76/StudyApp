import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { flashcards as builtInFlashcards } from "../../data/flashcards";
import { units as builtInUnits } from "../../data/units";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import {
  IMPORTED_FLASHCARDS_SETTING_KEY,
  IMPORTED_UNITS_SETTING_KEY,
  mergeById,
  parseStoredFlashcards,
  parseStoredUnits,
} from "./importedContent";

export function useStudyContent() {
  const unitsSetting = useLiveQuery(
    () => studyDatabase.settings.get(IMPORTED_UNITS_SETTING_KEY),
    [],
  );
  const flashcardsSetting = useLiveQuery(
    () => studyDatabase.settings.get(IMPORTED_FLASHCARDS_SETTING_KEY),
    [],
  );

  const parsedUnits = useMemo(
    () => {
      try {
        return { items: parseStoredUnits(unitsSetting?.value), error: false };
      } catch {
        return { items: [], error: true };
      }
    },
    [unitsSetting?.value],
  );
  const parsedFlashcards = useMemo(
    () => {
      try {
        return { items: parseStoredFlashcards(flashcardsSetting?.value), error: false };
      } catch {
        return { items: [], error: true };
      }
    },
    [flashcardsSetting?.value],
  );
  const importedUnits = parsedUnits.items;
  const importedFlashcards = parsedFlashcards.items;

  const units = useMemo(
    () => mergeById(builtInUnits, importedUnits),
    [importedUnits],
  );
  const flashcards = useMemo(
    () => mergeById(builtInFlashcards, importedFlashcards),
    [importedFlashcards],
  );

  return {
    units,
    flashcards,
    importedUnits,
    importedFlashcards,
    hasStoredContentError: parsedUnits.error || parsedFlashcards.error,
  };
}
