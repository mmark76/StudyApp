import { expect, test } from "@playwright/test";

test("Workspace BETA uses an independent three-panel desktop shell", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  await expect(page.locator(".workspace-beta-header")).toBeVisible();
  await expect(page.locator(".app-header")).toHaveCount(0);
  await expect(page.locator(".app-footer")).toHaveCount(0);

  await expect(page.getByRole("heading", { name: "Sources" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Practice" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI Studio" })).toBeVisible();
  await expect(page.locator(".workspace-beta-panel")).toHaveCount(3);

  const boxes = await page.locator(".workspace-beta-panel").evaluateAll((panels) =>
    panels.map((panel) => {
      const bounds = panel.getBoundingClientRect();
      return { left: bounds.left, right: bounds.right, width: bounds.width };
    }),
  );
  expect(boxes.every((box) => box.width >= 250)).toBe(true);
  expect(boxes[0].right).toBeLessThanOrEqual(boxes[1].left + 1);
  expect(boxes[1].right).toBeLessThanOrEqual(boxes[2].left + 1);
  expect(boxes[2].right).toBeLessThanOrEqual(1441);

  await page.getByRole("button", { name: "Quiz", exact: true }).first().click();
  await expect(page.getByRole("button", { name: "Quiz", exact: true }).first()).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Mind Map" }).click();
  await expect(page.getByText("Generation is not connected in this UI preview.")).toBeVisible();
});

test("Workspace BETA stays bilingual and contains narrow-screen overflow inside the workspace", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/workspace-beta");
  await page.getByRole("button", { name: "GR", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Πηγές" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Εξάσκηση" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Έξοδος" })).toBeVisible();

  const overflow = await page.locator(".workspace-beta-main").evaluate((main) => ({
    clientWidth: main.clientWidth,
    scrollWidth: main.scrollWidth,
    documentFits: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeGreaterThan(overflow.clientWidth);
  expect(overflow.documentFits).toBe(true);
});
