import { expect, test, type Page } from "@playwright/test";

const mobileWidths = [360, 390, 412] as const;

async function expectNoRouterError(page: Page) {
  await expect(page.getByText("Unexpected Application Error!", { exact: true })).toHaveCount(0);
  await expect(page.getByText("404 Not Found", { exact: true })).toHaveCount(0);
}

test("Workspace BETA mobile shell is compact and shows one panel at a time", async ({ page }) => {
  for (const width of mobileWidths) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/#/workspace-beta");

    const mobileHeader = page.locator(".workspace-beta-mobile-header");
    const desktopHeader = page.locator(".workspace-beta-functional-shell > .workspace-beta-header");
    const tabs = page.locator(".workspace-beta-mobile-panel-tabs");

    await expect(mobileHeader).toBeVisible();
    await expect(desktopHeader).toBeHidden();
    await expect(tabs).toBeVisible();
    await expect(tabs.locator("button")).toHaveCount(4);

    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      headerHeight: document.querySelector(".workspace-beta-mobile-header")
        ?.getBoundingClientRect().height ?? 0,
    }));

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
    expect(metrics.headerHeight).toBeLessThan(70);

    const sources = page.locator(".workspace-beta-panel-sources");
    const knowledge = page.locator(".workspace-beta-panel-knowledge");
    const practice = page.locator(".workspace-beta-panel-practice");
    const ai = page.locator(".workspace-beta-panel-studio");

    await expect(sources).toBeVisible();
    await expect(knowledge).toBeHidden();
    await expect(practice).toBeHidden();
    await expect(ai).toBeHidden();

    await tabs.getByRole("button", { name: /Knowledge|Γνώση/u }).click();
    await expect(sources).toBeHidden();
    await expect(knowledge).toBeVisible();

    await tabs.getByRole("button", { name: /Practice|Εξάσκηση/u }).click();
    await expect(knowledge).toBeHidden();
    await expect(practice).toBeVisible();

    await tabs.getByRole("button", { name: /^AI$/u }).click();
    await expect(practice).toBeHidden();
    await expect(ai).toBeVisible();

    await tabs.getByRole("button", { name: /Sources|Πηγές/u }).click();
    await expect(ai).toBeHidden();
    await expect(sources).toBeVisible();
    await expectNoRouterError(page);
  }
});

test("Workspace BETA mobile menu keeps navigation and modal actions valid", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/workspace-beta");

  const menu = page.locator(".workspace-beta-mobile-menu");
  const summary = menu.locator("summary");

  await summary.click();
  await expect(page.locator(".workspace-beta-mobile-menu-popover")).toBeVisible();

  const standardVersion = menu.getByRole("link", { name: /Back to Standard Version|Επιστροφή στην κανονική έκδοση/u });
  const ecosystem = menu.getByRole("link", { name: /Back to markellosecosystem|Πίσω στο markellosecosystem/u });
  await expect(standardVersion).toHaveAttribute("href", "#/");
  await expect(ecosystem).toHaveAttribute("href", "https://markellosecosystem.com/");
  await expect(ecosystem).toHaveAttribute("target", "_blank");

  const beforeTheme = await page.locator("html").getAttribute("data-workspace-theme");
  await menu.getByRole("button", { name: /Theme|Θέμα/u }).click();
  const expectedTheme = beforeTheme === "dark" ? "light" : "dark";
  await expect(page.locator("html")).toHaveAttribute("data-workspace-theme", expectedTheme);

  await summary.click();
  await menu.getByRole("button", { name: /Settings|Ρυθμίσεις/u }).click();
  await expect(page.locator(".workspace-beta-info-modal")).toBeVisible();
  await expect(page.locator("#workspace-beta-info-modal-title")).toContainText(/Settings|Ρυθμίσεις/u);
  await expectNoRouterError(page);

  await page.getByRole("button", { name: /Close|Κλείσιμο/u }).click();
  await summary.click();
  await menu.getByRole("button", { name: /Info|Πληροφορίες/u }).click();
  await expect(page.locator(".workspace-beta-info-modal")).toBeVisible();
  await expect(page.locator("#workspace-beta-info-modal-title")).toContainText(/Important Info|Σημαντικές πληροφορίες/u);
  await expectNoRouterError(page);
});

test("Workspace BETA desktop keeps the existing four-panel header and layout", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");

  await expect(page.locator(".workspace-beta-mobile-header")).toBeHidden();
  await expect(page.locator(".workspace-beta-mobile-panel-tabs")).toBeHidden();
  await expect(page.locator(".workspace-beta-functional-shell > .workspace-beta-header")).toBeVisible();

  const panels = page.locator(".workspace-beta-functional-panel");
  await expect(panels).toHaveCount(4);
  for (let index = 0; index < 4; index += 1) {
    await expect(panels.nth(index)).toBeVisible();
  }
});
