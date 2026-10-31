import { expect, test, type Page } from "@playwright/test";

async function seedCoreKnowledgeChapter(page: Page) {
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
        transaction.objectStore("settings").put({
          key: "imported-study-units",
          value: [{
            id: "compact-core-unit",
            number: 1,
            title: "Cognitive Psychology",
            objectives: ["Explain attention"],
            summary: ["Attention is selective"],
            keyTerms: ["working memory"],
          }],
        });
        transaction.objectStore("settings").put({
          key: "imported-flashcards",
          value: [],
        });
      };
    });
  });
}

test("Core Knowledge stays compact, wraps cleanly, and keeps dark modal text readable", async ({ page }) => {
  await seedCoreKnowledgeChapter(page);
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");

  const knowledge = page.frameLocator('iframe[name="studyapp-workspace-knowledge"]');
  await expect(knowledge.getByText("Chapters (1)", { exact: true })).toBeVisible();
  await expect(knowledge.getByText("Open a chapter to review its learning goals, key points and important terms.")).toHaveCount(0);

  const chapter = knowledge.getByRole("button", { name: "Open chapter 1 — Cognitive Psychology" });
  const box = await chapter.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.width).toBeLessThanOrEqual(44);
  expect(box?.height).toBeLessThanOrEqual(44);

  const chapterStyle = await chapter.evaluate((element) => ({
    color: getComputedStyle(element).color,
    fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
    fontWeight: getComputedStyle(element).fontWeight,
  }));
  expect(chapterStyle.color).toBe("rgb(102, 116, 132)");
  expect(chapterStyle.fontSize).toBeLessThan(12);
  expect(chapterStyle.fontWeight).toBe("600");

  const overflow = await knowledge.locator(".core-knowledge-page").evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);

  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await chapter.click();
  const dialog = knowledge.getByRole("dialog", { name: "Cognitive Psychology" });
  await expect(dialog).toBeVisible();

  const colors = await dialog.evaluate((element) => {
    const heading = element.querySelector<HTMLElement>("#core-knowledge-modal-title");
    const item = element.querySelector<HTMLElement>("li");
    if (!heading || !item) throw new Error("Core Knowledge modal content is missing.");
    return {
      background: getComputedStyle(element).backgroundColor,
      heading: getComputedStyle(heading).color,
      body: getComputedStyle(item).color,
      overflowX: getComputedStyle(element).overflowX,
    };
  });
  expect(colors.heading).not.toBe(colors.background);
  expect(colors.body).not.toBe(colors.background);
  expect(colors.overflowX).toBe("hidden");
});

test("Workspace Sources keeps material import available but collapsed by default", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");

  const sources = page.frameLocator('iframe[name="studyapp-workspace-sources"]');
  await sources.getByRole("link", { name: "Library", exact: true }).click();
  await expect(sources.getByRole("heading", { name: "Library", exact: true })).toBeVisible();

  const addMaterial = sources.getByText("Add material", { exact: true });
  await expect(addMaterial).toBeVisible();
  await expect(sources.getByRole("heading", { name: "Local file", exact: true })).toBeHidden();

  await addMaterial.click();
  await expect(sources.getByRole("heading", { name: "Local file", exact: true })).toBeVisible();
  await expect(sources.getByRole("heading", { name: "Cloud link", exact: true })).toBeVisible();
});

test("Workspace AI Studio shows all four options and keeps instructions in global help", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");

  const ai = page.frameLocator('iframe[name="studyapp-workspace-ai"]');
  await expect(ai.getByRole("heading", { name: "AI Assistant", exact: true })).toBeAttached();
  for (const name of ["1. Custom GPT / Plugin", "2. ChatGPT App / MCP", "3. StudyApp AI / API", "4. Sign in with ChatGPT"]) {
    await expect(ai.getByText(name, { exact: true })).toBeVisible();
  }
  await expect(ai.getByText("Coming Soon")).toHaveCount(2);
  await expect(ai.getByText("PDF RAG · BETA")).toBeVisible();
  await expect(ai.getByRole("link", { name: "Open PDF RAG (BETA)" })).toBeVisible();
  await expect(ai.getByRole("link", { name: "Compare AI options" })).toBeVisible();
  await expect(ai.getByRole("link", { name: "Step-by-step StudyApp instructions" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "StudyApp Help / Instructions" })).toBeVisible();
});

test("Workspace light mode softens action colours without changing Standard Version", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");

  const practice = page.frameLocator('iframe[name="studyapp-workspace-practice"]');
  const flashcards = practice.getByRole("link", { name: "Practice with flashcards" });
  await expect(flashcards).toBeVisible();
  await expect(practice.getByRole("heading", { name: "Practice & Mastery", exact: true })).toBeAttached();

  const lightStyle = await flashcards.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    color: getComputedStyle(element).color,
  }));
  expect(lightStyle.background).toBe("rgb(238, 233, 242)");
  expect(lightStyle.color).toBe("rgb(89, 70, 109)");

  const practiceHeadingStyle = await practice.getByRole("heading", { name: "Practice & Mastery", exact: true }).evaluate((element) => ({
    position: getComputedStyle(element).position,
    width: getComputedStyle(element).width,
    height: getComputedStyle(element).height,
  }));
  expect(practiceHeadingStyle.position).toBe("absolute");
  expect(practiceHeadingStyle.width).toBe("1px");
  expect(practiceHeadingStyle.height).toBe("1px");

  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  const darkBackground = await flashcards.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(darkBackground).toBe("rgb(89, 72, 111)");

  await page.goto("/#/learn");
  const standardFlashcards = page.getByRole("link", { name: "Practice with flashcards" });
  await expect(standardFlashcards).toBeVisible();
  const standardBackground = await standardFlashcards.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(standardBackground).toBe("rgb(124, 58, 237)");
  await expect(page.getByRole("heading", { name: "Manage practice content", exact: true })).toBeVisible();
});
