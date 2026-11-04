import { expect, test } from "@playwright/test";

test("the legacy Local ChatGPT page keeps RAG visibly unavailable", async ({ page }) => {
  await page.route("**/api/chatgpt-plan/connection", (route) => route.fulfill({
    json: { connected: true, connectionState: "connected", planUsageAuthorized: true, scope: "current-windows-user" },
  }));

  await page.goto("/#/local-chatgpt-plan");
  await expect(page.getByText("RAG is still under construction and not available.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Attach PDF" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Find passages on this device" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Send approved passages" })).toHaveCount(0);
});
