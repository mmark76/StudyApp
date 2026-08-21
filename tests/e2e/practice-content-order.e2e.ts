import { expect, test } from "@playwright/test";

test("uses the Sources page-header pattern before the responsive Practice cards", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/#/learn");

  const header = page.locator(".workspace-beta-practice-page > .page-heading");
  const manager = page.getByRole("region", { name: "Manage practice content" });
  const optionCards = manager.locator(
    ".practice-content-options > .practice-content-option",
  );
  const importedPanels = manager.locator(
    ".practice-content-lists > .practice-content-list-panel",
  );

  await expect(header.locator(".eyebrow")).toHaveText("PRACTICE CONTENT");
  await expect(header.locator(".eyebrow")).toHaveJSProperty("tagName", "P");
  await expect(header.getByRole("heading", {
    level: 2,
    name: "Manage practice content",
  })).toBeVisible();
  await expect(header.getByText(
    "Add, import or manage your flashcards and practice chapters.",
    { exact: true },
  )).toBeVisible();
  await expect(header.getByText(
    "Import the Chapters CSV first, then the Flashcards CSV.",
    { exact: true },
  )).toHaveAttribute("role", "note");
  await expect(manager).not.toHaveClass(/\bcontent-panel\b/u);
  await expect(page.getByText(
    "Study content is stored locally in this browser and device.",
    { exact: true },
  )).toHaveCount(0);
  await expect(page.getByText("Learn more", { exact: true })).toHaveCount(0);
  await expect(manager.getByRole("group", { name: "Practice content options" }))
    .toHaveAttribute("aria-describedby", "practice-content-add-import-note");
  await expect(manager.locator("#practice-content-add-import-note")).toHaveCount(1);

  await expect(optionCards).toHaveCount(2);
  await expect(
    optionCards.nth(0).getByRole("heading", { level: 3, name: "Practice Chapters" }),
  ).toBeVisible();
  await expect(
    optionCards.nth(1).getByRole("heading", { level: 3, name: "Flashcards" }),
  ).toBeVisible();

  await expect.poll(() => page.evaluate(() => {
    const selectors = [
      ".page-heading .eyebrow",
      "#practice-content-title",
      ".page-heading > p:nth-of-type(2)",
      ".practice-content-page-import-order",
      ".practice-content-option:first-child h3",
      ".practice-content-option:nth-child(2) h3",
    ];
    const elements = selectors.map((selector) => document.querySelector(selector));
    return elements.every((element, index) => element && (
      index === 0
      || Boolean(elements[index - 1]
        && (elements[index - 1].compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING))
    ));
  })).toBe(true);

  const pageSurface = await manager.evaluate((element) => {
    const styles = getComputedStyle(element);
    return {
      borderTopWidth: styles.borderTopWidth,
      boxShadow: styles.boxShadow,
      paddingTop: styles.paddingTop,
    };
  });
  expect(pageSurface).toEqual({
    borderTopWidth: "0px",
    boxShadow: "none",
    paddingTop: "0px",
  });

  await expect(importedPanels).toHaveCount(2);
  await expect(importedPanels.nth(0).locator("h4")).toContainText(
    "Practice Chapters",
  );
  await expect(importedPanels.nth(1).locator("h4")).toContainText("Flashcards");

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
