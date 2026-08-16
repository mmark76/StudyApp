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
    englishNavigation.getByRole("link", { name: "Structured Study" }),
  );
  await expect(page).toHaveURL(/\/#\/study\/theory$/u);
  await expectRouteTopAndVisibleHeader(page);

  await scrollDocumentTo(page, 1100);
  await activateWithoutChangingScroll(
    englishNavigation.getByRole("link", { name: "Learn & Practice" }),
  );
  await expect(page).toHaveURL(/\/#\/learn$/u);
  await expectRouteTopAndVisibleHeader(page);

  await scrollDocumentTo(page, 900);
  const beforeLanguageChange = await page.evaluate(() => window.scrollY);
  await page.getByRole("button", { name: "GR" }).evaluate(
    (button) => (button as HTMLButtonElement).click(),
  );
  await expect(
    page.getByRole("navigation", { name: "Κύρια πλοήγηση" }),
  ).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(
    beforeLanguageChange,
  );

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
    greekNavigation.getByRole("link", { name: "Δομημένη Μελέτη" }),
  );
  await expect(page).toHaveURL(/\/#\/study\/theory$/u);
  await expectRouteTopAndVisibleHeader(page);

  await scrollDocumentTo(page, 1000);
  await activateWithoutChangingScroll(
    greekNavigation.getByRole("link", { name: "Μάθηση & Εξάσκηση" }),
  );
  await expect(page).toHaveURL(/\/#\/learn$/u);
  await expectRouteTopAndVisibleHeader(page);

  await scrollDocumentTo(page, 1200);
  await page.goBack();
  await expect(page).toHaveURL(/\/#\/study\/theory$/u);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(1000);

  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  )).toBe(true);
});
