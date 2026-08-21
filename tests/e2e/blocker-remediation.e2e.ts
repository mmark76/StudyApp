import { expect, test } from "@playwright/test";

const chaptersHeader =
  "Chapter number,Chapter title,What should you learn?,Key points,Important terms";

function chaptersCsv(row: string) {
  return {
    name: "practice-chapters.csv",
    mimeType: "text/csv",
    buffer: Buffer.from([chaptersHeader, row].join("\n"), "utf8"),
  };
}

async function seedProgressForOnlyImportedCard(page: import("@playwright/test").Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("generic-study-app");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction(["settings", "cardProgress"], "readwrite");
        transaction.onabort = () => reject(
          transaction.error ?? new Error("Progress setup was aborted."),
        );
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };

        const cardsRequest = transaction.objectStore("settings").get("imported-flashcards");
        cardsRequest.onerror = () => transaction.abort();
        cardsRequest.onsuccess = () => {
          const cards = cardsRequest.result?.value;
          if (!Array.isArray(cards) || cards.length !== 1 || typeof cards[0]?.id !== "string") {
            transaction.abort();
            return;
          }
          transaction.objectStore("cardProgress").put({
            cardId: cards[0].id,
            score: 2,
            repetitions: 3,
            intervalDays: 7,
            nextReviewAt: "2026-08-27T00:00:00.000Z",
            lastReviewedAt: "2026-08-20T00:00:00.000Z",
            lapses: 0,
          });
        };
      };
    });
  });
}

async function readImportedPracticeState(page: import("@playwright/test").Page) {
  return page.evaluate(async () => new Promise<{
    cards: Array<{ id: string; unitId: string }>;
    progress: Array<{ cardId: string; repetitions: number }>;
    units: Array<{
      id: string;
      keyTerms: string[];
      number: number;
      objectives: string[];
      summary: string[];
      title: string;
    }>;
  }>((resolve, reject) => {
    const request = indexedDB.open("generic-study-app");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction(["settings", "cardProgress"], "readonly");
      transaction.onerror = () => reject(transaction.error);
      const unitsRequest = transaction.objectStore("settings").get("imported-study-units");
      const cardsRequest = transaction.objectStore("settings").get("imported-flashcards");
      const progressRequest = transaction.objectStore("cardProgress").getAll();
      transaction.oncomplete = () => {
        database.close();
        resolve({
          units: Array.isArray(unitsRequest.result?.value) ? unitsRequest.result.value : [],
          cards: Array.isArray(cardsRequest.result?.value) ? cardsRequest.result.value : [],
          progress: progressRequest.result,
        });
      };
    };
  }));
}

test("DATA-04 confirms same-number chapter replacement and preserves linked state", async ({ page }) => {
  await page.goto("/#/learn");
  const manager = page.getByRole("region", { name: "Manage practice content" });
  const chaptersInput = manager.locator('input[name="chapters-csv"]');

  await chaptersInput.setInputFiles(chaptersCsv(
    "50,Initial title,Initial goal,Initial point,initial-term",
  ));
  await expect(manager.getByRole("status")).toHaveText("1 practice chapter saved.");

  await manager.locator('input[name="flashcards-csv"]').setInputFiles({
    name: "practice-flashcards.csv",
    mimeType: "text/csv",
    buffer: Buffer.from([
      "Chapter number,Question,Answer,Keywords",
      "50,Linked question?,Linked answer,linked",
    ].join("\n"), "utf8"),
  });
  await expect(manager.getByRole("status")).toHaveText("1 flashcard saved.");

  const promptPromise = page.waitForEvent("dialog");
  const renamePromise = manager
    .getByRole("button", { name: "Rename practice chapter Initial title" })
    .click();
  const prompt = await promptPromise;
  expect(prompt.type()).toBe("prompt");
  await prompt.accept("User edited title");
  await renamePromise;
  await expect(manager.getByText("50. User edited title", { exact: true })).toBeVisible();
  await seedProgressForOnlyImportedCard(page);

  const before = await readImportedPracticeState(page);
  expect(before.units).toHaveLength(1);
  expect(before.cards).toHaveLength(1);
  expect(before.progress).toHaveLength(1);

  const replacement = chaptersCsv(
    "50,CSV replacement title,CSV replacement goal,CSV replacement point,csv-term",
  );
  const cancelDialogPromise = page.waitForEvent("dialog");
  const cancelImportPromise = chaptersInput.setInputFiles(replacement);
  const cancelDialog = await cancelDialogPromise;
  expect(cancelDialog.type()).toBe("confirm");
  expect(cancelDialog.message()).toContain("Chapter import preview");
  expect(cancelDialog.message()).toContain("Add: 0");
  expect(cancelDialog.message()).toContain("Update with changed metadata: 1");
  expect(cancelDialog.message()).toContain("title, learning goals, key points, important terms");
  expect(cancelDialog.message()).toContain("Linked flashcards and saved progress will stay connected");
  await cancelDialog.dismiss();
  await cancelImportPromise;

  await expect(manager.getByRole("status")).toHaveText(
    "Import cancelled. Existing practice chapters are unchanged.",
  );
  await expect.poll(() => readImportedPracticeState(page)).toEqual(before);

  const acceptDialogPromise = page.waitForEvent("dialog");
  const acceptImportPromise = chaptersInput.setInputFiles(replacement);
  const acceptDialog = await acceptDialogPromise;
  await acceptDialog.accept();
  await acceptImportPromise;
  await expect(manager.getByRole("status")).toHaveText("1 practice chapter saved.");

  const after = await readImportedPracticeState(page);
  expect(after.units).toEqual([{
    id: before.units[0].id,
    number: 50,
    title: "CSV replacement title",
    objectives: ["CSV replacement goal"],
    summary: ["CSV replacement point"],
    keyTerms: ["csv-term"],
  }]);
  expect(after.cards).toEqual(before.cards);
  expect(after.progress).toEqual(before.progress);
  expect(after.cards[0].unitId).toBe(after.units[0].id);
  expect(after.progress[0].cardId).toBe(after.cards[0].id);
});

test("WB-01 traps modal focus, isolates a late PWA toast, and restores the invoker", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  const settings = page.getByRole("link", { name: "Settings", exact: true });
  await settings.click();
  const modal = page.locator(".workspace-beta-info-modal");
  const close = page.getByRole("button", { name: "Close" });
  const modalFrame = page.frameLocator('iframe[name="studyapp-workspace-info-modal"]');
  await expect(modalFrame.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  await expect(close).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await expect.poll(() => page.evaluate(() => (
    document.activeElement?.getAttribute("name")
  ))).toBe("studyapp-workspace-info-modal");
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Tab");
  await expect.poll(() => page.evaluate(() => (
    document.activeElement?.getAttribute("name")
  ))).toBe("studyapp-workspace-info-modal");
  await page.keyboard.press("Shift+Tab");
  await expect(close).toBeFocused();

  await page.evaluate(() => window.__STUDYAPP_E2E_PWA_UPDATE__?.show("success"));
  const toast = page.locator(".pwa-update-toast");
  await expect(toast).toBeVisible();
  await expect.poll(() => toast.evaluate((element) => (element as HTMLElement).inert)).toBe(true);
  await expect.poll(() => page.evaluate(() => (
    window.__STUDYAPP_E2E_PWA_UPDATE__?.getState().isAvailable
  ))).toBe(true);
  await expect(close).toBeFocused();

  await close.click();
  await expect(modal).toHaveCount(0);
  await expect(settings).toBeFocused();
  await expect.poll(() => toast.evaluate((element) => (element as HTMLElement).inert)).toBe(false);
  await toast.getByRole("button", { name: "Later" }).click();

  const infoMenu = page.locator(".workspace-beta-info-menu");
  await infoMenu.locator("summary").click();
  const importantInfo = page.getByRole("link", { name: "Important Info" });
  await importantInfo.click();
  await expect(page.getByRole("heading", { name: "Important Info", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(importantInfo).toBeFocused();
  await expect(infoMenu).toHaveAttribute("open", "");
});

test("WB-02 leaves focus stable on load and hover while retaining explicit frame entry", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.goto("/#/workspace-beta");
    await expect(page.locator("iframe.workspace-beta-frame")).toHaveCount(4);
    await expect(page.frameLocator('iframe[name="studyapp-workspace-ai"]')
      .getByRole("heading", { name: "AI Assistant", exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => (
      document.activeElement instanceof HTMLIFrameElement
    ))).toBe(false);
  }

  const settings = page.getByRole("link", { name: "Settings", exact: true });
  const frames = page.locator("iframe.workspace-beta-frame");
  for (let index = 0; index < 4; index += 1) {
    await settings.focus();
    await expect(settings).toBeFocused();
    await frames.nth(index).hover();
    await expect(settings).toBeFocused();
  }

  await frames.first().focus();
  await expect(frames.first()).toBeFocused();
});

test("WB-03 skip link keeps the Workspace route and visibly focuses its main landmark", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  const skipLink = page.locator(".workspace-beta-skip");
  const main = page.locator("#workspace-beta-main");
  await skipLink.focus();
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/#\/workspace-beta$/u);
  await expect(main).toBeVisible();
  await expect(main).toHaveAttribute("tabindex", "-1");
  await expect(main).toBeFocused();
  await expect.poll(() => main.evaluate((element) => {
    const style = getComputedStyle(element);
    return style.outlineStyle !== "none" && style.outlineWidth !== "0px";
  })).toBe(true);
  await expect(page.getByText("Unexpected Application Error!", { exact: true })).toHaveCount(0);
});
