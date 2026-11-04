import { expect, test } from "@playwright/test";

test("Workspace BETA keeps three functional columns and existing routes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");
  await expect(page.locator(".workspace-beta-header")).toBeVisible();
  await expect(page.locator(".app-header, .app-footer")).toHaveCount(0);
  await expect(page.locator(".workspace-beta-phase-one-grid > .workspace-beta-panel")).toHaveCount(3);
  await expect(page.locator('iframe[name="studyapp-workspace-sources"]')).toBeVisible();

  const progressTool = page.getByRole("button", { name: "Progress", exact: true });
  await expect(progressTool).toContainText("View results, backup, restore and archive.");
  await progressTool.click();
  await expect(page.locator('iframe[name="studyapp-workspace-workspace"]')).toHaveAttribute("src", "/#/progress");
  await expect(page.getByText("Backup, Restore & Archive", { exact: true })).toBeVisible();
});

test("Workspace BETA keeps the release download label compact", async ({ page }) => {
  await page.goto("/#/workspace-beta");
  const downloads = page.locator(".workspace-beta-header .workspace-beta-local-download");
  await expect(downloads).toHaveCount(2);
  for (const download of await downloads.all()) {
    const style = await download.evaluate((element) => ({
      fontSize: parseFloat(getComputedStyle(element).fontSize),
      fontWeight: getComputedStyle(element).fontWeight,
    }));
    expect(style.fontSize).toBeLessThanOrEqual(12);
    expect(style.fontWeight).toBe("600");
  }
});

test("Workspace BETA keeps legal, feedback and version information accessible", async ({ page }) => {
  await page.goto("/#/workspace-beta");
  const info = page.locator(".workspace-beta-info-menu");
  await info.locator("summary").click();
  await expect(info.getByRole("link", { name: "Important Info" })).toBeVisible();
  await expect(info.getByRole("link", { name: "Feedback" })).toHaveAttribute("href", /^mailto:/u);
  await expect(info.getByRole("link", { name: "License" })).toBeVisible();
  await expect(page.locator(".workspace-beta-global-footer")).toContainText("© 2026 Markellos Markides. All rights reserved.");
  await expect(page.locator(".workspace-beta-footer-version")).toContainText(/^StudyApp BETA · v/u);
});

test("Workspace BETA language sync follows the three mobile panels", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/workspace-beta");
  await page.getByRole("button", { name: "GR", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Πηγές & Υλικό", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Χώρος εργασίας", exact: true }).click();
  await expect(page.getByRole("heading", { name: "AI Studio - Χώρος εργασίας", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Εργαλεία", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Εργαλεία με υποστήριξη AI", exact: true })).toBeVisible();
});
