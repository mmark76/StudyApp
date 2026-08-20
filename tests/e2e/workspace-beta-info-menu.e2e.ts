import { expect, test } from "@playwright/test";

test("Workspace BETA Info menu closes when the mouse leaves the menu", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  const menu = page.locator(".workspace-beta-info-menu");
  const popover = page.locator(".workspace-beta-info-popover");

  await menu.locator("summary").click();
  await expect(popover).toBeVisible();

  await popover.hover();
  await expect(popover).toBeVisible();

  const mainBox = await page.locator("#workspace-beta-main").boundingBox();
  if (!mainBox) throw new Error("Workspace main area was not measurable");

  await page.mouse.move(mainBox.x + 24, mainBox.y + 120);

  await expect(popover).toBeHidden();
  await expect(menu).not.toHaveAttribute("open", "");
});
