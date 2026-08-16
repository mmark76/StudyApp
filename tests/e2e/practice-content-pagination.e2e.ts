import { expect, test, type Page } from "@playwright/test";

async function readHorizontalLayout(page: Page) {
  const manager = page.locator(".practice-content-manager");
  return manager.evaluate((element) => {
    const managerBounds = element.getBoundingClientRect();
    const heading = element.querySelector<HTMLElement>(".practice-content-heading");
    const title = element.querySelector<HTMLElement>("#practice-content-title");
    const root = document.querySelector<HTMLElement>("#root");
    const appShell = document.querySelector<HTMLElement>(".app-shell");
    const main = document.querySelector<HTMLElement>(".app-main");
    if (!heading || !title || !root || !appShell || !main) {
      throw new Error("Required layout element is missing.");
    }
    const describeSelector = (candidate: HTMLElement): string => {
      const id = candidate.id ? `#${candidate.id}` : "";
      const classes = typeof candidate.className === "string"
        ? candidate.className.trim().split(/\s+/u).filter(Boolean).map((name) => `.${name}`).join("")
        : "";
      return `${candidate.tagName.toLowerCase()}${id}${classes}`;
    };
    const describeBox = (candidate: HTMLElement) => {
      const bounds = candidate.getBoundingClientRect();
      return {
        clientWidth: candidate.clientWidth,
        left: Math.round(bounds.left),
        right: Math.round(bounds.right),
        scrollWidth: candidate.scrollWidth,
        width: Math.round(bounds.width),
      };
    };
    const viewportWidth = document.documentElement.clientWidth;
    const pageOverflowingElements = [document.body, ...document.body.querySelectorAll<HTMLElement>("*")]
      .filter((candidate) => candidate !== element && !element.contains(candidate))
      .map((candidate) => {
        const bounds = candidate.getBoundingClientRect();
        const styles = getComputedStyle(candidate);
        const contentRight = styles.overflowX === "visible"
          ? bounds.left + Math.max(bounds.width, candidate.scrollWidth)
          : bounds.right;
        const overflowLeft = Math.max(0, -bounds.left);
        const overflowRight = Math.max(0, Math.max(bounds.right, contentRight) - viewportWidth);
        let depth = 0;
        for (let parent = candidate.parentElement; parent; parent = parent.parentElement) depth += 1;
        return {
          ancestors: Array.from((function* ancestors() {
            for (let parent = candidate.parentElement; parent; parent = parent.parentElement) {
              const parentStyles = getComputedStyle(parent);
              yield {
                box: describeBox(parent),
                display: parentStyles.display,
                gridTemplateColumns: parentStyles.gridTemplateColumns,
                minWidth: parentStyles.minWidth,
                overflowX: parentStyles.overflowX,
                selector: describeSelector(parent),
              };
            }
          })()).slice(0, 8),
          box: describeBox(candidate),
          boxSizing: styles.boxSizing,
          depth,
          display: styles.display,
          flex: styles.flex,
          flexBasis: styles.flexBasis,
          flexShrink: styles.flexShrink,
          gridTemplateColumns: styles.gridTemplateColumns,
          marginLeft: styles.marginLeft,
          marginRight: styles.marginRight,
          maxWidth: styles.maxWidth,
          minWidth: styles.minWidth,
          overflowAmount: Math.ceil(Math.max(overflowLeft, overflowRight)),
          overflowWrap: styles.overflowWrap,
          overflowX: styles.overflowX,
          paddingLeft: styles.paddingLeft,
          paddingRight: styles.paddingRight,
          position: styles.position,
          role: candidate.getAttribute("role") ?? "",
          selector: describeSelector(candidate),
          text: candidate.textContent?.trim().replace(/\s+/gu, " ").slice(0, 80) ?? "",
          whiteSpace: styles.whiteSpace,
          width: styles.width,
          wordBreak: styles.wordBreak,
        };
      })
      .filter((candidate) => candidate.overflowAmount > 0)
      .sort((left, right) => right.overflowAmount - left.overflowAmount || right.depth - left.depth)
      .slice(0, 10);
    const overflowingElements = [element, ...element.querySelectorAll<HTMLElement>("*")]
      .map((candidate) => {
        const bounds = candidate.getBoundingClientRect();
        const styles = getComputedStyle(candidate);
        const visualRight = bounds.left + Math.max(bounds.width, candidate.scrollWidth);
        return {
          className: typeof candidate.className === "string" ? candidate.className : "",
          clientWidth: candidate.clientWidth,
          id: candidate.id,
          minWidth: styles.minWidth,
          overflowBeyondManager: Math.round(Math.max(0, visualRight - managerBounds.right)),
          overflowWrap: styles.overflowWrap,
          right: Math.round(bounds.right),
          scrollWidth: candidate.scrollWidth,
          tagName: candidate.tagName,
          text: candidate.textContent?.trim().slice(0, 80) ?? "",
          whiteSpace: styles.whiteSpace,
          width: Math.round(bounds.width),
        };
      })
      .filter((candidate) => candidate.overflowBeyondManager > 0)
      .sort((left, right) => Math.max(
        right.overflowBeyondManager,
        right.scrollWidth - right.clientWidth,
      ) - Math.max(
        left.overflowBeyondManager,
        left.scrollWidth - left.clientWidth,
      ));
    return {
      appShell: describeBox(appShell),
      body: describeBox(document.body),
      documentClientWidth: document.documentElement.clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      headingClientWidth: heading.clientWidth,
      headingScrollWidth: heading.scrollWidth,
      main: describeBox(main),
      managerClientWidth: element.clientWidth,
      managerScrollWidth: element.scrollWidth,
      overflowingElements: overflowingElements.slice(0, 12),
      pageOverflowingElements,
      root: describeBox(root),
      titleClientWidth: title.clientWidth,
      titleScrollWidth: title.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });
}

function expectNoHorizontalOverflow(
  evidence: Awaited<ReturnType<typeof readHorizontalLayout>>,
  label: string,
): void {
  const diagnostic = `${label}: ${JSON.stringify(evidence, null, 2)}`;
  expect(evidence.documentScrollWidth, diagnostic)
    .toBeLessThanOrEqual(evidence.documentClientWidth);
  expect(evidence.managerScrollWidth, diagnostic)
    .toBeLessThanOrEqual(evidence.managerClientWidth);
  expect(evidence.headingScrollWidth, diagnostic)
    .toBeLessThanOrEqual(evidence.headingClientWidth);
  expect(evidence.titleScrollWidth, diagnostic)
    .toBeLessThanOrEqual(evidence.titleClientWidth);
  expect(evidence.overflowingElements, diagnostic).toEqual([]);
}

async function seedPracticeContent(
  page: Page,
  chapterCount = 150,
  flashcardCount = 1_500,
): Promise<void> {
  await page.goto("/");
  await page.waitForFunction(async () => (await indexedDB.databases()).some(
    (database) => database.name === "generic-study-app",
  ));
  await page.evaluate(async ({ chapterCount, flashcardCount }) => {
    const units = Array.from({ length: chapterCount }, (_, index) => ({
      id: `pagination-unit-${index + 1}`,
      number: index + 1,
      title: `Pagination chapter ${index + 1}`,
      objectives: [`Goal ${index + 1}`],
      summary: [`Point ${index + 1}`],
      keyTerms: [`term-${index + 1}`],
    }));
    const flashcards = Array.from({ length: flashcardCount }, (_, index) => ({
      id: `pagination-card-${index + 1}`,
      unitId: units[index % units.length].id,
      number: Math.floor(index / units.length) + 1,
      question: `Pagination question ${index + 1}?`,
      answer: `Pagination answer ${index + 1}.`,
      tags: ["pagination"],
    }));
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
        const settings = transaction.objectStore("settings");
        settings.put({ key: "imported-study-units", value: units });
        settings.put({ key: "imported-flashcards", value: flashcards });
      };
    });
  }, { chapterCount, flashcardCount });
  await page.goto("/#/learn");
  await expect(page.locator("#imported-practice-chapters-title"))
    .toContainText(`(${chapterCount})`);
  await expect(page.locator("#imported-flashcards-title"))
    .toContainText(`(${flashcardCount})`);
}

test("paginates 150 chapters and 1,500 flashcards with bounded accessible management", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await seedPracticeContent(page);
  expectNoHorizontalOverflow(await readHorizontalLayout(page), "English desktop");
  const manager = page.getByRole("region", { name: "Manage practice content" });
  const chapterHeading = manager.locator("#imported-practice-chapters-title");
  const flashcardHeading = manager.locator("#imported-flashcards-title");
  const chapterList = manager.locator("#imported-practice-chapters-list");
  const flashcardList = manager.locator("#imported-flashcards-list");
  const chapterPages = manager.getByRole("navigation", { name: "Chapter pages" });
  const flashcardPages = manager.getByRole("navigation", { name: "Flashcard pages" });

  await expect(chapterHeading).toHaveText("Practice Chapters (150)");
  await expect(flashcardHeading).toHaveText("Flashcards (1500)");
  await expect(chapterList.locator(".practice-content-item")).toHaveCount(25);
  await expect(flashcardList.locator(".practice-content-item")).toHaveCount(50);
  await expect(chapterPages.locator('[aria-current="page"]')).toHaveText("Page 1 of 6.");
  await expect(flashcardPages.locator('[aria-current="page"]')).toHaveText("Page 1 of 30.");
  await expect(chapterPages.getByRole("button", { name: "Previous chapter page" }))
    .toBeDisabled();
  await expect(flashcardPages.getByRole("button", { name: "Previous flashcard page" }))
    .toBeDisabled();
  await expect(chapterList.getByText("Pagination chapter 26", { exact: true })).toHaveCount(0);
  await expect(flashcardList.getByText("Pagination question 51?", { exact: true })).toHaveCount(0);

  const mounted = await manager.evaluate((element) => {
    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");
    return {
      dom: element.querySelectorAll("*").length + 1,
      focusables: element.querySelectorAll(focusableSelector).length,
      rows: element.querySelectorAll(".practice-content-item").length,
    };
  });
  expect(mounted).toMatchObject({ rows: 75 });
  expect(mounted.dom).toBeLessThanOrEqual(2_500);
  expect(mounted.focusables).toBeLessThanOrEqual(350);

  await chapterPages.getByRole("button", { name: "Next chapter page" }).click();
  await expect(chapterPages.locator('[aria-current="page"]')).toHaveText("Page 2 of 6.");
  await expect(chapterHeading).toBeFocused();
  await expect(chapterList.getByText("26. Pagination chapter 26", { exact: true }))
    .toBeVisible();

  await flashcardPages.getByRole("button", { name: "Next flashcard page" }).click();
  await expect(flashcardPages.locator('[aria-current="page"]')).toHaveText("Page 2 of 30.");
  await expect(flashcardHeading).toBeFocused();
  await expect(flashcardList.getByText("Pagination question 51?", { exact: true }))
    .toBeVisible();

  await flashcardList.getByRole("button", {
    name: "Edit flashcard Pagination question 51?",
  }).click();
  const editor = flashcardList.locator(".practice-content-editor");
  await editor.getByLabel("Question").fill("Updated pagination question 51?");
  await editor.getByRole("button", { name: "Save changes" }).click();
  await expect(manager.getByRole("status")).toHaveText("Flashcard updated.");
  await expect(flashcardList.getByText("Updated pagination question 51?", { exact: true }))
    .toBeVisible();
  await expect(flashcardHeading).toBeFocused();

  page.once("dialog", (dialog) => dialog.accept());
  await flashcardList.getByRole("button", {
    name: "Remove flashcard Updated pagination question 51?",
  }).click();
  await expect(flashcardHeading).toHaveText("Flashcards (1499)");
  await expect(flashcardList.locator(".practice-content-item")).toHaveCount(50);
  await expect(flashcardPages.locator('[aria-current="page"]')).toHaveText("Page 2 of 30.");
  await expect(flashcardHeading).toBeFocused();

  await manager.getByRole("button", { name: "Add Chapter", exact: true }).click();
  const chapterForm = manager.locator(".practice-content-option").first().locator("form");
  await chapterForm.getByLabel("Practice chapter title").fill("Appended pagination chapter");
  await chapterForm.getByRole("button", { name: "Add chapter", exact: true }).click();
  await expect(chapterHeading).toHaveText("Practice Chapters (151)");
  await expect(chapterPages.locator('[aria-current="page"]')).toHaveText("Page 7 of 7.");
  await expect(chapterList.getByText("151. Appended pagination chapter", { exact: true }))
    .toBeVisible();
  await expect(chapterHeading).toBeFocused();

  page.once("dialog", (dialog) => dialog.accept());
  await chapterList.getByRole("button", {
    name: "Remove practice chapter Appended pagination chapter",
  }).click();
  await expect(chapterHeading).toHaveText("Practice Chapters (150)");
  await expect(chapterPages.locator('[aria-current="page"]')).toHaveText("Page 6 of 6.");
  await expect(chapterList.locator(".practice-content-item")).toHaveCount(25);
  await expect(chapterHeading).toBeFocused();

  await manager.locator('input[name="chapters-csv"]').setInputFiles({
    name: "pagination-chapter.csv",
    mimeType: "text/csv",
    buffer: Buffer.from([
      "Chapter number,Chapter title,What should you learn?,Key points,Important terms",
      "500,Imported pagination chapter,Goal,Point,term",
    ].join("\n"), "utf8"),
  });
  await expect(chapterHeading).toHaveText("Practice Chapters (151)");
  await expect(chapterPages.locator('[aria-current="page"]')).toHaveText("Page 1 of 7.");

  await manager.locator('input[name="flashcards-csv"]').setInputFiles({
    name: "pagination-flashcard.csv",
    mimeType: "text/csv",
    buffer: Buffer.from([
      "Chapter number,Question,Answer,Keywords",
      "1,Imported pagination question?,Imported pagination answer,pagination",
    ].join("\n"), "utf8"),
  });
  await expect(flashcardHeading).toHaveText("Flashcards (1500)");
  await expect(flashcardPages.locator('[aria-current="page"]')).toHaveText("Page 1 of 30.");

  await manager.getByRole("button", { name: "Add Flashcard", exact: true }).click();
  const flashcardForm = manager.locator(".practice-content-option").nth(1).locator("form");
  await flashcardForm.getByLabel("Practice chapter").selectOption("pagination-unit-1");
  await flashcardForm.getByLabel("Question").fill("Appended pagination question?");
  await flashcardForm.getByLabel("Answer").fill("Appended pagination answer.");
  await flashcardForm.getByRole("button", { name: "Add flashcard", exact: true }).click();
  await expect(flashcardHeading).toHaveText("Flashcards (1501)");
  await expect(flashcardPages.locator('[aria-current="page"]')).toHaveText("Page 31 of 31.");
  await expect(flashcardList.getByText("Appended pagination question?", { exact: true }))
    .toBeVisible();
  await expect(flashcardHeading).toBeFocused();
  await expect(page).toHaveURL(/\/#\/learn$/u);
});

test("keeps Greek pagination keyboard-usable without narrow or 200% text overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedPracticeContent(page);
  expectNoHorizontalOverflow(await readHorizontalLayout(page), "English mobile");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  const englishLayout = await readHorizontalLayout(page);
  expectNoHorizontalOverflow(englishLayout, "English mobile at 200% text");

  await page.getByRole("button", { name: "GR" }).click();
  const manager = page.getByRole("region", {
    name: "Διαχείριση περιεχομένου εξάσκησης",
  });
  const chapterHeading = manager.locator("#imported-practice-chapters-title");
  const chapterPages = manager.getByRole("navigation", { name: "Σελίδες κεφαλαίων" });
  const flashcardPages = manager.getByRole("navigation", { name: "Σελίδες flashcards" });

  await expect(chapterPages.getByText(
    "Εμφανίζονται κεφάλαια 1–25 από 150. Σελίδα 1 από 6.",
    { exact: true },
  )).toBeVisible();
  const nextChapter = chapterPages.getByRole("button", {
    name: "Επόμενη σελίδα κεφαλαίων",
  });
  await nextChapter.focus();
  await page.keyboard.press("Enter");
  await expect(chapterPages.locator('[aria-current="page"]')).toHaveText("Σελίδα 2 από 6.");
  await expect(chapterHeading).toBeFocused();
  await expect(manager.locator("#imported-practice-chapters-list .practice-content-item"))
    .toHaveCount(25);
  await expect(flashcardPages.locator('[aria-current="page"]'))
    .toHaveText("Σελίδα 1 από 30.");

  const greekLayout = await readHorizontalLayout(page);
  expectNoHorizontalOverflow(greekLayout, "Greek mobile at 200% text");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "100%";
  });
  expectNoHorizontalOverflow(await readHorizontalLayout(page), "Greek mobile");
});
