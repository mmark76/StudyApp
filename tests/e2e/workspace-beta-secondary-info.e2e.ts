import { expect, test } from "@playwright/test";

test("Workspace BETA opens secondary AI information in a modal without leaving the workspace", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  const ai = page.frameLocator('iframe[name="studyapp-workspace-ai"]');
  await expect(ai.getByRole("heading", { name: "AI Assistant", exact: true })).toBeVisible();

  await ai.getByRole("link", { name: "Compare AI options" }).click();

  const modal = page.locator(".workspace-beta-info-modal");
  const modalFrame = page.frameLocator('iframe[name="studyapp-workspace-info-modal"]');
  await expect(modal).toBeVisible();
  await expect(page.getByRole("heading", { name: "Compare AI options", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close" })).toBeFocused();
  await expect(modalFrame.getByRole("heading", { name: "Compare AI options", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/#\/workspace-beta$/u);
  await expect(page.locator('iframe[name^="studyapp-workspace-"]').filter({ hasNot: page.locator('[name="studyapp-workspace-info-modal"]') })).toHaveCount(3);

  await page.getByRole("button", { name: "Close" }).click();
  await expect(modal).toHaveCount(0);
  await expect(ai.getByRole("heading", { name: "AI Assistant", exact: true })).toBeVisible();

  await ai.getByRole("link", { name: "Step-by-step StudyApp instructions" }).click();
  await expect(modal).toBeVisible();
  await expect(page.getByRole("heading", { name: "StudyApp instructions", exact: true })).toBeVisible();
  await expect(modalFrame.getByRole("heading", { name: /How to add AI-generated study material/u })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
  await expect(page).toHaveURL(/#\/workspace-beta$/u);
});

test("Workspace BETA opens Important Info in the same modal pattern", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  const infoMenu = page.locator(".workspace-beta-info-menu");
  await infoMenu.locator("summary").click();
  await page.getByRole("link", { name: "Important Info" }).click();

  await expect(page.locator(".workspace-beta-info-modal")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Important Info", exact: true })).toBeVisible();
  await expect(page.frameLocator('iframe[name="studyapp-workspace-info-modal"]').locator("main")).toBeVisible();
  await expect(page).toHaveURL(/#\/workspace-beta$/u);
});

test("Workspace BETA keeps the imported flashcard list hidden while flashcard study actions remain available", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  const practice = page.frameLocator('iframe[name="studyapp-workspace-practice"]');
  await expect(practice.getByRole("heading", { name: "Learn" })).toBeVisible();
  await expect(practice.getByRole("link", { name: "Practice with flashcards" })).toBeVisible();
  await expect(practice.getByRole("button", { name: "Import Flashcards CSV" })).toBeVisible();
  await expect(practice.locator('[aria-labelledby="imported-practice-chapters-title"]')).toBeVisible();
  await expect(practice.locator('[aria-labelledby="imported-flashcards-title"]')).toBeHidden();
});
