import { expect, test } from "@playwright/test";

test("keeps practice chapters before flashcards in both Learn sections", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/#/learn");

  const manager = page.getByRole("region", { name: "Manage practice content" });
  const optionCards = manager.locator(
    ".practice-content-options > .practice-content-option",
  );
  const importedPanels = manager.locator(
    ".practice-content-lists > .practice-content-list-panel",
  );

  await expect(optionCards).toHaveCount(2);
  await expect(
    optionCards.nth(0).getByRole("heading", { name: "Practice Chapters" }),
  ).toBeVisible();
  await expect(
    optionCards.nth(1).getByRole("heading", { name: "Flashcards" }),
  ).toBeVisible();

  await expect(importedPanels).toHaveCount(2);
  await expect(importedPanels.nth(0).locator("h5")).toContainText(
    "Practice Chapters",
  );
  await expect(importedPanels.nth(1).locator("h5")).toContainText("Flashcards");

  const desktopOptionBoxes = await optionCards.evaluateAll((cards) =>
    cards.map((card) => {
      const box = card.getBoundingClientRect();
      return { x: box.x, y: box.y };
    }),
  );
  const desktopImportedBoxes = await importedPanels.evaluateAll((panels) =>
    panels.map((panel) => {
      const box = panel.getBoundingClientRect();
      return { x: box.x, y: box.y };
    }),
  );

  expect(desktopOptionBoxes[0].x).toBeLessThan(desktopOptionBoxes[1].x);
  expect(Math.abs(desktopOptionBoxes[0].y - desktopOptionBoxes[1].y)).toBeLessThanOrEqual(1);
  expect(desktopImportedBoxes[0].x).toBeLessThan(desktopImportedBoxes[1].x);
  expect(Math.abs(desktopImportedBoxes[0].y - desktopImportedBoxes[1].y)).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 390, height: 844 });

  const mobileOptionBoxes = await optionCards.evaluateAll((cards) =>
    cards.map((card) => {
      const box = card.getBoundingClientRect();
      return { bottom: box.bottom, y: box.y };
    }),
  );
  const mobileImportedBoxes = await importedPanels.evaluateAll((panels) =>
    panels.map((panel) => {
      const box = panel.getBoundingClientRect();
      return { bottom: box.bottom, y: box.y };
    }),
  );

  expect(mobileOptionBoxes[1].y).toBeGreaterThanOrEqual(
    mobileOptionBoxes[0].bottom,
  );
  expect(mobileImportedBoxes[1].y).toBeGreaterThanOrEqual(
    mobileImportedBoxes[0].bottom,
  );
});
