import { expect, test } from "@playwright/test";

test("AI-Assisted Tools can be hidden and restored without losing active work", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");
  await page.getByRole("button", { name: "Learning Goals", exact: true }).click();
  const activeFrame = page.locator('iframe[name="studyapp-workspace-workspace"]');
  await expect(activeFrame).toHaveAttribute("src", "/#/core-knowledge?view=goals");

  await page.getByRole("button", { name: "Hide tools", exact: true }).click();
  await expect(page.locator(".workspace-beta-phase-one")).toHaveClass(/is-tools-hidden/u);
  await expect(activeFrame).toHaveAttribute("src", "/#/core-knowledge?view=goals");
  await page.getByRole("button", { name: "Show tools", exact: true }).click();
  await expect(page.getByRole("button", { name: "Learning Goals", exact: true })).toHaveClass(/is-selected/u);
});
