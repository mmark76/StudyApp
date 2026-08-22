import { expect, test } from "@playwright/test";

test("Workspace BETA shows the StudyApp AI Assistant avatar above its launch action", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  const launchRow = page.locator(".workspace-beta-ai-launch-row");
  await expect(launchRow).toBeVisible();
  await expect(
    launchRow.getByRole("link", { name: "Start StudyApp AI Assistant" }),
  ).toBeVisible();

  const avatar = await launchRow.evaluate((element) => {
    const style = window.getComputedStyle(element, "::before");
    return {
      backgroundImage: style.backgroundImage,
      display: style.display,
      width: Number.parseFloat(style.width),
    };
  });

  expect(avatar.display).toBe("block");
  expect(avatar.backgroundImage).toContain("study-assistant-avatar.svg");
  expect(avatar.width).toBeGreaterThan(0);
});
