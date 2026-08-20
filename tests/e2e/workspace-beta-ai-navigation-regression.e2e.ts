import { expect, test } from "@playwright/test";

test("Workspace BETA keeps the embedded AI Back to Home control hidden", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  const ai = page.frameLocator('iframe[name="studyapp-workspace-ai"]');
  await expect(ai.getByRole("heading", { name: "AI Assistant", exact: true })).toBeVisible();
  await expect(ai.getByRole("link", { name: "Back to Home" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Go to AI options" })).toBeVisible();
});
