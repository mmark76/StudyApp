import { expect, test } from "@playwright/test";

test("Workspace BETA keeps redundant AI navigation controls hidden", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  const ai = page.frameLocator('iframe[name="studyapp-workspace-ai"]');
  await expect(ai.getByRole("heading", { name: "AI Assistant", exact: true })).toBeVisible();
  await expect(ai.getByRole("link", { name: "Back to Home" })).toBeHidden();
  await expect(page.locator(".workspace-beta-panel-studio .workspace-beta-panel-tools")).toBeHidden();
});
