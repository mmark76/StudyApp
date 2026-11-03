import { expect, test } from "@playwright/test";

test("Workspace BETA desktop renders three equal-width columns", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");
  const panels = page.locator(".workspace-beta-phase-one-grid > .workspace-beta-panel");
  await expect(panels).toHaveCount(3);
  const widths = await panels.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().width));
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(2);

  await page.getByRole("button", { name: "Hide tools", exact: true }).click();
  const hiddenWidths = await panels.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().width));
  expect(Math.abs(hiddenWidths[0] - hiddenWidths[1])).toBeLessThanOrEqual(2);
  expect(hiddenWidths[2]).toBeLessThan(hiddenWidths[0]);
});
