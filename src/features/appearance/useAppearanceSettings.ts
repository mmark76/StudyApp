import { useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import {
  APPEARANCE_SETTINGS_KEY,
  applyAppearanceSettings,
  defaultAppearanceSettings,
  parseAppearanceSettings,
  type AppearanceSettings,
} from "./appearanceSettings";

export function useAppearanceSettings() {
  const setting = useLiveQuery(
    async () => (await studyDatabase.settings.get(APPEARANCE_SETTINGS_KEY)) ?? null,
    [],
  );
  const settings = useMemo(
    () => parseAppearanceSettings(setting?.value),
    [setting?.value],
  );

  useEffect(() => {
    applyAppearanceSettings(settings);
  }, [settings]);

  async function updateAppearanceSettings(nextSettings: Partial<AppearanceSettings>) {
    await studyDatabase.settings.put({
      key: APPEARANCE_SETTINGS_KEY,
      value: { ...settings, ...nextSettings },
    });
  }

  async function resetAppearanceSettings() {
    await studyDatabase.settings.put({
      key: APPEARANCE_SETTINGS_KEY,
      value: defaultAppearanceSettings,
    });
  }

  return {
    isLoading: setting === undefined,
    settings,
    updateAppearanceSettings,
    resetAppearanceSettings,
  };
}
