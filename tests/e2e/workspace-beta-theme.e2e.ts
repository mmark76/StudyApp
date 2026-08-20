import { expect, test } from "@playwright/test";

test("Workspace BETA toggles light and dark presentation across its live panels", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  const sourcesFrame = page.frame({ name: "studyapp-workspace-sources" });
  const practiceFrame = page.frame({ name: "studyapp-workspace-practice" });
  const aiFrame = page.frame({ name: "studyapp-workspace-ai" });
  if (!sourcesFrame || !practiceFrame || !aiFrame) {
    throw new Error("Workspace frames were not available");
  }

  await expect(page.getByRole("button", { name: "Switch to dark mode" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.workspaceTheme)).toBe("light");

  await page.getByRole("button", { name: "Switch to dark mode" }).click();

  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.workspaceTheme)).toBe("dark");
  await expect.poll(() => sourcesFrame.evaluate(() => document.documentElement.dataset.workspaceTheme)).toBe("dark");
  await expect.poll(() => practiceFrame.evaluate(() => document.documentElement.dataset.workspaceTheme)).toBe("dark");
  await expect.poll(() => aiFrame.evaluate(() => document.documentElement.dataset.workspaceTheme)).toBe("dark");
  await expect(page.getByRole("button", { name: "Switch to light mode" })).toBeVisible();

  await page.reload();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.workspaceTheme)).toBe("dark");

  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.workspaceTheme)).toBe("light");
});

test("Workspace BETA shows the standard StudyApp update notification", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  await page.evaluate(() => {
    window.__STUDYAPP_E2E_PWA_UPDATE__?.show("success");
  });

  const toast = page.locator(".pwa-update-toast");
  await expect(toast).toBeVisible();
  await expect(toast.getByRole("heading", { name: "Update available" })).toBeVisible();
  await expect(toast.getByRole("button", { name: "Update" })).toBeVisible();
  await expect(toast.getByRole("button", { name: "Later" })).toBeVisible();

  await toast.getByRole("button", { name: "Later" }).click();
  await expect(toast).toHaveCount(0);
});
