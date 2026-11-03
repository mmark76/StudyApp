import { expect, test, type Page } from "@playwright/test";

async function mockConnectedLocal(page: Page) {
  await page.route("**/api/chatgpt-plan/connection", async (route) => {
    await route.fulfill({ json: {
      connected: true,
      connectionState: "connected",
      planUsageAuthorized: true,
      scope: "current-windows-user",
    } });
  });
  await page.route("**/api/chatgpt-plan/models", async (route) => {
    await route.fulfill({ json: { models: [{ slug: "model-a", displayName: "Model A" }] } });
  });
}

async function selectLocalMode(page: Page) {
  await page.goto("/#/workspace-beta");
  await page.getByRole("button", { name: /Sign in with ChatGPT/u }).click();
  await expect(page.getByRole("textbox", { name: "Message ChatGPT" })).toBeVisible();
}

test("Windows Local chat inherits font, text size, density and dark theme settings", async ({ page }) => {
  await mockConnectedLocal(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await selectLocalMode(page);

  const chat = page.locator(".workspace-local-chat");
  await expect(page.locator(".workspace-beta-agent-bar")).toContainText("Available");
  const textarea = chat.getByRole("textbox", { name: "Message ChatGPT" });
  const controls = chat.locator("button, select, textarea");

  await page.evaluate(() => {
    const root = document.documentElement;
    root.dataset.fontChoice = "serif";
    root.dataset.textSize = "extra-large";
    root.dataset.uiDensity = "compact";
    root.dataset.workspaceTheme = "dark";
  });

  const largeMetrics = await textarea.evaluate((element) => ({
    family: getComputedStyle(element).fontFamily,
    size: parseFloat(getComputedStyle(element).fontSize),
  }));
  const rootFamily = await page.locator("html").evaluate((element) => getComputedStyle(element).fontFamily);
  expect(largeMetrics.family).toBe(rootFamily);
  expect(largeMetrics.family).toContain("Georgia");
  await expect(page.locator("html")).toHaveAttribute("data-workspace-theme", "dark");

  const mismatchedControl = await controls.evaluateAll((elements) => {
    const activeFont = getComputedStyle(document.documentElement).fontFamily;
    return elements.find((element) => getComputedStyle(element).fontFamily !== activeFont)?.outerHTML;
  });
  expect(mismatchedControl).toBeUndefined();

  const compactPadding = await page.locator(".workspace-local-chat-status")
    .evaluate((element) => parseFloat(getComputedStyle(element).paddingInline));
  await page.evaluate(() => {
    document.documentElement.dataset.textSize = "compact";
    document.documentElement.dataset.uiDensity = "spacious";
  });
  const compactTextSize = await textarea.evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
  const spaciousPadding = await page.locator(".workspace-local-chat-status")
    .evaluate((element) => parseFloat(getComputedStyle(element).paddingInline));
  expect(compactTextSize).toBeLessThan(largeMetrics.size);
  expect(spaciousPadding).toBeGreaterThan(compactPadding);

  await page.getByRole("button", { name: "GR", exact: true }).click();
  await expect(chat.getByRole("combobox", { name: "Μοντέλο" })).toBeVisible();
  await expect(chat.getByRole("textbox", { name: "Μήνυμα στο ChatGPT" })).toHaveAttribute("placeholder", "Ρώτησε το ChatGPT");
});

test("Windows Local chat remains contained in the mobile Workspace panel", async ({ page }) => {
  await mockConnectedLocal(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/workspace-beta");
  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  await page.getByRole("button", { name: /Sign in with ChatGPT/u }).click();

  await expect(page.getByRole("textbox", { name: "Message ChatGPT" })).toBeVisible();
  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
});

test("Windows Local disconnected controls inherit the active Workspace font", async ({ page }) => {
  await page.route("**/api/chatgpt-plan/connection", async (route) => {
    await route.fulfill({ json: {
      connected: false,
      connectionState: "disconnected",
      planUsageAuthorized: false,
      scope: "current-windows-user",
    } });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");
  await page.getByRole("button", { name: /Sign in with ChatGPT/u }).click();

  const connect = page.getByRole("button", { name: "Connect", exact: true });
  await expect(connect).toBeVisible();
  const fonts = await connect.evaluate((element) => ({
    control: getComputedStyle(element).fontFamily,
    root: getComputedStyle(document.documentElement).fontFamily,
  }));
  expect(fonts.control).toBe(fonts.root);
});
