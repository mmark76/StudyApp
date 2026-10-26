import { expect, test } from "@playwright/test";

test.use({
  channel: process.env.STUDYAPP_TEST_CHROME === "1" ? "chrome" : undefined,
  serviceWorkers: "block",
});

test("Local AI Studio connects and disconnects without leaving the workspace", async ({ page }) => {
  let connected = false;
  await page.route("http://127.0.0.1:8766/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/chatgpt-plan/connection") {
      if (request.method() === "POST") connected = true;
      if (request.method() === "DELETE") connected = false;
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          connected,
          connectionState: connected ? "connected" : "disconnected",
          planUsageAuthorized: connected,
          scope: "current-windows-user",
        }),
      });
      return;
    }
    const response = await route.fetch({ url: `http://127.0.0.1:4173${url.pathname}${url.search}` });
    await route.fulfill({ response });
  });

  await page.goto("http://127.0.0.1:8766/#/workspace-beta");
  const studio = page.locator(".workspace-beta-panel-studio");
  await expect(studio.getByRole("button", { name: "Connect", exact: true })).toBeVisible();

  await studio.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(studio.getByRole("button", { name: "Disconnect", exact: true })).toBeVisible();
  await expect(studio.getByRole("textbox", { name: "Message ChatGPT" })).toBeVisible();

  await studio.getByRole("button", { name: "Disconnect", exact: true }).click();
  await expect(studio.getByRole("button", { name: "Connect", exact: true })).toBeVisible();
  await expect(studio.getByRole("textbox", { name: "Message ChatGPT" })).toHaveCount(0);
});
