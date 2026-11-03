import { expect, test } from "@playwright/test";

test("three column headers retain shared actions and structure", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");
  const panels = page.locator(".workspace-beta-phase-one-grid > .workspace-beta-panel");
  await expect(panels).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Back to Sources & Materials home" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Compare AI options" })).toBeVisible();
  await expect(page.locator(".workspace-beta-panel-header .workspace-beta-column-toggle")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Hide AI Agent panel" })).toBeVisible();

  const headerBottoms = await page.locator(".workspace-beta-phase-one-grid > .workspace-beta-panel > .workspace-beta-panel-header")
    .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().bottom));
  expect(Math.max(...headerBottoms) - Math.min(...headerBottoms)).toBeLessThanOrEqual(1);

  await page.getByRole("button", { name: "Learning Goals", exact: true }).click();
  await expect(page.getByRole("button", { name: "Back to AI options", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Compare AI options" }).click();
  await expect(page.locator(".workspace-beta-info-modal")).toBeVisible();
});
