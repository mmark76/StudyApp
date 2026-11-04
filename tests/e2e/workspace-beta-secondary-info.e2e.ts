import { expect, test } from "@playwright/test";

test("Workspace BETA opens secondary AI information without leaving the workspace", async ({ page }) => {
  await page.goto("/#/workspace-beta");
  await page.getByRole("button", { name: "Compare AI options" }).click();
  const modal = page.locator(".workspace-beta-info-modal");
  const frame = page.frameLocator('iframe[name="studyapp-workspace-info-modal"]');
  await expect(modal).toBeVisible();
  await expect(frame.getByRole("heading", { name: "Compare AI options", exact: true })).toBeVisible();
  await expect(frame.getByRole("columnheader", { name: /1\. Custom GPT \/ Plugin/u })).toBeVisible();
  await expect(page).toHaveURL(/#\/workspace-beta$/u);
  await page.getByRole("button", { name: "Close" }).click();
  await expect(modal).toHaveCount(0);
});

test("Workspace BETA Settings applies appearance changes without losing active work", async ({ page }) => {
  await page.goto("/#/workspace-beta");
  await page.getByRole("button", { name: "Learning Goals", exact: true }).click();
  const active = page.locator('iframe[name="studyapp-workspace-workspace"]');
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  const frame = page.frameLocator('iframe[name="studyapp-workspace-info-modal"]');
  await frame.getByLabel("Accent colour").selectOption("blue");
  await expect.poll(() => page.locator("html").getAttribute("data-color-scheme")).toBe("blue");
  await page.getByRole("button", { name: "Close" }).click();
  await expect(active).toHaveAttribute("src", "/#/core-knowledge?view=goals");
});

test("Sources and the three approved knowledge views retain separate responsibilities", async ({ page }) => {
  await page.goto("/#/workspace-beta");
  const sources = page.frameLocator('iframe[name="studyapp-workspace-sources"]');
  await expect(sources.getByRole("heading", { name: "Sources & Materials" })).toBeVisible();
  await expect(sources.getByRole("link", { name: "Create / Open your Library" })).toBeVisible();
  for (const name of ["Learning Goals", "Key Points", "Important Terms"]) {
    await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
  }
});
