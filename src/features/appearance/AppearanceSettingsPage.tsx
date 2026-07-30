import { useLanguage } from "../../i18n/LanguageContext";
import {
  backgroundToneOptions,
  colorSchemeOptions,
  fontChoiceOptions,
  textSizeOptions,
  uiDensityOptions,
  type AppearanceSettings,
} from "./appearanceSettings";
import { useAppearanceSettings } from "./useAppearanceSettings";

const greekOptionCopy: Record<string, { label: string; description: string }> = {
  "color:amber": { label: "Κεχριμπαρί", description: "Ζεστή προεπιλεγμένη απόχρωση." },
  "color:blue": { label: "Μπλε", description: "Ήρεμη κλασική απόχρωση." },
  "color:emerald": { label: "Σμαραγδί", description: "Φρέσκια πράσινη απόχρωση." },
  "color:purple": { label: "Μωβ", description: "Βαθύτερη μωβ απόχρωση." },
  "color:slate": { label: "Γκρι", description: "Ήρεμη ουδέτερη απόχρωση." },
  "background:warm": { label: "Ζεστό κρεμ", description: "Άνετο φόντο για ανάγνωση." },
  "background:paper": { label: "Λευκό χαρτί", description: "Καθαρό λευκό περιβάλλον." },
  "background:sand": { label: "Άμμος", description: "Απαλό μπεζ φόντο." },
  "background:rose": { label: "Απαλό ροζ", description: "Ήρεμο ροζ φόντο." },
  "background:sky": { label: "Ουρανός", description: "Ανοιχτό μπλε φόντο." },
  "font:system": { label: "Γραμματοσειρά συστήματος", description: "Η προεπιλεγμένη καθαρή γραμματοσειρά." },
  "font:serif": { label: "Serif", description: "Στυλ βιβλίου για μεγαλύτερα κείμενα." },
  "font:rounded": { label: "Στρογγυλεμένη", description: "Πιο απαλή γραμματοσειρά." },
  "font:mono": { label: "Monospace", description: "Τεχνική γραμματοσειρά σταθερού πλάτους." },
  "text:compact": { label: "Μικρό", description: "Μικρότερο κείμενο." },
  "text:comfortable": { label: "Άνετο", description: "Ισορροπημένο μέγεθος." },
  "text:large": { label: "Μεγάλο", description: "Μεγαλύτερο κείμενο." },
  "text:extra-large": { label: "Πολύ μεγάλο", description: "Μέγιστη ευκρίνεια." },
  "density:compact": { label: "Συμπαγές", description: "Μικρότερα κενά." },
  "density:comfortable": { label: "Άνετο", description: "Προεπιλεγμένα κενά." },
  "density:spacious": { label: "Ευρύχωρο", description: "Περισσότερος χώρος." },
};

export function AppearanceSettingsPage() {
  const { language, text } = useLanguage();
  const {
    isLoading,
    settings,
    updateAppearanceSettings,
    resetAppearanceSettings,
  } = useAppearanceSettings();

  function update<K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) {
    void updateAppearanceSettings({ [key]: value } as Partial<AppearanceSettings>);
  }

  function optionLabel(group: string, option: { value: string; label: string }): string {
    return language === "el" ? greekOptionCopy[`${group}:${option.value}`]?.label ?? option.label : option.label;
  }

  function optionDescription(group: string, option: { value: string; description: string }): string {
    return language === "el"
      ? greekOptionCopy[`${group}:${option.value}`]?.description ?? option.description
      : option.description;
  }

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">{text("Display", "Εμφάνιση")}</p>
        <h2>{text("Settings", "Ρυθμίσεις")}</h2>
        <p>{text("Adjust colours, font, text size and spacing.", "Ρύθμισε χρώματα, γραμματοσειρά, μέγεθος και αποστάσεις.")}</p>
      </header>

      <section className="content-panel">
        <div className="settings-grid appearance-settings-grid">
          <label className="field-label">
            {text("Accent colour", "Χρώμα έμφασης")}
            <select value={settings.colorScheme} onChange={(event) => update("colorScheme", event.target.value as AppearanceSettings["colorScheme"])}>
              {colorSchemeOptions.map((option) => <option key={option.value} value={option.value}>{optionLabel("color", option)}</option>)}
            </select>
            <span className="field-help">{optionDescription("color", colorSchemeOptions.find((option) => option.value === settings.colorScheme) ?? colorSchemeOptions[0])}</span>
          </label>

          <label className="field-label">
            {text("Background colour", "Χρώμα φόντου")}
            <select value={settings.backgroundTone} onChange={(event) => update("backgroundTone", event.target.value as AppearanceSettings["backgroundTone"])}>
              {backgroundToneOptions.map((option) => <option key={option.value} value={option.value}>{optionLabel("background", option)}</option>)}
            </select>
            <span className="field-help">{optionDescription("background", backgroundToneOptions.find((option) => option.value === settings.backgroundTone) ?? backgroundToneOptions[0])}</span>
          </label>

          <label className="field-label">
            {text("Font", "Γραμματοσειρά")}
            <select value={settings.fontChoice} onChange={(event) => update("fontChoice", event.target.value as AppearanceSettings["fontChoice"])}>
              {fontChoiceOptions.map((option) => <option key={option.value} value={option.value}>{optionLabel("font", option)}</option>)}
            </select>
            <span className="field-help">{optionDescription("font", fontChoiceOptions.find((option) => option.value === settings.fontChoice) ?? fontChoiceOptions[0])}</span>
          </label>

          <label className="field-label">
            {text("Text size", "Μέγεθος κειμένου")}
            <select value={settings.textSize} onChange={(event) => update("textSize", event.target.value as AppearanceSettings["textSize"])}>
              {textSizeOptions.map((option) => <option key={option.value} value={option.value}>{optionLabel("text", option)}</option>)}
            </select>
            <span className="field-help">{optionDescription("text", textSizeOptions.find((option) => option.value === settings.textSize) ?? textSizeOptions[0])}</span>
          </label>

          <label className="field-label">
            {text("Spacing", "Αποστάσεις")}
            <select value={settings.uiDensity} onChange={(event) => update("uiDensity", event.target.value as AppearanceSettings["uiDensity"])}>
              {uiDensityOptions.map((option) => <option key={option.value} value={option.value}>{optionLabel("density", option)}</option>)}
            </select>
            <span className="field-help">{optionDescription("density", uiDensityOptions.find((option) => option.value === settings.uiDensity) ?? uiDensityOptions[0])}</span>
          </label>
        </div>

        <div className="button-row appearance-actions" style={{ marginTop: "1.5rem" }}>
          <button className="button secondary" type="button" onClick={() => void resetAppearanceSettings()}>
            {text("Reset appearance", "Επαναφορά εμφάνισης")}
          </button>
        </div>
        <p className="inline-message" role="status" aria-live="polite">
          {isLoading
            ? text("Loading settings…", "Φόρτωση ρυθμίσεων…")
            : text("Changes are saved automatically.", "Οι αλλαγές αποθηκεύονται αυτόματα.")}
        </p>
      </section>
    </div>
  );
}
