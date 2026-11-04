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
  const unavailableStructuring = sources.getByRole("button", { name: "AI-Assisted Structuring — Under construction — Not available yet" });
  await expect(unavailableStructuring).toBeDisabled();
  await expect(unavailableStructuring).toHaveClass(/workspace-beta-ai-structuring-unavailable/u);
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

test("unavailable AI structuring action wraps inside its Sources card in English and Greek", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/#/workspace-beta");

  const sources = page.frameLocator('iframe[name="studyapp-workspace-sources"]');
  const assertContained = async (name: string) => {
    const action = sources.getByRole("button", { name, exact: true });
    await expect(action).toBeVisible();
    const metrics = await action.evaluate((element) => {
      const actionBounds = element.getBoundingClientRect();
      const cardBounds = element.closest(".dashboard-action-card")?.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        actionLeft: actionBounds.left,
        actionRight: actionBounds.right,
        cardLeft: cardBounds?.left ?? 0,
        cardRight: cardBounds?.right ?? 0,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        lineHeight: Number.parseFloat(style.lineHeight),
        height: actionBounds.height,
      };
    });
    expect(metrics.actionLeft).toBeGreaterThanOrEqual(metrics.cardLeft - 1);
    expect(metrics.actionRight).toBeLessThanOrEqual(metrics.cardRight + 1);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
    expect(metrics.height).toBeGreaterThan(metrics.lineHeight);
  };

  await assertContained("AI-Assisted Structuring — Under construction — Not available yet");
  await page.getByRole("button", { name: "GR", exact: true }).click();
  await assertContained("Δόμηση με υποστήριξη AI — Υπό κατασκευή — Δεν είναι διαθέσιμη ακόμη");
});

test("AI Studio and tool controls remain contained at desktop width", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/#/workspace-beta");
  await expect(page.locator(".workspace-beta-ai-option")).toHaveCount(4);
  await expect(page.locator(".workspace-beta-tools-grid > button")).toHaveCount(8);
  await expect(page.locator(".workspace-beta-tools-grid > button").first().locator("small")).toHaveCSS("font-weight", "400");
  const overflow = await page.locator(".workspace-beta-phase-one-grid").evaluate((element) =>
    element.scrollWidth - element.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
