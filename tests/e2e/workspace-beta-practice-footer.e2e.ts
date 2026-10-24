import { expect, test } from "@playwright/test";

test("Workspace BETA has one full-width versioned footer below all four panels", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  const footer = page.locator(".workspace-beta-global-footer");
  const main = page.locator(".workspace-beta-main");
  const grid = page.locator(".workspace-beta-functional-grid");
  await expect(footer).toBeVisible();
  await expect(footer).toContainText("© 2026 Markellos Markides. All rights reserved.");
  await expect(footer).toContainText("Your data stays under your control.");
  await expect(footer.locator(".workspace-beta-footer-version")).toContainText(/^StudyApp BETA · v\d+\.\d+\.\d+$/u);
  const [footerBox, mainBox, gridBox] = await Promise.all([
    footer.boundingBox(), main.boundingBox(), grid.boundingBox(),
  ]);
  if (!footerBox || !mainBox || !gridBox) throw new Error("Workspace layout is not measurable");
  expect(Math.abs(footerBox.x - gridBox.x)).toBeLessThan(2);
  expect(Math.abs(footerBox.width - gridBox.width)).toBeLessThan(2);
  expect(footerBox.y).toBeGreaterThanOrEqual(mainBox.y + mainBox.height - 1);
  expect(footerBox.y + footerBox.height).toBeLessThanOrEqual(902);
  const legacy = await page.locator(".workspace-beta-panel-practice").evaluate(panel =>
    getComputedStyle(panel, "::after").content,
  );
  expect(legacy).toBe("none");
});

test("Workspace BETA footer remains outside the active panel on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/workspace-beta");
  const footer = page.locator(".workspace-beta-global-footer");
  await expect(footer).toBeVisible();
  await expect(footer).toContainText("StudyApp BETA · v");
  const rect = await footer.boundingBox();
  expect(rect?.x).toBeGreaterThanOrEqual(0);
  expect((rect?.x ?? 0) + (rect?.width ?? 0)).toBeLessThanOrEqual(392);
});
