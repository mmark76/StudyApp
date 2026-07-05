import {
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
    void updateAppearanceSettings({ [key]: value });
  }

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Display</p>
        <h2>Appearance settings</h2>
        <p>Adjust the colours, font, text size and spacing used across your study workspace.</p>
      </header>

      <section className="content-panel">
        <div className="settings-grid">
          <label className="field-label">
            Colour theme
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

        <div className="button-row appearance-actions">
          <button className="button secondary" type="button" onClick={() => void resetAppearanceSettings()}>
            Reset appearance
          </button>
        </div>
        <p className="inline-message" role="status" aria-live="polite">
          {isLoading ? "Loading appearance settings…" : "Changes are saved automatically on this device."}
        </p>
      </section>

      <section className="content-panel appearance-preview-panel" aria-label="Appearance preview">
        <div>
          <p className="eyebrow">Preview</p>
          <h3>Active recall should feel clear and comfortable</h3>
          <p>
            This preview uses your current settings. Use larger text for long reading sessions,
            compact spacing for small screens, or a warmer colour theme when reviewing at night.
          </p>
          <div className="appearance-swatch-row" aria-hidden="true">
            <span className="appearance-swatch appearance-swatch-strong" />
            <span className="appearance-swatch appearance-swatch-soft" />
            <span className="appearance-swatch appearance-swatch-surface" />
          </div>
          <div className="button-row">
            <button className="button primary" type="button">Primary action</button>
            <button className="button secondary" type="button">Secondary action</button>
          </div>
        </div>
      </section>
    </div>
  );
}
