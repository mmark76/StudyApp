import { expect, test, type Locator, type Page } from "@playwright/test";

const mobileWidths = [360, 390, 412] as const;

async function expectNoTopLevelOverlap(header: Locator) {
  const boxes = await header.locator([
    ".workspace-beta-brand",
    ".workspace-beta-standard-version",
    ".workspace-beta-header-actions > .language-switcher",
    ".workspace-beta-ecosystem-link",
    ".workspace-beta-theme-toggle",
    ".workspace-beta-header-actions > a:not(.workspace-beta-ecosystem-link)",
    ".workspace-beta-info-menu > summary",
  ].join(", ")).evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
    };
  }));

  for (let first = 0; first < boxes.length; first += 1) {
    for (let second = first + 1; second < boxes.length; second += 1) {
      const horizontalOverlap = Math.min(boxes[first].right, boxes[second].right)
        - Math.max(boxes[first].left, boxes[second].left);
      const verticalOverlap = Math.min(boxes[first].bottom, boxes[second].bottom)
        - Math.max(boxes[first].top, boxes[second].top);
      expect(Math.min(horizontalOverlap, verticalOverlap)).toBeLessThanOrEqual(1);
    }
  }
}

async function expectNoRouterError(page: Page) {
  await expect(page.getByText("Unexpected Application Error!", { exact: true })).toHaveCount(0);
  await expect(page.getByText("404 Not Found", { exact: true })).toHaveCount(0);
}

test("Workspace BETA mobile header stays contained without overlapping controls", async ({ page }) => {
  for (const width of mobileWidths) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/#/workspace-beta");

    const header = page.locator(".workspace-beta-header");
    await expect(header).toBeVisible();

    const metrics = await header.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      height: element.getBoundingClientRect().height,
    }));

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
    expect(metrics.height).toBeLessThan(180);
    await expectNoTopLevelOverlap(header);
    await expectNoRouterError(page);
  }
});

test("Workspace BETA mobile header controls keep valid destinations", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/workspace-beta");

  const header = page.locator(".workspace-beta-header");
  const standardVersion = header.locator(".workspace-beta-standard-version");
  const ecosystem = header.locator(".workspace-beta-ecosystem-link");

  await expect(standardVersion).toHaveAttribute("href", "#/");
  await expect(ecosystem).toHaveAttribute("href", "https://markellosecosystem.com/");
  await expect(ecosystem).toHaveAttribute("target", "_blank");

  await standardVersion.click();
  await expect(page).toHaveURL(/\/#\/$/u);
  await expectNoRouterError(page);

  await page.goto("/#/workspace-beta");
  const settings = page.locator(".workspace-beta-header-actions > a:not(.workspace-beta-ecosystem-link)");
  await settings.click();
  await expect(page.locator(".workspace-beta-info-modal")).toBeVisible();
  await expect(page.locator("#workspace-beta-info-modal-title")).toContainText(/Settings|Ρυθμίσεις/u);
  await expectNoRouterError(page);

  await page.getByRole("button", { name: /Close|Κλείσιμο/u }).click();
  const infoMenu = page.locator(".workspace-beta-info-menu");
  await infoMenu.locator("summary").click();
  await expect(page.locator(".workspace-beta-info-popover")).toBeVisible();

  const internalInfoHrefs = await infoMenu.locator("a[href^='#/']").evaluateAll((links) =>
    links.map((link) => link.getAttribute("href")),
  );
  expect(internalInfoHrefs).toEqual([
    "#/important-info",
    "#/legal/license",
    "#/legal/privacy",
    "#/legal/analytics",
    "#/legal/copyright",
  ]);

  await infoMenu.getByText(/Important Info|Σημαντικές πληροφορίες/u).click();
  await expect(page.locator(".workspace-beta-info-modal")).toBeVisible();
  await expectNoRouterError(page);
});
