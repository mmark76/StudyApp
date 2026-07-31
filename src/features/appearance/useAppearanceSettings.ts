import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  injectLocalWriteFailure,
  type LocalWriteFailureInjector,
} from "../../infrastructure/database/localWriteFailureInjector";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import {
  APPEARANCE_SETTINGS_KEY,
  applyAppearanceSettings,
  defaultAppearanceSettings,
  parseAppearanceSettings,
  type AppearanceSettings,
} from "./appearanceSettings";

export type AppearanceSaveStatus = "idle" | "saving" | "saved" | "error";

function settingsMatch(
  first: AppearanceSettings,
  second: AppearanceSettings,
): boolean {
  return (
    first.colorScheme === second.colorScheme &&
    first.backgroundTone === second.backgroundTone &&
    first.fontChoice === second.fontChoice &&
    first.textSize === second.textSize &&
    first.uiDensity === second.uiDensity
  );
}

export function useAppearanceSettings(
  failureInjector?: LocalWriteFailureInjector,
) {
  const setting = useLiveQuery(
    async () =>
      (await studyDatabase.settings.get(APPEARANCE_SETTINGS_KEY)) ?? null,
    [],
  );
  const persistedSettings = useMemo(
    () => parseAppearanceSettings(setting?.value),
    [setting?.value],
  );
  const [draftSettings, setDraftSettings] =
    useState<AppearanceSettings | null>(null);
  const [saveStatus, setSaveStatus] =
    useState<AppearanceSaveStatus>("idle");
  const writePendingRef = useRef(false);
  const settings = draftSettings ?? persistedSettings;

  useEffect(() => {
    applyAppearanceSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (
      draftSettings &&
      saveStatus === "saved" &&
      settingsMatch(draftSettings, persistedSettings)
    ) {
      setDraftSettings(null);
    }
  }, [draftSettings, persistedSettings, saveStatus]);

  async function commitAppearanceSettings(
    nextSettings: AppearanceSettings,
  ): Promise<boolean> {
    if (writePendingRef.current) return false;

    writePendingRef.current = true;
    setDraftSettings(nextSettings);
    setSaveStatus("saving");

    try {
      await injectLocalWriteFailure(failureInjector, "appearance");
      await studyDatabase.settings.put({
        key: APPEARANCE_SETTINGS_KEY,
        value: nextSettings,
      });
      setSaveStatus("saved");
      return true;
    } catch {
      setSaveStatus("error");
      return false;
    } finally {
      writePendingRef.current = false;
    }
  }

  async function updateAppearanceSettings(
    nextSettings: Partial<AppearanceSettings>,
  ): Promise<boolean> {
    return commitAppearanceSettings({ ...settings, ...nextSettings });
  }

  async function resetAppearanceSettings(): Promise<boolean> {
    return commitAppearanceSettings(defaultAppearanceSettings);
  }

  async function retryAppearanceSettings(): Promise<boolean> {
    return commitAppearanceSettings(settings);
  }

  return {
    isLoading: setting === undefined,
    isSaving: saveStatus === "saving",
    resetAppearanceSettings,
    retryAppearanceSettings,
    saveStatus,
    settings,
    updateAppearanceSettings,
  };
}
