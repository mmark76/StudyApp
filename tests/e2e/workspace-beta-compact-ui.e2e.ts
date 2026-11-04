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

test("resized Workspace BETA buttons and cards wrap labels in English and Greek", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");

  const divider = page.locator('[role="separator"][aria-orientation="vertical"]').first();
  const dividerBounds = await divider.boundingBox();
  if (!dividerBounds) throw new Error("Sources divider was not measurable");
  const dividerX = dividerBounds.x + dividerBounds.width / 2;
  const dividerY = dividerBounds.y + 80;
  await page.mouse.move(dividerX, dividerY);
  await page.mouse.down();
  await page.mouse.move(dividerX - 60, dividerY, { steps: 5 });
  await page.mouse.up();

  const sources = page.frameLocator('iframe[name="studyapp-workspace-sources"]');
  const verifyWrapping = async (manualLabel: string) => {
    const manual = sources.getByRole("link", { name: manualLabel, exact: true });
    await expect(manual).toHaveCSS("white-space", "normal");
    const evidence = await manual.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const card = element.closest<HTMLElement>(".dashboard-action-card");
      const cardBounds = card?.getBoundingClientRect();
      const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);
      return {
        buttonRight: bounds.right,
        cardRight: cardBounds?.right ?? 0,
        buttonHeight: bounds.height,
        lineHeight,
        cardOverflow: (card?.scrollWidth ?? 0) - (card?.clientWidth ?? 0),
      };
    });
    expect(evidence.buttonRight).toBeLessThanOrEqual(evidence.cardRight + 1);
    expect(evidence.cardOverflow).toBeLessThanOrEqual(1);
    expect(evidence.buttonHeight).toBeGreaterThan(evidence.lineHeight * 1.5);
  };

  await verifyWrapping("Manual Structuring - import structured files");
  const toolCards = page.locator(".workspace-beta-tools-grid > button");
  await expect(toolCards).toHaveCount(8);
  await expect(toolCards.first()).toHaveCSS("white-space", "normal");
  await expect(toolCards.first().locator("span")).toHaveCSS("white-space", "normal");
  await page.getByRole("button", { name: "GR", exact: true }).click();
  await verifyWrapping("Χειροκίνητη δόμηση - εισαγωγή δομημένων αρχείων");
  await expect(toolCards.first().locator("span")).toHaveCSS("white-space", "normal");
});

test("Workspace tool empty states use the same quiet result presentation", async ({ page }) => {
  await page.goto("/#/workspace-beta");
  await page.getByRole("button", { name: "Flashcards", exact: true }).click();
  const workspace = page.frameLocator('iframe[name="studyapp-workspace-workspace"]');
  const emptyState = workspace.locator(".empty-state");
  await expect(emptyState).toContainText("There are no flashcards");
  await expect(emptyState).toHaveCSS("border-top-style", "none");
  await expect(emptyState).toHaveCSS("text-align", "start");

  await page.getByRole("button", { name: "Progress", exact: true }).click();
  await expect(workspace.locator(".progress-page--workspace-results .stat-card").first()).toHaveCSS("border-top-style", "none");
  await expect(workspace.locator(".progress-page--workspace-results .content-panel")).toHaveCSS("border-top-style", "none");
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
