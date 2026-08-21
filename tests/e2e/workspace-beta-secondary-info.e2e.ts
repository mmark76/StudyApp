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
  await expect(page.getByRole("button", { name: "Close" })).toBeVisible();
  await expect(modalFrame.getByRole("heading", { name: "Compare AI options", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/#\/workspace-beta$/u);
  await expect(page.locator(".workspace-beta-functional-panel > .workspace-beta-frame-wrap > iframe.workspace-beta-frame")).toHaveCount(3);

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

test("Workspace BETA opens Settings in a modal and applies appearance changes without leaving the workspace", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  await page.getByRole("link", { name: "Settings", exact: true }).click();

  const modal = page.locator(".workspace-beta-info-modal");
  const modalFrame = page.frameLocator('iframe[name="studyapp-workspace-info-modal"]');
  await expect(modal).toBeVisible();
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  await expect(modalFrame.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/#\/workspace-beta$/u);
  await expect(page.locator(".workspace-beta-functional-panel > .workspace-beta-frame-wrap > iframe.workspace-beta-frame")).toHaveCount(3);

  await modalFrame.getByLabel("Accent colour").selectOption("blue");
  await expect.poll(async () => page.locator("html").getAttribute("data-color-scheme")).toBe("blue");

  await page.getByRole("button", { name: "Close" }).click();
  await expect(modal).toHaveCount(0);
  await expect(page).toHaveURL(/#\/workspace-beta$/u);
});

test("Workspace BETA keeps practice-content management in Sources while study actions remain in Practice", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  const sources = page.frameLocator('iframe[name="studyapp-workspace-sources"]');
  const practice = page.frameLocator('iframe[name="studyapp-workspace-practice"]');

  await expect(practice.getByRole("heading", { name: "Learn" })).toBeVisible();
  await expect(practice.getByRole("link", { name: "Practice with flashcards" })).toBeVisible();
  await expect(practice.getByRole("button", { name: "Import Flashcards CSV" })).toHaveCount(0);

  const practiceHeading = sources.locator("#practice-content.page-heading");
  const manager = sources.getByRole("region", { name: "Manage practice content" });
  const options = manager.getByRole("group", { name: "Practice content options" });
  await expect(practiceHeading.locator(".eyebrow")).toHaveText("PRACTICE CONTENT");
  await expect(practiceHeading.getByRole("heading", {
    level: 2,
    name: "Manage practice content",
  })).toBeVisible();
  await expect(practiceHeading.getByText(
    "Add, import or manage your flashcards and practice chapters.",
    { exact: true },
  )).toBeVisible();
  await expect(practiceHeading.getByText(
    "Import the Chapters CSV first, then the Flashcards CSV.",
    { exact: true },
  )).toBeVisible();
  await expect(manager).not.toHaveClass(/\bcontent-panel\b/u);
  await expect(sources.getByText(
    "Study content is stored locally in this browser and device.",
    { exact: true },
  )).toHaveCount(0);
  await expect(sources.getByText("Learn more", { exact: true })).toHaveCount(0);
  await expect(sources.locator(".storage-notice")).toHaveCount(0);
  await expect(sources.getByText(
    "New content? Import the Chapters CSV first, then the Flashcards CSV.",
    { exact: true },
  )).toHaveCount(0);
  await expect(options.locator(".practice-content-option")).toHaveCount(2);
  await expect(options.locator(".practice-content-option").nth(0).getByRole(
    "heading",
    { level: 3, name: "Practice Chapters" },
  )).toBeVisible();
  await expect(options.locator(".practice-content-option").nth(1).getByRole(
    "heading",
    { level: 3, name: "Flashcards" },
  )).toBeVisible();
  await expect.poll(() => practiceHeading.evaluate((heading) => {
    const managerElement = document.querySelector(".practice-content-manager");
    return Boolean(managerElement
      && (heading.compareDocumentPosition(managerElement) & Node.DOCUMENT_POSITION_FOLLOWING));
  })).toBe(true);

  const surfaces = await manager.evaluate((element) => {
    const managerStyles = getComputedStyle(element);
    const guidance = document.querySelector<HTMLElement>(
      ".practice-content-page-import-order",
    );
    if (!guidance) throw new Error("Practice guidance is missing.");
    const guidanceStyles = getComputedStyle(guidance);
    return {
      guidanceBackground: guidanceStyles.backgroundColor,
      guidanceBorder: guidanceStyles.borderLeftWidth,
      guidancePadding: guidanceStyles.paddingLeft,
      managerBorder: managerStyles.borderTopWidth,
      managerShadow: managerStyles.boxShadow,
    };
  });
  expect(surfaces).toEqual({
    guidanceBackground: "rgba(0, 0, 0, 0)",
    guidanceBorder: "0px",
    guidancePadding: "0px",
    managerBorder: "0px",
    managerShadow: "none",
  });

  await expect(manager.getByRole("button", { name: "Import Flashcards CSV" })).toBeVisible();
  await expect(sources.locator('[aria-labelledby="imported-practice-chapters-title"]')).toBeVisible();
  await expect(sources.locator('[aria-labelledby="imported-flashcards-title"]')).toBeHidden();
});
