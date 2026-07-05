import { describe, expect, it } from "vitest";
import {
  defaultAppearanceSettings,
  parseAppearanceSettings,
} from "../src/features/appearance/appearanceSettings";

describe("parseAppearanceSettings", () => {
  it("returns defaults for non-object values", () => {
    expect(parseAppearanceSettings(null)).toEqual(defaultAppearanceSettings);
    expect(parseAppearanceSettings("blue")).toEqual(defaultAppearanceSettings);
  });

  it("keeps supported appearance options", () => {
    expect(parseAppearanceSettings({
      colorScheme: "purple",
      fontChoice: "serif",
      textSize: "large",
      uiDensity: "spacious",
    })).toEqual({
      colorScheme: "purple",
      fontChoice: "serif",
      textSize: "large",
      uiDensity: "spacious",
    });
  });

  it("falls back per field for unsupported options", () => {
    expect(parseAppearanceSettings({
      colorScheme: "neon",
      fontChoice: "mono",
      textSize: "tiny",
      uiDensity: "comfortable",
    })).toEqual({
      ...defaultAppearanceSettings,
      fontChoice: "mono",
      uiDensity: "comfortable",
    });
  });
});
