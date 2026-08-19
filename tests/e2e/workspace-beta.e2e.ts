import { expect, test } from "@playwright/test";

test("Workspace BETA keeps three independent functional StudyApp panels", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  await expect(page.locator(".workspace-beta-header")).toBeVisible();
  await expect(page.locator(".app-header")).toHaveCount(0);
  await expect(page.locator(".app-footer")).toHaveCount(0);
  await expect(page.locator("iframe.workspace-beta-frame")).toHaveCount(3);

  await expect(page.getByRole("heading", { name: "Sources" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Practice" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI Studio" })).toBeVisible();

  const sources = page.frameLocator('iframe[name="studyapp-workspace-sources"]');
  const practice = page.frameLocator('iframe[name="studyapp-workspace-practice"]');
  const ai = page.frameLocator('iframe[name="studyapp-workspace-ai"]');

  await expect(sources.getByRole("heading", { name: "Sources" })).toBeVisible();
  await expect(practice.getByRole("heading", { name: "Learn" })).toBeVisible();
  await expect(ai.getByRole("heading", { name: "AI Assistant", exact: true })).toBeVisible();

  await expect(sources.locator(".app-header")).toHaveCount(0);
  await expect(sources.locator(".app-footer")).toHaveCount(0);

  await sources.getByRole("link", { name: "Library", exact: true }).click();
  await expect(sources.getByRole("heading", { name: "Library" })).toBeVisible();
  await expect(practice.getByRole("heading", { name: "Learn" })).toBeVisible();

  await page.getByRole("button", { name: "Sources home" }).click();
  await expect(sources.getByRole("heading", { name: "Sources" })).toBeVisible();

  const assistantLink = page.getByRole("link", { name: "Start StudyApp AI Assistant" });
  await expect(assistantLink).toHaveAttribute("target", "_blank");
  await expect(assistantLink).toHaveAttribute("href", /^https:\/\/chatgpt\.com\//u);
});

test("Workspace BETA language sync reaches panels and narrow overflow stays contained", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/workspace-beta");

  const sources = page.frameLocator('iframe[name="studyapp-workspace-sources"]');
  const practice = page.frameLocator('iframe[name="studyapp-workspace-practice"]');

  await expect(sources.getByRole("heading", { name: "Sources" })).toBeVisible();
  await page.getByRole("button", { name: "GR", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Πηγές" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Εξάσκηση" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Έξοδος" })).toBeVisible();
  await expect(sources.getByRole("heading", { name: "Πηγές" })).toBeVisible();
  await expect(practice.getByRole("heading", { name: "Μάθηση" })).toBeVisible();

  const overflow = await page.locator(".workspace-beta-main").evaluate((main) => ({
    clientWidth: main.clientWidth,
    scrollWidth: main.scrollWidth,
    documentFits: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeGreaterThan(overflow.clientWidth);
  expect(overflow.documentFits).toBe(true);
});
