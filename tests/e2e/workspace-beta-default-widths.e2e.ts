import { expect, test } from "@playwright/test";

test("Workspace BETA desktop renders the approved three-column proportions", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");
  const panels = page.locator(".workspace-beta-phase-one-grid > .workspace-beta-panel");
  await expect(panels).toHaveCount(3);
  const widths = await panels.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().width));
  expect(widths[1]).toBeGreaterThan(widths[0]);
  expect(Math.abs(widths[0] - widths[2])).toBeLessThanOrEqual(2);
});
