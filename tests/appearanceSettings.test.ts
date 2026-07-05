import { describe, expect, it } from "vitest";
import {
  defaultAppearanceSettings,
  parseAppearanceSettings,
} from "../src/features/appearance/appearanceSettings";

describe("parseAppearanceSettings", () => {
  it("returns warm defaults for non-object values", () => {
    expect(parseAppearanceSettings(null)).toEqual(defaultAppearanceSettings);
    expect(parseAppearanceSettings("blue")).toEqual(defaultAppearanceSettings);
    expect(defaultAppearanceSettings).toMatchObject({
      colorScheme: "amber",
      backgroundTone: "warm",
    });
  });

  it("keeps supported appearance options", () => {
    expect(parseAppearanceSettings({
      colorScheme: "purple",
      backgroundTone: "sand",
      fontChoice: "serif",
      textSize: "large",
      uiDensity: "spacious",
    })).toEqual({
      colorScheme: "purple",
      backgroundTone: "sand",
      fontChoice: "serif",
      textSize: "large",
      uiDensity: "spacious",
    });
  });

  it("falls back per field for unsupported options", () => {
    expect(parseAppearanceSettings({
      colorScheme: "neon",
      backgroundTone: "blacklight",
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
