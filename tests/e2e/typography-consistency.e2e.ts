import { expect, test, type FrameLocator, type Page } from "@playwright/test";

type FontChoice = "serif" | "rounded";

async function setFontChoice(page: Page, fontChoice: FontChoice): Promise<void> {
  await page.goto("/");
  await page.evaluate(async (choice) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("generic-study-app");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction("settings", "readwrite");
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => { database.close(); resolve(); };
        transaction.objectStore("settings").put({
          key: "appearance-settings",
          value: {
            colorScheme: "amber",
            backgroundTone: "warm",
            fontChoice: choice,
            textSize: "comfortable",
            uiDensity: "comfortable",
          },
        });
      };
    });
  }, fontChoice);
}

async function expectFrameControlsUseActiveFont(frame: FrameLocator, fontChoice: FontChoice): Promise<void> {
  await expect.poll(() => frame.locator("html").getAttribute("data-font-choice")).toBe(fontChoice);
  const mismatch = await frame.locator("body").evaluate(() => {
    const activeFont = getComputedStyle(document.documentElement).fontFamily;
    return [...document.querySelectorAll<HTMLElement>("button, input, select, textarea")]
      .filter((element) => getComputedStyle(element).display !== "none")
      .find((element) => getComputedStyle(element).fontFamily !== activeFont)
      ?.outerHTML;
  });
  expect(mismatch).toBeUndefined();
}

async function expectShellControlsUseActiveFont(page: Page) {
  const mismatch = await page.locator(".workspace-beta-phase-one").evaluate((shell) => {
    const activeFont = getComputedStyle(document.documentElement).fontFamily;
    return [...shell.querySelectorAll<HTMLElement>("button, input, select, textarea")]
      .filter((element) => getComputedStyle(element).display !== "none")
      .find((element) => getComputedStyle(element).fontFamily !== activeFont)
      ?.outerHTML;
  });
  expect(mismatch).toBeUndefined();
}

test("Workspace BETA desktop preserves the selected font in sources, tools and Summary form", async ({ page }) => {
  await setFontChoice(page, "serif");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  await expectFrameControlsUseActiveFont(page.frameLocator('iframe[name="studyapp-workspace-sources"]'), "serif");
  await expectShellControlsUseActiveFont(page);
  await page.getByRole("button", { name: "Summary of Uploaded Material", exact: true }).click();
  const workspace = page.frameLocator('iframe[name="studyapp-workspace-workspace"]');
  await workspace.getByRole("button", { name: "Choose material and create a summary" }).click();
  await expectFrameControlsUseActiveFont(workspace, "serif");
  await expect(workspace.locator(".summary-page textarea")).toHaveCount(2);
  await expectFrameControlsUseActiveFont(workspace, "serif");
});

test("Workspace BETA mobile Greek preserves the selected font across all three panels", async ({ page }) => {
  await setFontChoice(page, "rounded");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/workspace-beta");
  await page.getByRole("button", { name: "GR", exact: true }).click();

  await expectFrameControlsUseActiveFont(page.frameLocator('iframe[name="studyapp-workspace-sources"]'), "rounded");
  await expectShellControlsUseActiveFont(page);
  await page.getByRole("button", { name: "Χώρος εργασίας", exact: true }).click();
  await expect(page.getByRole("heading", { name: "AI Studio - Χώρος εργασίας", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Εργαλεία", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Εργαλεία με υποστήριξη AI", exact: true })).toBeVisible();
  await expectShellControlsUseActiveFont(page);
});
