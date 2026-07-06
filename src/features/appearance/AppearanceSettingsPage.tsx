import {
  backgroundToneOptions,
  colorSchemeOptions,
  fontChoiceOptions,
  textSizeOptions,
  uiDensityOptions,
  type AppearanceSettings,
} from "./appearanceSettings";
import { useAppearanceSettings } from "./useAppearanceSettings";

export function AppearanceSettingsPage() {
  const {
    isLoading,
    settings,
    updateAppearanceSettings,
    resetAppearanceSettings,
  } = useAppearanceSettings();

  function update<K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) {
    void updateAppearanceSettings({ [key]: value } as Partial<AppearanceSettings>);
  }

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Display</p>
        <h2>Settings</h2>
        <p>Adjust colours, font, text size and spacing across your study workspace.</p>
      </header>

      <section className="content-panel">
        <div className="settings-grid appearance-settings-grid">
          <label className="field-label">
            Accent colour
            <select
              value={settings.colorScheme}
              onChange={(event) => update("colorScheme", event.target.value as AppearanceSettings["colorScheme"])}
            >
              {colorSchemeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <span className="field-help">{colorSchemeOptions.find((option) => option.value === settings.colorScheme)?.description}</span>
          </label>

          <label className="field-label">
            Background colour
            <select
              value={settings.backgroundTone}
              onChange={(event) => update("backgroundTone", event.target.value as AppearanceSettings["backgroundTone"])}
            >
              {backgroundToneOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <span className="field-help">{backgroundToneOptions.find((option) => option.value === settings.backgroundTone)?.description}</span>
          </label>

          <label className="field-label">
            Font
            <select
              value={settings.fontChoice}
              onChange={(event) => update("fontChoice", event.target.value as AppearanceSettings["fontChoice"])}
            >
              {fontChoiceOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <span className="field-help">{fontChoiceOptions.find((option) => option.value === settings.fontChoice)?.description}</span>
          </label>

          <label className="field-label">
            Text size
            <select
              value={settings.textSize}
              onChange={(event) => update("textSize", event.target.value as AppearanceSettings["textSize"])}
            >
              {textSizeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <span className="field-help">{textSizeOptions.find((option) => option.value === settings.textSize)?.description}</span>
          </label>

          <label className="field-label">
            Spacing
            <select
              value={settings.uiDensity}
              onChange={(event) => update("uiDensity", event.target.value as AppearanceSettings["uiDensity"])}
            >
              {uiDensityOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <span className="field-help">{uiDensityOptions.find((option) => option.value === settings.uiDensity)?.description}</span>
          </label>
        </div>

        <div className="button-row appearance-actions" style={{ marginTop: "1.5rem" }}>
          <button className="button secondary" type="button" onClick={() => void resetAppearanceSettings()}>
            Reset appearance
          </button>
        </div>
        <p className="inline-message" role="status" aria-live="polite">
          {isLoading ? "Loading appearance settings…" : "Changes are saved automatically on this device."}
        </p>
      </section>
    </div>
  );
}
