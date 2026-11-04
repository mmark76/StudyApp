import { expect, test } from "@playwright/test";

test("Local direct chat keeps RAG unavailable and the composer reachable at 100% zoom", async ({ page }) => {
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

  for (const viewport of [{ width: 1280, height: 720, theme: "light" }, { width: 1440, height: 900, theme: "dark" }] as const) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/#/workspace-beta");
    await page.evaluate((theme) => document.documentElement.setAttribute("data-workspace-theme", theme), viewport.theme);
    expect(await page.evaluate(() => window.visualViewport?.scale ?? 1)).toBe(1);

    const studio = page.locator(".workspace-beta-phase-workspace");
    const localMode = page.getByRole("button", { name: /Sign in with ChatGPT/u });
    if (await localMode.count() > 0) await localMode.click();
    const inputBar = studio.locator(".workspace-local-chat-input-bar");
    await expect(studio.getByRole("textbox", { name: "Message ChatGPT" })).toBeVisible();
    await expect(studio.getByText("RAG is still under construction and not available.")).toBeVisible();
    await expect(inputBar.getByRole("button", { name: "Attach study files" })).toHaveCount(0);
    await expect(studio.locator(".workspace-local-chat-review")).toHaveCount(0);
  }
});
