import { expect, test } from "@playwright/test";

test("Workspace BETA keeps the AI Assistant avatar circular, background-blended, and the identity pill content-sized", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  const launchRow = page.locator(".workspace-beta-ai-launch-row");
  await expect(launchRow).toBeVisible();
  await expect(
    launchRow.getByRole("link", { name: "Start StudyApp AI Assistant" }),
  ).toBeVisible();

  const readIdentity = () => launchRow.evaluate((element) => {
    const avatar = window.getComputedStyle(element, "::before");
    const pill = window.getComputedStyle(element, "::after");
    return {
      avatar: {
        backgroundColor: avatar.backgroundColor,
        backgroundImage: avatar.backgroundImage,
        borderColor: avatar.borderTopColor,
        borderRadius: Number.parseFloat(avatar.borderRadius),
        height: Number.parseFloat(avatar.height),
        width: Number.parseFloat(avatar.width),
      },
      pageBackground: window.getComputedStyle(document.body).backgroundColor,
      pill: {
        borderRadius: Number.parseFloat(pill.borderRadius),
        content: pill.content,
        display: pill.display,
        height: Number.parseFloat(pill.height),
        width: Number.parseFloat(pill.width),
      },
      rowWidth: element.getBoundingClientRect().width,
    };
  });

  const identity = await readIdentity();
  expect(identity.avatar.backgroundImage).toContain("study-assistant-avatar.svg");
  expect(identity.avatar.backgroundImage).toContain("radial-gradient");
  expect(identity.avatar.backgroundColor).toBe("rgba(0, 0, 0, 0)");
  expect(identity.avatar.borderColor).toBe(identity.pageBackground);
  expect(identity.avatar.borderRadius).toBeGreaterThanOrEqual(identity.avatar.width / 2);
  expect(identity.avatar.width).toBeGreaterThanOrEqual(56);
  expect(identity.avatar.height).toBe(identity.avatar.width);

  expect(["flex", "inline-flex"]).toContain(identity.pill.display);
  expect(identity.pill.content).toContain("StudyApp AI Assistant");
  expect(identity.pill.borderRadius).toBeGreaterThan(identity.pill.height / 2);
  expect(identity.pill.width).toBeLessThan(identity.rowWidth);

  await expect(page.getByRole("button", { name: "Switch to dark mode" })).toBeVisible();
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.workspaceTheme)).toBe("dark");

  await expect.poll(async () => {
    const darkIdentity = await readIdentity();
    return darkIdentity.avatar.borderColor === darkIdentity.pageBackground;
  }).toBe(true);

  await page.getByRole("button", { name: "GR" }).click();
  await expect.poll(async () => launchRow.evaluate((element) => (
    window.getComputedStyle(element, "::after").content
  ))).toContain("Βοηθός AI του StudyApp");
});
