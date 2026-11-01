import { expect, test } from "@playwright/test";

test("Workspace columns collapse to narrow rails and can each be restored", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");
  const panels = page.locator(".workspace-beta-functional-panel");
  await expect(panels).toHaveCount(4);
  const before = await panels.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().width));

  for (const name of ["sources", "knowledge", "practice", "AI Studio"]) {
    await page.getByRole("button", { name: `Hide ${name} column` }).click();
    await expect(page.getByRole("button", { name: `Show ${name} column` })).toBeVisible();
  }
  const collapsed = await panels.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().width));
  expect(collapsed.every((width) => width <= 38)).toBe(true);

  for (const name of ["sources", "knowledge", "practice", "AI Studio"]) {
    await page.getByRole("button", { name: `Show ${name} column` }).click();
    await expect(page.getByRole("button", { name: `Hide ${name} column` })).toBeVisible();
  }
  const restored = await panels.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().width));
  for (let i = 0; i < 4; i++) expect(Math.abs(restored[i] - before[i])).toBeLessThan(3);
});
