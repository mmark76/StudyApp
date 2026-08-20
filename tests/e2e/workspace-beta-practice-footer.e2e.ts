import { expect, test } from "@playwright/test";

test("Workspace BETA keeps the Practice copyright footer fixed at the bottom", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  const practicePanel = page.locator(".workspace-beta-panel-practice");
  await expect(practicePanel).toBeVisible();

  const footerContent = await practicePanel.evaluate((panel) =>
    getComputedStyle(panel, "::after").content,
  );
  expect(footerContent).toContain("© 2026 Markellos Markides. All rights reserved.");
  expect(footerContent).toContain("Your data stays under your control.");

  const panelBox = await practicePanel.boundingBox();
  if (!panelBox) throw new Error("Practice panel was not measurable");

  const footerMetrics = await practicePanel.evaluate((panel) => {
    const style = getComputedStyle(panel, "::after");
    return {
      bottom: style.bottom,
      position: style.position,
    };
  });

  expect(footerMetrics.position).toBe("absolute");
  expect(footerMetrics.bottom).toBe("0px");
  expect(panelBox.height).toBeGreaterThan(0);
});
