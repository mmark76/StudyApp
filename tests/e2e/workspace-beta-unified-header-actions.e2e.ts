import { expect, test } from "@playwright/test";

test("Four headers share green Back actions and AI Studio follows Practice structure", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");
  const names = [
    "Back to Sources & Materials home",
    "Back to Core Knowledge home",
    "Back to Practice & Mastery home",
    "Back to AI Options",
  ];
  const buttons = names.map((name) => page.getByRole("button", { name }));
  for (const button of buttons) await expect(button).toBeVisible();
  const colors = await Promise.all(buttons.map((button) => button.evaluate((el) => ({
    background: getComputedStyle(el).backgroundColor,
    color: getComputedStyle(el).color,
  }))));
  for (const color of colors.slice(1)) expect(color).toEqual(colors[0]);
  const practice = page.locator(".workspace-beta-panel-practice .workspace-beta-panel-tools button");
  const ai = page.locator(".workspace-beta-panel-studio .workspace-beta-panel-tools button");
  await expect(practice).toHaveCount(2);
  await expect(ai).toHaveCount(2);
  await ai.first().click();
  await expect(page.locator(".workspace-beta-info-modal")).toBeVisible();
});
