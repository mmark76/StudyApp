export const APPEARANCE_SETTINGS_KEY = "appearance-settings";

export type ColorScheme = "blue" | "emerald" | "purple" | "amber" | "slate";
export type FontChoice = "system" | "serif" | "rounded" | "mono";
export type TextSize = "compact" | "comfortable" | "large" | "extra-large";
export type UiDensity = "compact" | "comfortable" | "spacious";

export interface AppearanceSettings {
  colorScheme: ColorScheme;
  fontChoice: FontChoice;
  textSize: TextSize;
  uiDensity: UiDensity;
}

export interface AppearanceOption<T extends string> {
  value: T;
  label: string;
  description: string;
}

export const colorSchemeOptions = [
  { value: "blue", label: "Blue", description: "The calm default study theme." },
  { value: "emerald", label: "Emerald", description: "A fresh green theme for long study sessions." },
  { value: "purple", label: "Purple", description: "A deeper focus theme with violet accents." },
  { value: "amber", label: "Amber", description: "A warmer theme for reading and revision." },
  { value: "slate", label: "Slate", description: "A quiet neutral theme with minimal colour." },
] as const satisfies readonly AppearanceOption<ColorScheme>[];

export const fontChoiceOptions = [
  { value: "system", label: "System sans", description: "Uses the default clean interface font." },
  { value: "serif", label: "Serif", description: "A book-like reading style for longer notes." },
  { value: "rounded", label: "Rounded", description: "A softer friendly sans-serif style." },
  { value: "mono", label: "Monospace", description: "A technical, fixed-width style." },
] as const satisfies readonly AppearanceOption<FontChoice>[];

export const textSizeOptions = [
  { value: "compact", label: "Compact", description: "Slightly smaller text for dense screens." },
  { value: "comfortable", label: "Comfortable", description: "The default balanced reading size." },
  { value: "large", label: "Large", description: "Larger text for easier reading." },
  { value: "extra-large", label: "Extra large", description: "Maximum reading comfort and visibility." },
] as const satisfies readonly AppearanceOption<TextSize>[];

export const uiDensityOptions = [
  { value: "compact", label: "Compact", description: "Reduces spacing so more fits on screen." },
  { value: "comfortable", label: "Comfortable", description: "The default spacing and card size." },
  { value: "spacious", label: "Spacious", description: "Adds more room around controls and cards." },
] as const satisfies readonly AppearanceOption<UiDensity>[];

export const defaultAppearanceSettings: AppearanceSettings = {
  colorScheme: "blue",
  fontChoice: "system",
  textSize: "comfortable",
  uiDensity: "comfortable",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readOption<T extends string>(
  value: unknown,
  options: readonly AppearanceOption<T>[],
  fallback: T,
): T {
  return typeof value === "string" && options.some((option) => option.value === value)
    ? value as T
    : fallback;
}

export function parseAppearanceSettings(value: unknown): AppearanceSettings {
  if (!isRecord(value)) return defaultAppearanceSettings;

  return {
    colorScheme: readOption(value.colorScheme, colorSchemeOptions, defaultAppearanceSettings.colorScheme),
    fontChoice: readOption(value.fontChoice, fontChoiceOptions, defaultAppearanceSettings.fontChoice),
    textSize: readOption(value.textSize, textSizeOptions, defaultAppearanceSettings.textSize),
    uiDensity: readOption(value.uiDensity, uiDensityOptions, defaultAppearanceSettings.uiDensity),
  };
}

export function applyAppearanceSettings(
  settings: AppearanceSettings,
  root: HTMLElement = document.documentElement,
): void {
  root.dataset.colorScheme = settings.colorScheme;
  root.dataset.fontChoice = settings.fontChoice;
  root.dataset.textSize = settings.textSize;
  root.dataset.uiDensity = settings.uiDensity;
}
