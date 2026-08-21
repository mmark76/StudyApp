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

test("Workspace BETA starts with four equal-width columns", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");

  const widths = await page.locator(".workspace-beta-functional-panel").evaluateAll((panels) =>
    panels.map((panel) => panel.getBoundingClientRect().width),
  );

  expect(widths).toHaveLength(4);
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(3);
});

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

test("Workspace AI Studio keeps primary actions visible and secondary status on demand", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");

  const ai = page.frameLocator('iframe[name="studyapp-workspace-ai"]');
  await expect(ai.getByRole("heading", { name: "AI Assistant", exact: true })).toBeVisible();
  await expect(ai.getByRole("link", { name: "Compare AI options" })).toBeVisible();
  await expect(ai.getByRole("link", { name: "Step-by-step StudyApp instructions" })).toBeVisible();

  const more = ai.getByText("More AI options", { exact: true });
  await expect(more).toBeVisible();
  await expect(ai.getByRole("heading", { name: "ChatGPT App / MCP", exact: true })).toBeHidden();
  await more.click();
  await expect(ai.getByRole("heading", { name: "ChatGPT App / MCP", exact: true })).toBeVisible();
  await expect(ai.getByRole("heading", { name: "StudyApp AI", exact: true })).toBeVisible();
});
