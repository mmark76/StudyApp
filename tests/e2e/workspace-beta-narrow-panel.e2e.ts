import { expect, test, type Frame, type Locator, type Page } from "@playwright/test";

const overflowTolerance = 1;

interface OverflowMeasurement {
  clientWidth: number;
  scrollWidth: number;
}

interface FrameOverflowMeasurements {
  body: OverflowMeasurement;
  document: OverflowMeasurement;
  root: OverflowMeasurement;
}

async function seedCoreKnowledgeChapters(page: Page) {
  await page.goto("/");
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("generic-study-app");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction("settings", "readwrite");
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };

        const units = Array.from({ length: 13 }, (_, index) => ({
          id: `narrow-core-unit-${index + 1}`,
          number: index + 1,
          title: `Chapter title ${index + 1}`,
          objectives: [`Learning goal ${index + 1}`],
          summary: [`Key point ${index + 1}`],
          keyTerms: [`Term ${index + 1}`],
        }));
        transaction.objectStore("settings").put({
          key: "imported-study-units",
          value: units,
        });
        transaction.objectStore("settings").put({
          key: "imported-flashcards",
          value: [],
        });
      };
    });
  });
}

async function resizePanelTo(
  page: Page,
  panelIndex: 0 | 1,
  targetWidth: number,
) {
  const panel = page.locator(".workspace-beta-functional-panel").nth(panelIndex);
  const divider = page.locator(".workspace-beta-resizer").nth(panelIndex);
  const panelBox = await panel.boundingBox();
  const dividerBox = await divider.boundingBox();
  if (!panelBox || !dividerBox) throw new Error("Workspace panel resize controls were not measurable.");

  const delta = targetWidth - panelBox.width;
  const startX = dividerBox.x + dividerBox.width / 2;
  const startY = dividerBox.y + dividerBox.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + delta, startY, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => (await panel.boundingBox())?.width ?? 0).toBeCloseTo(targetWidth, 0);
}

async function expectFrameToFit(
  frame: Frame,
  rootSelector: string,
): Promise<FrameOverflowMeasurements> {
  const measurements = await frame.evaluate((selector) => {
    const root = document.querySelector<HTMLElement>(selector);
    if (!root) throw new Error(`Missing overflow root: ${selector}`);
    const measure = (element: HTMLElement): OverflowMeasurement => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    });
    return {
      document: measure(document.documentElement),
      body: measure(document.body),
      root: measure(root),
    };
  }, rootSelector);

  for (const measurement of Object.values(measurements)) {
    expect(measurement.scrollWidth).toBeLessThanOrEqual(
      measurement.clientWidth + overflowTolerance,
    );
  }
  return measurements;
}

async function expectInside(
  container: Locator,
  children: Locator,
) {
  const containerBox = await container.boundingBox();
  if (!containerBox) throw new Error("Containment target was not measurable.");
  const childBoxes = await children.evaluateAll((elements) => elements.map((element) => {
    const box = element.getBoundingClientRect();
    return { left: box.left, right: box.right, width: box.width, height: box.height };
  }));

  expect(childBoxes.length).toBeGreaterThan(0);
  for (const box of childBoxes) {
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
    expect(box.left).toBeGreaterThanOrEqual(containerBox.x - overflowTolerance);
    expect(box.right).toBeLessThanOrEqual(
      containerBox.x + containerBox.width + overflowTolerance,
    );
  }
}

async function expectFrameElementsInsideViewport(frame: Frame, selector: string) {
  const result = await frame.locator(selector).evaluateAll((elements) => ({
    viewportWidth: document.documentElement.clientWidth,
    boxes: elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { left: box.left, right: box.right, width: box.width, height: box.height };
    }),
  }));

  expect(result.boxes.length).toBeGreaterThan(0);
  for (const box of result.boxes) {
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
    expect(box.left).toBeGreaterThanOrEqual(-overflowTolerance);
    expect(box.right).toBeLessThanOrEqual(result.viewportWidth + overflowTolerance);
  }
}

async function chapterRowCount(frame: Frame): Promise<number> {
  const rows = await frame.locator(".core-knowledge-chapter-button").evaluateAll((buttons) => (
    [...new Set(buttons.map((button) => Math.round(button.getBoundingClientRect().top)))]
  ));
  return rows.length;
}

test("narrow Workspace Sources wraps cards, copy, buttons, and headers in both themes and Greek", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");
  await resizePanelTo(page, 0, 262);

  const sourcesPanel = page.locator(".workspace-beta-panel-sources");
  await expectInside(
    sourcesPanel,
    sourcesPanel.locator(".workspace-beta-functional-panel-header h2, .workspace-beta-panel-tools button"),
  );

  const sources = page.frame({ name: "studyapp-workspace-sources" });
  if (!sources) throw new Error("Sources frame was not available.");
  const description = sources.getByText(
    "Choose how you want to work with your study material.",
    { exact: true },
  );
  await expect(description).toBeVisible();
  await expect(sources.getByRole("heading", { name: "Sources & Materials" })).toBeVisible();
  await expect(sources.getByRole("link", { name: "Library", exact: true })).toBeVisible();
  await expect(sources.getByRole("link", { name: "Structured Study", exact: true })).toBeVisible();
  const wrappedDescription = await description.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      height: element.getBoundingClientRect().height,
      lineHeight: Number.parseFloat(style.lineHeight),
      whiteSpace: style.whiteSpace,
    };
  });
  expect(wrappedDescription.whiteSpace).toBe("normal");
  expect(wrappedDescription.height).toBeGreaterThan(wrappedDescription.lineHeight * 1.5);

  const lightMeasurements = await expectFrameToFit(sources, ".workspace-beta-sources-page");
  await expectFrameElementsInsideViewport(
    sources,
    ".workspace-beta-sources-page, .page-heading, .dashboard-action-card, .dashboard-action-card .button",
  );

  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect.poll(() => sources.evaluate(() => document.documentElement.dataset.workspaceTheme)).toBe("dark");
  const darkMeasurements = await expectFrameToFit(sources, ".workspace-beta-sources-page");
  await expectFrameElementsInsideViewport(
    sources,
    ".workspace-beta-sources-page, .page-heading, .dashboard-action-card, .dashboard-action-card .button",
  );

  await page.getByRole("button", { name: "GR", exact: true }).click();
  await expect(sources.getByRole("heading", { name: "Πηγές & Υλικό" })).toBeVisible();
  await expect(sources.getByRole("link", { name: "Βιβλιοθήκη", exact: true })).toBeVisible();
  await expect(sources.getByRole("link", { name: "Δομημένη Μελέτη", exact: true })).toBeVisible();
  await expectInside(
    sourcesPanel,
    sourcesPanel.locator(".workspace-beta-functional-panel-header h2, .workspace-beta-panel-tools button"),
  );
  const greekMeasurements = await expectFrameToFit(sources, ".workspace-beta-sources-page");
  await expectFrameElementsInsideViewport(
    sources,
    ".workspace-beta-sources-page, .page-heading, .dashboard-action-card, .dashboard-action-card .button",
  );

  expect(lightMeasurements.document.clientWidth).toBe(262);
  expect(darkMeasurements.document.clientWidth).toBe(262);
  expect(greekMeasurements.document.clientWidth).toBe(262);
});

test("narrow Core Knowledge keeps chapters 01-13 visible through repeated resizing and both themes", async ({ page }) => {
  await seedCoreKnowledgeChapters(page);
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");
  await resizePanelTo(page, 1, 242);

  const knowledgePanel = page.locator(".workspace-beta-panel-knowledge");
  await expectInside(
    knowledgePanel,
    knowledgePanel.locator(".workspace-beta-functional-panel-header h2, .workspace-beta-panel-tools button"),
  );

  const knowledge = page.frame({ name: "studyapp-workspace-knowledge" });
  if (!knowledge) throw new Error("Core Knowledge frame was not available.");
  const chapterButtons = knowledge.locator(".core-knowledge-chapter-button");
  await expect(chapterButtons).toHaveCount(13);
  await expect(chapterButtons.first()).toHaveText("01");
  await expect(chapterButtons.last()).toHaveText("13");
  await expectFrameToFit(knowledge, ".core-knowledge-page");
  await expectFrameElementsInsideViewport(knowledge, ".core-knowledge-chapter-button");
  const firstNarrowRows = await chapterRowCount(knowledge);

  await resizePanelTo(page, 1, 382);
  await expectFrameToFit(knowledge, ".core-knowledge-page");
  await expectFrameElementsInsideViewport(knowledge, ".core-knowledge-chapter-button");
  const wideRows = await chapterRowCount(knowledge);
  expect(wideRows).toBeLessThan(firstNarrowRows);

  await resizePanelTo(page, 1, 242);
  await expectFrameToFit(knowledge, ".core-knowledge-page");
  await expectFrameElementsInsideViewport(knowledge, ".core-knowledge-chapter-button");
  expect(await chapterRowCount(knowledge)).toBe(firstNarrowRows);

  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect.poll(() => knowledge.evaluate(() => document.documentElement.dataset.workspaceTheme)).toBe("dark");
  const darkMeasurements = await expectFrameToFit(knowledge, ".core-knowledge-page");
  await expectFrameElementsInsideViewport(knowledge, ".core-knowledge-chapter-button");
  expect(darkMeasurements.document.clientWidth).toBe(242);
});

test("Standard Sources retains its existing document minimum and two-column presentation", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/sources");

  const standardPresentation = await page.evaluate(() => ({
    bodyMinWidth: getComputedStyle(document.body).minWidth,
    columns: getComputedStyle(document.querySelector<HTMLElement>(".dashboard-action-grid")!).gridTemplateColumns,
    hasWorkspaceEmbed: document.querySelector(".workspace-panel-embed-shell") !== null,
  }));
  expect(standardPresentation.bodyMinWidth).toBe("320px");
  expect(standardPresentation.columns.split(" ")).toHaveLength(2);
  expect(standardPresentation.hasWorkspaceEmbed).toBe(false);
});
