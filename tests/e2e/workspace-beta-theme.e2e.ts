import { expect, test } from "@playwright/test";

test("Workspace BETA propagates light and dark presentation to mounted content", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");
  await expect(page.locator('iframe[name="studyapp-workspace-sources"]')).toBeAttached();
  const sources = page.frame({ name: "studyapp-workspace-sources" });
  if (!sources) throw new Error("Sources frame was not available");
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.workspaceTheme)).toBe("light");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.workspaceTheme)).toBe("dark");
  await expect.poll(() => sources.evaluate(() => document.documentElement.dataset.workspaceTheme)).toBe("dark");

  await page.getByRole("button", { name: "Learning Goals", exact: true }).click();
  await expect(page.locator('iframe[name="studyapp-workspace-workspace"]')).toBeAttached();
  const workspace = page.frame({ name: "studyapp-workspace-workspace" });
  if (!workspace) throw new Error("Workspace frame was not available");
  await expect.poll(() => workspace.evaluate(() => document.documentElement.dataset.workspaceTheme)).toBe("dark");
  await page.reload();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.workspaceTheme)).toBe("dark");
});

test("Workspace BETA shows the standard StudyApp update notification", async ({ page }) => {
  await page.goto("/#/workspace-beta");
  await page.evaluate(() => window.__STUDYAPP_E2E_PWA_UPDATE__?.show("success"));
  const toast = page.locator(".pwa-update-toast");
  await expect(toast.getByRole("heading", { name: "Update available" })).toBeVisible();
  await toast.getByRole("button", { name: "Later" }).click();
  await expect(toast).toHaveCount(0);
});
