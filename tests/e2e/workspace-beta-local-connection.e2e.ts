import { expect, test } from "@playwright/test";

test.use({
  channel: process.env.STUDYAPP_TEST_CHROME === "1" ? "chrome" : undefined,
  serviceWorkers: "block",
});

test("Local AI Studio connects and disconnects without leaving the workspace", async ({ page }) => {
  let connected = false;
  await page.route("**/api/chatgpt-plan/connection", async (route) => {
    const request = route.request();
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
  });

  await page.goto("/#/workspace-beta");
  const studio = page.locator(".workspace-beta-panel-studio");
  await expect(studio.getByRole("button", { name: "Connect", exact: true })).toBeVisible();

  await studio.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(studio.getByRole("button", { name: "Disconnect", exact: true })).toBeVisible();
  await expect(studio.getByRole("textbox", { name: "Message ChatGPT" })).toBeVisible();

  await studio.getByRole("button", { name: "Disconnect", exact: true }).click();
  await expect(studio.getByRole("button", { name: "Connect", exact: true })).toBeVisible();
  await expect(studio.getByRole("textbox", { name: "Message ChatGPT" })).toHaveCount(0);
});
