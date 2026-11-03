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

async function workspaceFrame(page: Page, name: string): Promise<FrameLocator> {
  const iframe = page.locator(`iframe[name="${name}"]`);
  await expect(iframe).toBeAttached();
  return page.frameLocator(`iframe[name="${name}"]`);
}

async function expectWorkspaceControlsUseActiveFont(page: Page, fontChoice: FontChoice): Promise<void> {
  const frames = await Promise.all([
    "studyapp-workspace-sources",
    "studyapp-workspace-knowledge",
    "studyapp-workspace-practice",
    "studyapp-workspace-ai",
  ].map((name) => workspaceFrame(page, name)));

  await Promise.all(frames.map((frame) => expectFrameControlsUseActiveFont(frame, fontChoice)));
}

test("Workspace BETA desktop preserves the selected font in every panel and Summary form", async ({ page }) => {
  await setFontChoice(page, "serif");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  await expectWorkspaceControlsUseActiveFont(page, "serif");

  const practice = page.frameLocator('iframe[name="studyapp-workspace-practice"]');
  await practice.getByRole("link", { name: "Create a summary" }).click();
  await expect(practice.getByRole("heading", { name: "Summary and Main Points" })).toBeVisible();
  await expect(practice.locator(".summary-page textarea")).toHaveCount(2);
  await expectFrameControlsUseActiveFont(await workspaceFrame(page, "studyapp-workspace-practice"), "serif");
});

test("Workspace BETA mobile Greek preserves the selected font in every panel", async ({ page }) => {
  await setFontChoice(page, "rounded");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/workspace-beta");
  await page.getByRole("button", { name: "GR", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Πηγές & Υλικό", exact: true })).toBeVisible();
  await expectWorkspaceControlsUseActiveFont(page, "rounded");

  await page.getByRole("button", { name: "Εξάσκηση", exact: true }).click();
  await expect(page.locator(".workspace-beta-panel-practice")).toBeVisible();
  const practice = page.frameLocator('iframe[name="studyapp-workspace-practice"]');
  await practice.getByRole("link", { name: /Create a summary|Δημιουργία περίληψης/u }).click();
  await expect(practice.getByRole("heading", { name: "Περίληψη και βασικά σημεία" })).toBeVisible();
  await expectFrameControlsUseActiveFont(await workspaceFrame(page, "studyapp-workspace-practice"), "rounded");
});
