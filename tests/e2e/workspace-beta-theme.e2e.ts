import { expect, test } from "@playwright/test";

function luminance(rgb: string): number {
  const channels = rgb.match(/[\d.]+/gu)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) throw new Error(`Unsupported color: ${rgb}`);
  const linear = channels.map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2]);
}

function contrastRatio(foreground: string, background: string): number {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

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

test("Phase 1 cards and Agent status retain readable contrast in dark mode", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();

  const targets = [
    page.locator(".workspace-beta-ai-option").first(),
    page.locator(".workspace-beta-ai-option:disabled").first(),
    page.locator(".workspace-beta-agent-bar"),
    page.locator(".workspace-beta-tools-grid > button").first(),
  ];
  for (const target of targets) {
    const colors = await target.evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      foreground: getComputedStyle(element).color,
    }));
    expect(contrastRatio(colors.foreground, colors.background)).toBeGreaterThanOrEqual(4.5);
  }

  await expect(page.locator(".workspace-beta-tools-avatar img")).toBeVisible();
});
