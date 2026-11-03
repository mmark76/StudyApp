import { expect, test } from "@playwright/test";

async function expectNoDocumentOverflow(page: import("@playwright/test").Page) {
  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
}

test("Workspace BETA mobile shows one of the three approved panels at a time", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/workspace-beta");
  const tabs = page.locator(".workspace-beta-mobile-panel-tabs");
  await expect(tabs.getByRole("button")).toHaveCount(3);
  await expect(page.locator(".workspace-beta-phase-sources")).toBeVisible();
  await expect(page.locator(".workspace-beta-phase-workspace")).toBeHidden();

  await tabs.getByRole("button", { name: "Workspace", exact: true }).click();
  await expect(page.locator(".workspace-beta-phase-workspace")).toBeVisible();
  await tabs.getByRole("button", { name: "Tools", exact: true }).click();
  await expect(page.locator(".workspace-beta-phase-tools")).toBeVisible();
  await expectNoDocumentOverflow(page);
});

test("Workspace BETA mobile language and modal actions remain valid", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/workspace-beta");
  await page.getByRole("button", { name: "GR", exact: true }).click();
  await expect(page.getByRole("button", { name: "Χώρος εργασίας", exact: true })).toBeVisible();
  await page.locator(".workspace-beta-mobile-menu > summary").click();
  await page.getByRole("button", { name: "Ρυθμίσεις", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Ρυθμίσεις" })).toBeVisible();
  await page.getByRole("button", { name: "Κλείσιμο", exact: true }).click();
  await expectNoDocumentOverflow(page);
});

test("Workspace BETA desktop keeps all three columns visible", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");
  await expect(page.locator(".workspace-beta-mobile-panel-tabs")).toBeHidden();
  const panels = page.locator(".workspace-beta-phase-one-grid > .workspace-beta-panel");
  await expect(panels).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) await expect(panels.nth(index)).toBeVisible();
});
