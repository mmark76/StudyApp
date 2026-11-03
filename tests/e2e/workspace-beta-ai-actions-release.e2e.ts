import { expect, test } from "@playwright/test";

test("AI connection cards expose only the approved available modes", async ({ page }) => {
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
  await expect(agentBar).toContainText("AI Agent");
  await expect(agentBar).toContainText("Not available");
  await expect(page.getByRole("textbox", { name: "Message ChatGPT" })).toHaveCount(0);
  await expect(options.getByRole("button", { name: /StudyApp AI Assistant Available/u })).toBeEnabled();
  await expect(options.getByRole("button", { name: /Sign in with ChatGPT Available/u })).toBeEnabled();
  await expect(options.getByRole("button", { name: /ChatGPT App \/ MCP Coming soon/u })).toBeDisabled();
  await expect(options.getByRole("button", { name: /StudyApp AI \/ API Coming soon/u })).toBeDisabled();

  await options.getByRole("button", { name: /StudyApp AI Assistant Available/u }).click();
  const back = page.getByRole("button", { name: "Back to AI options", exact: true });
  await expect(back).toBeVisible();
  const colors = await back.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    foreground: getComputedStyle(element).color,
  }));
  expect(colors).toEqual({ background: "rgb(60, 97, 77)", foreground: "rgb(255, 255, 255)" });
});
