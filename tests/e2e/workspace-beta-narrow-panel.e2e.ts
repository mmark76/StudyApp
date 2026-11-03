import { expect, test } from "@playwright/test";

async function expectContained(page: import("@playwright/test").Page) {
  const measurement = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(measurement.scroll).toBeLessThanOrEqual(measurement.client + 1);
}

test("narrow Workspace panels wrap in English, Greek, light and dark themes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/workspace-beta");
  await expectContained(page);
  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  await expectContained(page);
  await page.getByRole("button", { name: "Tools", exact: true }).click();
  await expectContained(page);
  await page.getByRole("button", { name: "GR", exact: true }).click();
  await expectContained(page);
  await page.locator(".workspace-beta-mobile-menu > summary").click();
  await page.getByRole("button", { name: "Θέμα", exact: true }).click();
  await expectContained(page);
});

test("Standard Sources retains its existing document minimum and two-column presentation", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/sources");
  const standardPresentation = await page.evaluate(() => ({
    bodyMinWidth: getComputedStyle(document.body).minWidth,
    columns: getComputedStyle(document.querySelector<HTMLElement>(".dashboard-action-grid")!).gridTemplateColumns,
    hasWorkspaceEmbed: document.querySelector(".workspace-panel-embed-shell") !== null,
  }));
  expect(standardPresentation.bodyMinWidth).toBe("320px");
  expect(standardPresentation.columns.split(" ")).toHaveLength(2);
  expect(standardPresentation.hasWorkspaceEmbed).toBe(false);
});
