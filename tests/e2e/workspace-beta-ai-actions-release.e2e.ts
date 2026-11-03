import { expect, test } from "@playwright/test";

test("AI connection cards expose only the approved available modes", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");

  const options = page.locator(".workspace-beta-ai-options");
  await expect(options.locator(".workspace-beta-ai-option")).toHaveCount(4);
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
