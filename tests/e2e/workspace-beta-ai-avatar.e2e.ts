import { expect, test } from "@playwright/test";
test("AI Studio aligns with Practice and displays the assistant identity below the divider", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");
  const header = page.locator(".workspace-beta-panel-studio .workspace-beta-functional-panel-header");
  await expect(header.getByRole("heading", { name: "AI Studio" })).toBeVisible();
  await expect(header.getByRole("button", { name: "Compare AI options" })).toBeVisible();
  await expect(header.getByRole("button", { name: "Back to AI Options" })).toBeVisible();
  await expect(page.locator(".workspace-beta-panel-studio > .workspace-beta-ai-launch-row")).toBeVisible();
  const studio = page.locator(".workspace-beta-panel-studio");
  const avatar = studio.locator(":scope > .workspace-beta-ai-launch-row");
  const headerBottom = await header.evaluate((el) => el.getBoundingClientRect().bottom);
  const avatarTop = await avatar.evaluate((el) => el.getBoundingClientRect().top);
  expect(avatarTop).toBeGreaterThanOrEqual(headerBottom);
  const identityImage = await avatar.evaluate((el) => getComputedStyle(el, "::before").backgroundImage);
  expect(identityImage).toContain("study-assistant-avatar.svg");

  const ai = page.frameLocator('iframe[name="studyapp-workspace-ai"]');
  await expect(ai.getByRole("link", { name: "Open StudyApp AI Assistant" })).toBeVisible();
  await ai.getByRole("link", { name: "Sign in with ChatGPT" }).click();
  await header.getByRole("button", { name: "Back to AI Options" }).click();
  await expect(ai.getByText("1. Custom GPT / Plugin")).toBeVisible();
});
