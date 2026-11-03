import { expect, test } from "@playwright/test";

test("Workspace BETA switches between AI options and the selected mode", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  const options = page.locator(".workspace-beta-ai-options");
  await expect(options).toBeVisible();
  await page.getByRole("button", { name: /StudyApp AI Assistant Available/u }).click();
  await expect(options).toHaveCount(0);
  const frame = page.frameLocator('iframe[name="studyapp-workspace-workspace"]');
  await expect(frame.getByRole("heading", { name: "AI Assistant", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Back to AI options", exact: true }).click();
  await expect(options).toBeVisible();
  await expect(page.locator('iframe[name="studyapp-workspace-workspace"]')).toHaveCount(0);

  await page.getByRole("button", { name: "Compare AI options" }).click();
  await expect(page.locator(".workspace-beta-info-modal")).toBeVisible();
});

test("AI option controls use the compact shared typography hierarchy", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");
  const controls = page.locator(".workspace-beta-ai-option");
  const sizes = await controls.evaluateAll((elements) => elements.map((element) => ({
    family: getComputedStyle(element).fontFamily,
    height: element.getBoundingClientRect().height,
    titleSize: parseFloat(getComputedStyle(element.querySelector("strong") as Element).fontSize),
  })));
  expect(new Set(sizes.map(({ family }) => family))).toHaveProperty("size", 1);
  expect(new Set(sizes.map(({ height }) => height))).toHaveProperty("size", 1);
  for (const item of sizes) expect(item.titleSize).toBeLessThanOrEqual(15);
});
