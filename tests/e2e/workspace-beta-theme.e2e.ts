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
  const lightMode = page.getByRole("button", { name: "Switch to light mode" });
  if (await lightMode.count()) await lightMode.click();
  await expect(page.locator("html")).toHaveAttribute("data-workspace-theme", "light");
  const sources = page.frameLocator('iframe[name="studyapp-workspace-sources"]');
  const sourceCards = sources.locator(".dashboard-action-card");
  const manualStructuring = sources.getByRole("link", { name: "Manual Structuring - import structured files" });
  const splitPdf = sources.getByRole("link", { name: "Split PDF Tool" });
  const unavailableStructuring = sources.getByRole("button", { name: "AI-Assisted Structuring — Under construction — Not available yet" });
  const aiCards = page.locator(".workspace-beta-ai-option");
  const toolCards = page.locator(".workspace-beta-tools-grid > button");
  const lightSourceBackgrounds = await sourceCards.evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).backgroundColor),
  );
  expect(new Set(lightSourceBackgrounds).size).toBe(2);
  expect(lightSourceBackgrounds).not.toContain("rgba(0, 0, 0, 0)");
  await expect(manualStructuring).toHaveCSS("background-color", "rgb(234, 215, 203)");
  await expect(splitPdf).toHaveCSS("background-color", "rgb(217, 231, 241)");
  // The E2E loopback server models StudyApp Local, whose warning surface stays pink.
  await expect(unavailableStructuring).toHaveCSS("background-color", "rgb(245, 231, 232)");
  await expect(unavailableStructuring).toHaveCSS("color", "rgb(180, 35, 46)");
  const lightActionColors = await Promise.all([manualStructuring, splitPdf].map((action) => action.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    foreground: getComputedStyle(element).color,
  }))));
  for (const colors of lightActionColors) {
    expect(contrastRatio(colors.foreground, colors.background)).toBeGreaterThanOrEqual(4.5);
  }
  const lightUnavailableColors = await unavailableStructuring.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    foreground: getComputedStyle(element).color,
  }));
  expect(contrastRatio(lightUnavailableColors.foreground, lightUnavailableColors.background)).toBeGreaterThanOrEqual(4.5);
  const lightAiBackgrounds = await aiCards.evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).backgroundColor),
  );
  expect(new Set(lightAiBackgrounds).size).toBe(4);
  await expect(aiCards.first().locator(".workspace-beta-availability.is-available")).toHaveCSS("color", "rgb(38, 115, 77)");
  await expect(page.locator(".workspace-beta-agent-bar .workspace-beta-availability.is-unavailable")).toHaveCSS("color", "rgb(198, 40, 40)");
  const lightBackgrounds = await toolCards.evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).backgroundColor),
  );
  expect(new Set(lightBackgrounds).size).toBe(8);
  await page.getByRole("button", { name: "Switch to dark mode" }).click();

  await expect(manualStructuring).toHaveCSS("background-color", "rgb(92, 65, 53)");
  await expect(splitPdf).toHaveCSS("background-color", "rgb(39, 68, 87)");
  await expect(unavailableStructuring).toHaveCSS("background-color", "rgb(58, 40, 42)");
  await expect(unavailableStructuring).toHaveCSS("color", "rgb(255, 157, 163)");

  const targets = [
    aiCards.first(),
    page.locator(".workspace-beta-ai-option:disabled").first(),
    page.locator(".workspace-beta-agent-bar"),
    page.locator(".workspace-beta-tools-avatar span"),
  ];
  for (const target of targets) {
    const colors = await target.evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      foreground: getComputedStyle(element).color,
    }));
    expect(contrastRatio(colors.foreground, colors.background)).toBeGreaterThanOrEqual(4.5);
  }
  await expect(aiCards.first().locator(".workspace-beta-availability.is-available")).toHaveCSS("color", "rgb(142, 211, 168)");
  await expect(page.locator(".workspace-beta-agent-bar .workspace-beta-availability.is-unavailable")).toHaveCSS("color", "rgb(255, 143, 137)");

  const darkSourceColors = await sourceCards.evaluateAll((elements) => elements.map((element) => ({
    background: getComputedStyle(element).backgroundColor,
    foreground: getComputedStyle(element).color,
  })));
  expect(new Set(darkSourceColors.map(({ background }) => background)).size).toBe(2);
  for (const colors of darkSourceColors) {
    expect(contrastRatio(colors.foreground, colors.background)).toBeGreaterThanOrEqual(4.5);
  }
  const darkActionColors = await Promise.all([manualStructuring, splitPdf].map((action) => action.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    foreground: getComputedStyle(element).color,
  }))));
  for (const colors of darkActionColors) {
    expect(contrastRatio(colors.foreground, colors.background)).toBeGreaterThanOrEqual(4.5);
  }
  const darkUnavailableColors = await unavailableStructuring.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    foreground: getComputedStyle(element).color,
  }));
  expect(contrastRatio(darkUnavailableColors.foreground, darkUnavailableColors.background)).toBeGreaterThanOrEqual(4.5);

  const darkAiColors = await aiCards.evaluateAll((elements) => elements.map((element) => ({
    background: getComputedStyle(element).backgroundColor,
    foreground: getComputedStyle(element).color,
  })));
  expect(new Set(darkAiColors.map(({ background }) => background)).size).toBe(4);
  for (const colors of darkAiColors) {
    expect(contrastRatio(colors.foreground, colors.background)).toBeGreaterThanOrEqual(4.5);
  }

  const darkCardColors = await toolCards.evaluateAll((elements) => elements.map((element) => ({
    background: getComputedStyle(element).backgroundColor,
    foreground: getComputedStyle(element).color,
  })));
  expect(new Set(darkCardColors.map(({ background }) => background)).size).toBe(9);
  for (const colors of darkCardColors) {
    expect(contrastRatio(colors.foreground, colors.background)).toBeGreaterThanOrEqual(4.5);
  }

  await expect(page.locator(".workspace-beta-tools-avatar img")).toBeVisible();
});
