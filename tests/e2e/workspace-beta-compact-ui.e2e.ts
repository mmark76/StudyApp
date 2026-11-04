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
  await expect(sources.getByRole("link", { name: "Create / Open your Library" })).toBeVisible();
  await expect(sources.getByRole("link", { name: "Manual Structuring - import structured files" })).toBeVisible();
  await expect(sources.getByRole("link", { name: "Split PDF Tool" })).toHaveClass(/workspace-beta-split-pdf-action/);
  await expect(sources.getByRole("button", { name: "AI-Assisted Structuring — Not available" })).toBeDisabled();
});

test("Sources side-panel copy remains readable beside long structuring actions", async ({ page }) => {
  await page.setViewportSize({ width: 1900, height: 900 });
  await page.goto("/#/workspace-beta");

  const sources = page.frameLocator('iframe[name="studyapp-workspace-sources"]');
  const description = sources.getByText("Choose how you want to work with your study material.");
  const structuredStudy = sources.getByRole("heading", { name: "Structured Study", exact: true });
  await expect(description).toBeVisible();
  await expect(structuredStudy).toBeVisible();

  const metrics = await description.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);
    return { height: bounds.height, lineHeight, width: bounds.width };
  });
  expect(metrics.width).toBeGreaterThan(200);
  expect(metrics.height).toBeLessThan(metrics.lineHeight * 5);
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
