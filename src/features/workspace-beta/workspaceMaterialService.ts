import { studyDatabase, type StudyDatabase } from "../../infrastructure/database/studyDatabase";
import {
  IMPORTED_FLASHCARDS_SETTING_KEY,
  IMPORTED_UNITS_SETTING_KEY,
  parseStoredFlashcards,
  parseStoredUnits,
} from "../content-import/importedContent";
import { isStructuredStudyFile } from "../study-materials/localStudyFiles";
import {
  parseStoredStudyMaterials,
  STUDY_MATERIALS_SETTING_KEY,
} from "../study-materials/studyMaterials";
import type { LocalStudyFile } from "../../shared/types/models";

export type MaterialPanel = "sources" | "knowledge" | "practice" | "ai";
export interface ManagedMaterialItem {
  key: string;
  title: string;
  detail: string;
}
interface MaterialSnapshot {
  files: LocalStudyFile[];
  links: ReturnType<typeof parseStoredStudyMaterials>;
  units: ReturnType<typeof parseStoredUnits>;
  cards: ReturnType<typeof parseStoredFlashcards>;
}

async function readSnapshot(database: StudyDatabase): Promise<MaterialSnapshot> {
  const [files, links, units, cards] = await Promise.all([
    database.studyFiles.toArray(),
    database.settings.get(STUDY_MATERIALS_SETTING_KEY),
    database.settings.get(IMPORTED_UNITS_SETTING_KEY),
    database.settings.get(IMPORTED_FLASHCARDS_SETTING_KEY),
  ]);
  return {
    files,
    links: parseStoredStudyMaterials(links?.value),
    units: parseStoredUnits(units?.value),
    cards: parseStoredFlashcards(cards?.value),
  };
}

export function getManagedItems(panel: MaterialPanel, data: MaterialSnapshot): ManagedMaterialItem[] {
  if (panel === "ai") return []; // AI is external; no stored conversations in StudyApp.
  if (panel === "practice") return data.cards.map(card => ({
    key: "card:" + card.id, title: card.question, detail: "Flashcard",
  }));
  const isKnowledge = panel === "knowledge";
  const files = data.files.filter(file => isStructuredStudyFile(file) === isKnowledge)
    .map(file => ({ key: "file:" + file.id, title: file.title, detail: file.fileName }));
  const links = data.links.filter(link => (link.structuredStudyType !== undefined) === isKnowledge)
    .map(link => ({ key: "link:" + link.id, title: link.title, detail: "Saved link" }));
  const chapters = isKnowledge ? data.units.map(unit => ({
    key: "unit:" + unit.id,
    title: unit.title,
    detail: "Chapter " + unit.number + " · " +
      data.cards.filter(card => card.unitId === unit.id).length + " linked flashcards",
  })) : [];
  return [...chapters, ...files, ...links];
}

export async function listWorkspaceMaterial(
  panel: MaterialPanel,
  database: StudyDatabase = studyDatabase,
): Promise<ManagedMaterialItem[]> {
  return database.transaction("r", database.studyFiles, database.settings, async () =>
    getManagedItems(panel, await readSnapshot(database)));
}

/**
 * Remove only explicitly scoped user material. Intentionally never accesses
 * cardProgress, studySessions or studyOperations; learning history is preserved.
 * Import settings and files are shared by Standard and BETA.
 */
export async function deleteWorkspaceMaterial(
  panel: MaterialPanel,
  keys: readonly string[],
  requireAll = false,
  database: StudyDatabase = studyDatabase,
): Promise<number> {
  if (panel === "ai" || keys.length === 0 || new Set(keys).size !== keys.length) {
    throw new Error("Select valid material first.");
  }
  return database.transaction("rw", database.studyFiles, database.settings, async () => {
    const snapshot = await readSnapshot(database);
    const available = getManagedItems(panel, snapshot).map(item => item.key);
    const allowed = new Set(available);
    if (keys.some(key => !allowed.has(key))) throw new Error("Material changed. Review selection again.");
    if (requireAll && (available.length !== keys.length || available.some(key => !keys.includes(key)))) {
      throw new Error("Material changed. Review selection again.");
    }

    const fileIds = keys.filter(key => key.startsWith("file:")).map(key => key.slice(5));
    const linkIds = new Set(keys.filter(key => key.startsWith("link:")).map(key => key.slice(5)));
    const unitIds = new Set(keys.filter(key => key.startsWith("unit:")).map(key => key.slice(5)));
    const cardIds = new Set(keys.filter(key => key.startsWith("card:")).map(key => key.slice(5)));

    if (fileIds.length) await database.studyFiles.bulkDelete(fileIds);
    if (linkIds.size) {
      await database.settings.put({
        key: STUDY_MATERIALS_SETTING_KEY,
        value: snapshot.links.filter(link => !linkIds.has(link.id)),
      });
    }
    if (unitIds.size) {
      await database.settings.put({
        key: IMPORTED_UNITS_SETTING_KEY,
        value: snapshot.units.filter(unit => !unitIds.has(unit.id)),
      });
      // Keep references consistent when a chapter is removed, but not study history.
      await database.settings.put({
        key: IMPORTED_FLASHCARDS_SETTING_KEY,
        value: snapshot.cards.filter(card => !unitIds.has(card.unitId)),
      });
    } else if (cardIds.size) {
      await database.settings.put({
        key: IMPORTED_FLASHCARDS_SETTING_KEY,
        value: snapshot.cards.filter(card => !cardIds.has(card.id)),
      });
    }
    return keys.length;
  });
}
