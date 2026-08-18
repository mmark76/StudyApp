import { expect, type Locator, type Page, test } from "@playwright/test";

async function makeDocumentScrollable(page: Page) {
  await page.locator(".app-main").evaluate((main) => {
    main.style.minHeight = "2400px";
  });
}

async function scrollDocumentTo(page: Page, top: number) {
  await page.evaluate((scrollTop) => window.scrollTo(0, scrollTop), top);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
}

async function activateWithoutChangingScroll(link: Locator) {
  await link.evaluate((element) => (element as HTMLAnchorElement).click());
}

async function expectDocumentTopAndVisibleHeader(page: Page) {
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  const headerPosition = await page.locator(".app-header").evaluate((header) => {
    const bounds = header.getBoundingClientRect();
    return {
      bottom: bounds.bottom,
      top: bounds.top,
      viewportHeight: window.innerHeight,
    };
  });
  expect(headerPosition.top).toBeGreaterThanOrEqual(0);
  expect(headerPosition.bottom).toBeLessThanOrEqual(headerPosition.viewportHeight);
}

async function expectRouteTopAndVisibleHeader(page: Page) {
  await expectDocumentTopAndVisibleHeader(page);
  await expect(page.locator(".app-main")).toBeFocused();
}

async function captureLanguageReflowRegion(page: Page) {
  return page.evaluate(() => {
    const anchor = document.querySelector<HTMLElement>(
      "#imported-practice-chapters-title",
    );
    if (!anchor) throw new Error("A visible language-reflow anchor was not found.");
    const bounds = anchor.getBoundingClientRect();
    return {
      anchorBottom: Math.round(bounds.bottom),
      anchorTop: Math.round(bounds.top),
      documentHeight: document.documentElement.scrollHeight,
      lineHeight: Number.parseFloat(getComputedStyle(anchor).lineHeight) || bounds.height,
      scrollY: window.scrollY,
      text: anchor.textContent?.trim().slice(0, 80) ?? "",
      viewportHeight: window.innerHeight,
    };
  });
}

test("main-route navigation starts at the document top without resetting same-route state changes", async ({
  page,
}) => {
  await page.goto("/#/library");
  await expect(page.getByRole("heading", { name: "Library" })).toBeVisible();
  await expectRouteTopAndVisibleHeader(page);
  await makeDocumentScrollable(page);

  const englishNavigation = page.getByRole("navigation", { name: "Main navigation" });
  await scrollDocumentTo(page, 1000);
  await activateWithoutChangingScroll(
    englishNavigation.getByRole("link", { name: "Sources" }),
  );
  await expect(page).toHaveURL(/\/#\/sources$/u);
  await expectRouteTopAndVisibleHeader(page);

  await scrollDocumentTo(page, 1100);
  await activateWithoutChangingScroll(
    englishNavigation.getByRole("link", { name: "Practice" }),
  );
  await expect(page).toHaveURL(/\/#\/learn$/u);
  await expectRouteTopAndVisibleHeader(page);

  await page.locator("#imported-practice-chapters-title").scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
  const beforeLanguageRegion = await captureLanguageReflowRegion(page);
  await page.getByRole("button", { name: "GR" }).evaluate(
    (button) => (button as HTMLButtonElement).click(),
  );
  await expect(
    page.getByRole("navigation", { name: "Κύρια πλοήγηση" }),
  ).toBeVisible();
  const afterLanguageRegion = await captureLanguageReflowRegion(page);
  console.info("language reflow", { beforeLanguageRegion, afterLanguageRegion });
  expect(afterLanguageRegion.scrollY).toBeGreaterThan(500);
  expect(afterLanguageRegion.anchorBottom).toBeGreaterThan(0);
  expect(afterLanguageRegion.anchorTop).toBeLessThan(afterLanguageRegion.viewportHeight);
  expect(Math.abs(afterLanguageRegion.anchorTop - beforeLanguageRegion.anchorTop))
    .toBeLessThanOrEqual(Math.ceil(Math.max(
      beforeLanguageRegion.lineHeight,
      afterLanguageRegion.lineHeight,
    )));
  await expect(page.locator(".app-main")).toBeFocused();

  await page.reload();
  await expect(page).toHaveURL(/\/#\/learn$/u);
  await expectRouteTopAndVisibleHeader(page);
});

test("Greek narrow navigation starts at top while browser history restores prior route positions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/library");
  await makeDocumentScrollable(page);
  await page.getByRole("button", { name: "GR" }).click();

  const greekNavigation = page.getByRole("navigation", { name: "Κύρια πλοήγηση" });
  await scrollDocumentTo(page, 800);
  await activateWithoutChangingScroll(
    greekNavigation.getByRole("link", { name: "Πηγές" }),
  );
  await expect(page).toHaveURL(/\/#\/sources$/u);
  await expectRouteTopAndVisibleHeader(page);

  await scrollDocumentTo(page, 1000);
  await activateWithoutChangingScroll(
    greekNavigation.getByRole("link", { name: "Εξάσκηση" }),
  );
  await expect(page).toHaveURL(/\/#\/learn$/u);
  await expectRouteTopAndVisibleHeader(page);

  await scrollDocumentTo(page, 1200);
  await page.goBack();
  await expect(page).toHaveURL(/\/#\/sources$/u);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(1000);

  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  )).toBe(true);
});
