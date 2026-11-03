import { expect, test } from "@playwright/test";

test("AI-Assisted Tools can be hidden and restored without losing active work", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");
  await page.getByRole("button", { name: "Learning Goals", exact: true }).click();
  const activeFrame = page.locator('iframe[name="studyapp-workspace-workspace"]');
  await expect(activeFrame).toHaveAttribute("src", "/#/core-knowledge?view=goals");

  const hideTools = page.getByRole("button", { name: "Hide tools", exact: true });
  const hideIcon = hideTools.locator(".workspace-beta-column-symbol");
  await expect(hideIcon).toBeVisible();
  const collapsedDividerPosition = await hideIcon.evaluate((element) =>
    getComputedStyle(element, "::before").left,
  );
  await hideTools.click();
  await expect(page.locator(".workspace-beta-phase-one")).toHaveClass(/is-tools-hidden/u);
  await expect(activeFrame).toHaveAttribute("src", "/#/core-knowledge?view=goals");
  const showTools = page.getByRole("button", { name: "Show tools", exact: true });
  const showIcon = showTools.locator(".workspace-beta-column-symbol");
  await expect(showIcon).toBeVisible();
  const expandedDividerPosition = await showIcon.evaluate((element) =>
    getComputedStyle(element, "::before").left,
  );
  expect(expandedDividerPosition).not.toBe(collapsedDividerPosition);
  await showTools.click();
  await expect(page.getByRole("button", { name: "Learning Goals", exact: true })).toHaveClass(/is-selected/u);
});
