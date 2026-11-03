import { expect, test } from "@playwright/test";

test("Workspace BETA Phase 1 keeps three columns, existing modes and routed tools", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  await expect(page.getByRole("heading", { name: "Sources & Materials", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI Studio - Workspace", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI-Assisted Tools", exact: true })).toBeVisible();
  await expect(page.locator(".workspace-beta-ai-option")).toHaveCount(4);
  await expect(page.getByRole("button", { name: /ChatGPT App \/ MCP/u })).toBeDisabled();
  await expect(page.locator(".workspace-beta-tools-grid > button")).toHaveCount(8);

  const sources = page.frameLocator('iframe[name="studyapp-workspace-sources"]');
  await expect(sources.getByRole("link", { name: "Open Library" })).toBeVisible();
  await expect(sources.getByRole("link", { name: "Manual Import" })).toBeVisible();
  await expect(sources.getByRole("link", { name: "Split PDF Tool" })).toBeVisible();
  await expect(sources.getByText("AI-Assisted Structuring — planned and unavailable.")).toBeVisible();

  await page.getByRole("button", { name: "Learning Goals" }).click();
  await expect(page.getByRole("button", { name: "Back to AI options" })).toBeVisible();
  await expect(page.locator('iframe[name="studyapp-workspace-workspace"]')).toHaveAttribute(
    "src",
    "/#/core-knowledge?view=goals",
  );

  await page.getByRole("button", { name: "Back to AI options" }).click();
  await expect(page.locator(".workspace-beta-ai-option")).toHaveCount(4);
  await page.getByRole("button", { name: "Hide tools" }).click();
  await expect(page.getByRole("button", { name: "Show tools" })).toBeVisible();
});

test("Workspace BETA Phase 1 switches the three approved mobile panels", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/workspace-beta");

  await expect(page.getByRole("heading", { name: "Sources & Materials", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI Studio - Workspace", exact: true })).toBeHidden();
  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  await expect(page.getByRole("heading", { name: "AI Studio - Workspace", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Tools", exact: true }).click();
  await expect(page.getByRole("heading", { name: "AI-Assisted Tools", exact: true })).toBeVisible();
});
