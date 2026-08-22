import { expect, test } from "@playwright/test";

test("Workspace BETA shows the StudyApp AI Assistant identity pill above its launch action", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  const launchRow = page.locator(".workspace-beta-ai-launch-row");
  await expect(launchRow).toBeVisible();
  await expect(
    launchRow.getByRole("link", { name: "Start StudyApp AI Assistant" }),
  ).toBeVisible();

  const identity = await launchRow.evaluate((element) => {
    const style = window.getComputedStyle(element, "::before");
    return {
      backgroundImage: style.backgroundImage,
      borderRadius: Number.parseFloat(style.borderRadius),
      content: style.content,
      display: style.display,
      height: Number.parseFloat(style.height),
      width: Number.parseFloat(style.width),
    };
  });

  // Grid items may blockify inline-flex to flex in computed styles. Both preserve
  // the intended flex pill presentation, so assert the semantic layout rather
  // than a browser-normalized display keyword.
  expect(["flex", "inline-flex"]).toContain(identity.display);
  expect(identity.content).toContain("StudyApp AI Assistant");
  expect(identity.backgroundImage).toContain("study-assistant-avatar.svg");
  expect(identity.borderRadius).toBeGreaterThan(identity.height / 2);
  expect(identity.width).toBeGreaterThan(identity.height * 2);

  await page.getByRole("button", { name: "GR" }).click();
  await expect.poll(async () => launchRow.evaluate((element) => (
    window.getComputedStyle(element, "::before").content
  ))).toContain("Βοηθός AI του StudyApp");
});
