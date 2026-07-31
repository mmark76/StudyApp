import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const assistantCss = readFileSync(
  new URL("../src/styles/assistant.css", import.meta.url),
  "utf8",
);
const assistantModesCss = readFileSync(
  new URL("../src/styles/assistantModes.css", import.meta.url),
  "utf8",
);
const assistantServiceStatusCss = readFileSync(
  new URL("../src/styles/assistantServiceStatus.css", import.meta.url),
  "utf8",
);

function cssRule(source: string, selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const match = source.match(
    new RegExp(`${escapedSelector}\\s*\\{([^}]+)\\}`, "u"),
  );
  if (!match) throw new Error(`Missing CSS rule for ${selector}.`);
  return match[1];
}

function relativeLuminance(hexColor: string): number {
  const channels = hexColor
    .slice(1)
    .match(/.{2}/gu)
    ?.map((channel) => Number.parseInt(channel, 16) / 255);
  if (!channels || channels.length !== 3) {
    throw new Error(`Expected a six-digit hex color, received ${hexColor}.`);
  }

  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("AI Assistant presentation", () => {
  it("uses the softer teal palette with AA contrast in every enabled state", () => {
    const panelRule = cssRule(assistantCss, ".assistant-panel");
    expect(panelRule).toContain("--assistant-secondary-action-bg: #c8e8e3;");
    expect(panelRule).toContain(
      "--assistant-secondary-action-bg-hover: #b4ddd6;",
    );
    expect(panelRule).toContain(
      "--assistant-secondary-action-bg-active: #74bfb4;",
    );
    expect(panelRule).toContain("--assistant-secondary-action-text: #164e4a;");
    expect(panelRule).toContain(
      "--assistant-secondary-action-active-text: #154944;",
    );
    expect(panelRule).toContain("--assistant-secondary-action-focus: #237f78;");

    expect(contrastRatio("#164e4a", "#c8e8e3")).toBeCloseTo(7.2467, 4);
    expect(contrastRatio("#164e4a", "#b4ddd6")).toBeCloseTo(6.4129, 4);
    expect(contrastRatio("#154944", "#74bfb4")).toBeCloseTo(4.7641, 4);
    expect(contrastRatio("#237f78", "#fffaf0")).toBeCloseTo(4.61, 2);
  });

  it("keeps visible focus styles for dialog and mode controls", () => {
    expect(assistantCss).toContain(".assistant-close:focus-visible");
    expect(assistantCss).toContain(".assistant-back:focus-visible");
    expect(assistantCss).toContain(".assistant-start-link:focus-visible");
    expect(assistantCss).toContain(
      ".assistant-typewriter-skip:focus-visible",
    );
    expect(cssRule(assistantModesCss, ".assistant-mode-card:focus-visible"))
      .toContain("outline: 3px solid");
  });

  it("reserves the final welcome layout and disables cursor motion when requested", () => {
    expect(cssRule(assistantCss, ".assistant-typewriter-skip"))
      .toContain("display: grid;");
    expect(cssRule(assistantCss, ".assistant-typewriter-reserve"))
      .toContain("visibility: hidden;");
    expect(cssRule(
      assistantCss,
      ".assistant-typewriter-reserve,\n.assistant-typewriter-visual",
    ))
      .toContain("grid-row: 1;");
    expect(cssRule(assistantCss, ".assistant-typewriter-cursor"))
      .toContain("animation: assistant-typewriter-cursor");
    expect(assistantCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(assistantCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.assistant-typewriter-cursor\s*\{[\s\S]*?display: none;/u,
    );
  });

  it("keeps the Start effect stable, brief, and reduced-motion safe", () => {
    expect(cssRule(assistantCss, ".assistant-start-link"))
      .toContain("min-inline-size: 7.5rem;");
    expect(cssRule(assistantCss, ".assistant-start-link.is-opening"))
      .toContain("pointer-events: none;");
    expect(cssRule(assistantCss, ".assistant-start-spinner"))
      .toContain("animation: assistant-start-spinner 700ms linear infinite;");
    expect(cssRule(assistantCss, ".assistant-avatar-hero.is-activating"))
      .toContain("animation: assistant-avatar-activation 500ms ease-out;");
    expect(assistantCss).toContain("@keyframes assistant-start-spinner");
    expect(assistantCss).toContain("@keyframes assistant-avatar-activation");
    expect(assistantCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.assistant-avatar-hero\.is-activating,[\s\S]*?\.assistant-start-spinner\s*\{[\s\S]*?animation: none;[\s\S]*?transform: none;/u,
    );
  });

  it("hides only the launcher copy on mobile and keeps its status visuals visible", () => {
    const combinedCss = `${assistantCss}\n${assistantServiceStatusCss}`;

    expect(assistantCss).toMatch(
      /@media \(max-width: 760px\)[\s\S]*?\.assistant-launch-button \.assistant-launch-copy\s*\{\s*display: none;\s*\}/u,
    );
    expect(assistantCss).not.toMatch(
      /\.assistant-launch-button\s+span\s*\{\s*display: none;\s*\}/u,
    );
    expect(combinedCss).not.toMatch(
      /\.assistant-launch-avatar-wrap\s*\{[^}]*display:\s*none;/u,
    );
    expect(combinedCss).not.toMatch(
      /\.assistant-launch-avatar\s*\{[^}]*display:\s*none;/u,
    );
    expect(assistantServiceStatusCss).toMatch(
      /@media \(max-width: 760px\)[\s\S]*?\.assistant-launch-button \.assistant-service-dot\s*\{\s*display: inline-block;\s*\}/u,
    );
  });

  it("contains no styles from the removed workflow", () => {
    const combinedCss = `${assistantCss}\n${assistantModesCss}`;
    expect(combinedCss).not.toContain("assistant-task-card");
    expect(combinedCss).not.toContain("assistant-prompt-preview");
    expect(combinedCss).not.toContain("assistant-import");
    expect(combinedCss).not.toContain("assistant-onboarding-steps");
    expect(combinedCss).not.toContain("assistant-privacy-note");
    expect(cssRule(assistantCss, ".assistant-intro-copy"))
      .toContain("margin-bottom: 0;");
  });
});
