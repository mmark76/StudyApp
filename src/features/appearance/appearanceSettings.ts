export const APPEARANCE_SETTINGS_KEY = "appearance-settings";

export type ColorScheme = "amber" | "blue" | "emerald" | "purple" | "slate";
export type BackgroundTone = "warm" | "paper" | "sand" | "rose" | "sky";
export type FontChoice = "system" | "serif" | "rounded" | "mono";
export type TextSize = "compact" | "comfortable" | "large" | "extra-large";
export type UiDensity = "compact" | "comfortable" | "spacious";

export interface AppearanceSettings {
  colorScheme: ColorScheme;
  backgroundTone: BackgroundTone;
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
  { value: "amber", label: "Amber", description: "The default warm accent theme for reading and revision." },
  { value: "blue", label: "Blue", description: "A calm classic study accent theme." },
  { value: "emerald", label: "Emerald", description: "A fresh green accent theme for long study sessions." },
  { value: "purple", label: "Purple", description: "A deeper focus theme with violet accents." },
  { value: "slate", label: "Slate", description: "A quiet neutral accent theme with minimal colour." },
] as const satisfies readonly AppearanceOption<ColorScheme>[];

export const backgroundToneOptions = [
  { value: "warm", label: "Warm cream", description: "The default warm background for comfortable reading." },
  { value: "paper", label: "Paper white", description: "A clean white workspace with subtle blue light." },
  { value: "sand", label: "Sand", description: "A soft beige background for a book-like feel." },
  { value: "rose", label: "Soft rose", description: "A gentle rose-tinted background for relaxed review." },
  { value: "sky", label: "Sky", description: "A light blue background for a cooler study space." },
] as const satisfies readonly AppearanceOption<BackgroundTone>[];

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
  colorScheme: "amber",
  backgroundTone: "warm",
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
    backgroundTone: readOption(value.backgroundTone, backgroundToneOptions, defaultAppearanceSettings.backgroundTone),
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
  root.dataset.backgroundTone = settings.backgroundTone;
  root.dataset.fontChoice = settings.fontChoice;
  root.dataset.textSize = settings.textSize;
  root.dataset.uiDensity = settings.uiDensity;
}
