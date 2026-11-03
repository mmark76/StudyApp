import { expect, test } from "@playwright/test";

test("approved knowledge views stay compact and readable in both themes", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/#/workspace-beta");
  for (const name of ["Learning Goals", "Key Points", "Important Terms"]) {
    await page.getByRole("button", { name, exact: true }).click();
    const frame = page.frameLocator('iframe[name="studyapp-workspace-workspace"]');
    await expect(frame.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-workspace-theme", "dark");
});

test("Sources keeps manual import and planned structuring clearly separated", async ({ page }) => {
  await page.goto("/#/workspace-beta");
  const sources = page.frameLocator('iframe[name="studyapp-workspace-sources"]');
  await expect(sources.getByRole("link", { name: "Manual Import" })).toBeVisible();
  await expect(sources.getByRole("link", { name: "Split PDF Tool" })).toBeVisible();
  await expect(sources.getByText("AI-Assisted Structuring — planned and unavailable.")).toBeVisible();
});

test("AI Studio and tool controls remain contained at desktop width", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/#/workspace-beta");
  await expect(page.locator(".workspace-beta-ai-option")).toHaveCount(4);
  await expect(page.locator(".workspace-beta-tools-grid > button")).toHaveCount(8);
  const overflow = await page.locator(".workspace-beta-phase-one-grid").evaluate((element) =>
    element.scrollWidth - element.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
