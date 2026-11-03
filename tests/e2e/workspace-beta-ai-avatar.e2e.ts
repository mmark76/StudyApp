import { expect, test } from "@playwright/test";

test("AI Studio header and assistant connection card remain visually separated", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");
  const studio = page.locator(".workspace-beta-phase-workspace");
  const header = studio.locator(".workspace-beta-functional-panel-header");
  await expect(header.getByRole("heading", { name: "AI Studio - Workspace" })).toBeVisible();
  await expect(header.getByRole("button", { name: "Compare AI options" })).toBeVisible();

  const assistantCard = studio.getByRole("link", { name: /StudyApp AI Assistant/u });
  await expect(assistantCard).toHaveAttribute(
    "href",
    "https://chatgpt.com/g/g-6a6b687029608191af7b26717f0a2072-studyapp-ai-assistant",
  );
  await expect(assistantCard).toContainText("Open the dedicated assistant in ChatGPT.");
  const headerBottom = await header.evaluate((element) => element.getBoundingClientRect().bottom);
  const contentTop = await studio.locator(".workspace-beta-ai-options").evaluate((element) => element.getBoundingClientRect().top);
  expect(contentTop).toBeGreaterThanOrEqual(headerBottom);
});
