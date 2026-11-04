import { expect, test } from "@playwright/test";

test("the Local RAG-unavailable notice has no file input", async ({ page }) => {
  await page.route("**/api/chatgpt-plan/connection", (route) => route.fulfill({
    json: { connected: true, connectionState: "connected", planUsageAuthorized: true, scope: "current-windows-user" },
  }));

  await page.goto("/#/local-chatgpt-plan");
  await expect(page.getByText("RAG is still under construction and not available.")).toBeVisible();
  await expect(page.locator('input[type="file"][accept=".pdf,application/pdf"]')).toHaveCount(0);
});
