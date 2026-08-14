import {
  studyDatabase,
  type StudyDatabase,
} from "../../infrastructure/database/studyDatabase";
import {
  parseStoredStudyMaterials,
  STUDY_MATERIALS_SETTING_KEY,
  type StudyMaterialLink,
} from "./studyMaterials";

export async function addSavedStudyMaterialLink(
  item: StudyMaterialLink,
  database: StudyDatabase = studyDatabase,
): Promise<void> {
  await database.transaction("rw", database.settings, async () => {
    const setting = await database.settings.get(STUDY_MATERIALS_SETTING_KEY);
    const currentLinks = parseStoredStudyMaterials(setting?.value);
    if (currentLinks.some((link) => link.id === item.id || link.url === item.url)) {
      throw new Error("This link is already saved.");
    }
    await database.settings.put({
      key: STUDY_MATERIALS_SETTING_KEY,
      value: [...currentLinks, item],
    });
  });
}

export async function removeSavedStudyMaterialLink(
  linkId: string,
  database: StudyDatabase = studyDatabase,
): Promise<void> {
  await database.transaction("rw", database.settings, async () => {
    const setting = await database.settings.get(STUDY_MATERIALS_SETTING_KEY);
    const currentLinks = parseStoredStudyMaterials(setting?.value);
    await database.settings.put({
      key: STUDY_MATERIALS_SETTING_KEY,
      value: currentLinks.filter((link) => link.id !== linkId),
    });
  });
}
