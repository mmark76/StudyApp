import { expect, test } from "@playwright/test";
test("AI Studio follows the Practice header layout without a separate assistant block", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");
  const header = page.locator(".workspace-beta-panel-studio .workspace-beta-functional-panel-header");
  await expect(header.getByRole("heading", { name: "AI Studio" })).toBeVisible();
  await expect(header.getByRole("button", { name: "Compare AI options" })).toBeVisible();
  await expect(header.getByRole("button", { name: "Back to AI Options" })).toBeVisible();
  await expect(page.locator(".workspace-beta-ai-launch-row")).toHaveCount(0);
  const ai = page.frameLocator('iframe[name="studyapp-workspace-ai"]');
  await expect(ai.getByRole("link", { name: "Open StudyApp AI Assistant" })).toBeVisible();
  await ai.getByRole("link", { name: "Chat with ChatGPT" }).click();
  await header.getByRole("button", { name: "Back to AI Options" }).click();
  await expect(ai.getByText("1. Custom GPT / Plugin")).toBeVisible();
});
