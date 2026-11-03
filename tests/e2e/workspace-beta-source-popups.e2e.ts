import { expect, test } from "@playwright/test";

test("Sources actions open their existing workflows in the centered modal", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");

  const sourcesFrame = page.frameLocator('iframe[name="studyapp-workspace-sources"]');
  const sourceHost = page.locator('iframe[name="studyapp-workspace-sources"]');
  const cases = [
    { action: "Open Library", route: "/#/library", title: "Library" },
    { action: "Manual Import", route: "/#/study/theory", title: "Manual Import" },
    { action: "Split PDF Tool", route: "/#/tools", title: "Split PDF Tool" },
  ];

  for (const item of cases) {
    await sourcesFrame.getByRole("link", { name: item.action, exact: true }).click();
    const modal = page.getByRole("dialog", { name: item.title, exact: true });
    await expect(modal).toBeVisible();
    await expect(modal.locator('iframe[name="studyapp-workspace-info-modal"]')).toHaveAttribute("src", item.route);
    await expect(sourceHost).toHaveAttribute("src", "/#/sources");
    await modal.getByRole("button", { name: "Close", exact: true }).click();
    await expect(modal).toHaveCount(0);
  }
});

test("right-side tools still open in the upper central Workspace", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");

  await page.getByRole("button", { name: "Key Points", exact: true }).click();
  await expect(page.locator('iframe[name="studyapp-workspace-workspace"]')).toHaveAttribute(
    "src",
    "/#/core-knowledge?view=key-points",
  );
  await expect(page.locator(".workspace-beta-info-modal")).toHaveCount(0);
  await expect(page.locator(".workspace-beta-central-content")).toBeVisible();
  await expect(page.locator(".workspace-beta-persistent-agent")).toBeVisible();
});
