import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const globalCss = readFileSync(
  new URL("../src/styles/global.css", import.meta.url),
  "utf8",
);

function cssRule(selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const match = globalCss.match(
    new RegExp(`${escapedSelector}\\s*\\{([^}]+)\\}`, "u"),
  );
  if (!match) throw new Error(`Missing CSS rule for ${selector}.`);
  return match[1];
}

describe("PWA update toast styling", () => {
  it("uses a compact fixed desktop card instead of the removed full-width banner", () => {
    const toastRule = cssRule(".pwa-update-toast");

    expect(toastRule).toContain("position: fixed;");
    expect(toastRule).toContain("right: max(1rem");
    expect(toastRule).toContain("bottom: calc(5rem");
    expect(toastRule).toContain("width: min(22rem, calc(100vw - 2rem));");
    expect(toastRule).toContain("padding: 0.85rem 0.95rem;");
    expect(toastRule).toContain("border-radius: var(--radius-md);");
    expect(toastRule).toContain("box-shadow: var(--shadow);");
    expect(globalCss).not.toContain(".pwa-update-banner");
  });

  it("keeps touch targets, wrapping actions, and visible keyboard focus", () => {
    expect(cssRule(".pwa-update-toast-actions"))
      .toContain("flex-wrap: wrap;");
    expect(cssRule(".pwa-update-toast-actions .button"))
      .toContain("min-height: 2.5rem;");
    expect(cssRule(".pwa-update-toast-actions .button:focus-visible"))
      .toContain("outline: 3px solid var(--blue-600);");
  });

  it("fits the mobile viewport with safe-area-aware horizontal margins", () => {
    expect(globalCss).toMatch(
      /@media \(max-width: 760px\)[\s\S]*?\.pwa-update-toast\s*\{[^}]*left: max\(1rem, env\(safe-area-inset-left, 0px\)\);[^}]*width: auto;/u,
    );
    expect(globalCss).toMatch(
      /\.pwa-update-toast\s*\{[^}]*bottom: calc\(6\.5rem \+ env\(safe-area-inset-bottom, 0px\)\);/u,
    );
  });
});
