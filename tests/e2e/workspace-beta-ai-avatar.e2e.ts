import { expect, test } from "@playwright/test";

test("AI Studio header and assistant mode remain visually separated", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");
  const studio = page.locator(".workspace-beta-phase-workspace");
  const header = studio.locator(".workspace-beta-functional-panel-header");
  await expect(header.getByRole("heading", { name: "AI Studio - Workspace" })).toBeVisible();
  await expect(header.getByRole("button", { name: "Compare AI options" })).toBeVisible();

  await studio.getByRole("button", { name: /StudyApp AI Assistant Available/u }).click();
  const frame = page.frameLocator('iframe[name="studyapp-workspace-workspace"]');
  await expect(frame.getByRole("heading", { name: "AI Assistant", exact: true })).toBeVisible();
  const headerBottom = await header.evaluate((element) => element.getBoundingClientRect().bottom);
  const contentTop = await studio.locator(".workspace-beta-workspace-upper").evaluate((element) => element.getBoundingClientRect().top);
  expect(contentTop).toBeGreaterThanOrEqual(headerBottom);
});
