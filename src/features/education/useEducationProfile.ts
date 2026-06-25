import { useLiveQuery } from "dexie-react-hooks";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import {
  EDUCATION_LEVEL_SETTING_KEY,
  getEducationProfile,
  type EducationLevel,
} from "./educationProfiles";

export function useEducationProfile() {
  const setting = useLiveQuery(
    async () => (await studyDatabase.settings.get(EDUCATION_LEVEL_SETTING_KEY)) ?? null,
    [],
  );
  const isLoading = setting === undefined;
  const profile = setting ? getEducationProfile(setting.value) : null;

  async function selectEducationLevel(level: EducationLevel) {
    await studyDatabase.settings.put({ key: EDUCATION_LEVEL_SETTING_KEY, value: level });
  }

  async function clearEducationLevel() {
    await studyDatabase.settings.delete(EDUCATION_LEVEL_SETTING_KEY);
  }

  return { profile, isLoading, selectEducationLevel, clearEducationLevel };
}
