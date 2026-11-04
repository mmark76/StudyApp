import { expect, test } from "@playwright/test";

test("AI connection cards expose only the approved available modes", async ({ page }) => {
  await page.route("**/api/chatgpt-plan/connection", (route) => route.fulfill({ json: {
    connected: false,
    connectionState: "disconnected",
    planUsageAuthorized: false,
    scope: "current-windows-user",
  } }));
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");

  const options = page.locator(".workspace-beta-ai-options");
  const cards = options.locator(".workspace-beta-ai-option");
  await expect(cards).toHaveCount(4);
  const cardHeights = await cards.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height));
  expect(Math.max(...cardHeights) - Math.min(...cardHeights)).toBeLessThanOrEqual(1);
  expect(Math.min(...cardHeights)).toBeGreaterThanOrEqual(80);
  const agentBar = page.locator(".workspace-beta-agent-bar");
  await expect(agentBar).toBeVisible();
  await expect(agentBar).toContainText("AI Agent bar — Available only in Local version");
  await expect(agentBar).toContainText("Not available");
  await expect(agentBar.getByText("Not available in web app", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Message ChatGPT" })).toHaveCount(0);
  const assistantCard = options.getByRole("link", { name: /StudyApp AI Assistant/u });
  await expect(assistantCard).toHaveAttribute("href", "https://chatgpt.com/g/g-6a6b687029608191af7b26717f0a2072-studyapp-ai-assistant");
  await expect(assistantCard).toHaveAttribute("target", "_blank");
  await expect(assistantCard).toHaveAttribute("rel", "noopener noreferrer");
  await expect(options.getByRole("button", { name: /Sign in with ChatGPT/u })).toBeEnabled();
  await expect(options.getByRole("button", { name: /ChatGPT App \/ MCP/u })).toBeDisabled();
  await expect(options.getByRole("button", { name: /StudyApp AI \/ API/u })).toBeDisabled();

  await options.getByRole("button", { name: /Sign in with ChatGPT/u }).click();
  await expect(page.locator(".workspace-local-connection-controls").getByRole("status")).toContainText("ChatGPT disconnected");
  await expect(page.getByRole("button", { name: "Connect", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Back to AI options", exact: true })).toBeVisible();
});
