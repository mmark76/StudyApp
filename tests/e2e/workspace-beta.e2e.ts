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
          value: [
            {
              id: "core-knowledge-e2e-unit",
              number: 7,
              title: "Cognitive Psychology",
              objectives: ["Explain attention", "Describe working memory"],
              summary: ["Attention is selective", "Working memory is limited"],
              keyTerms: ["attention", "working memory"],
            },
          ],
        });
        transaction.objectStore("settings").put({
          key: "imported-flashcards",
          value: [
            {
              id: "core-knowledge-e2e-card-1",
              unitId: "core-knowledge-e2e-unit",
              number: 1,
              question: "What is selective attention?",
              answer: "Prioritising some information over other information.",
              tags: [],
            },
            {
              id: "core-knowledge-e2e-card-2",
              unitId: "core-knowledge-e2e-unit",
              number: 2,
              question: "Is working memory unlimited?",
              answer: "No.",
              tags: [],
            },
          ],
        });
      };
    });
  });
}

test("Workspace BETA keeps four independent functional StudyApp panels", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  await expect(page.locator(".workspace-beta-header")).toBeVisible();
  await expect(page.locator(".app-header")).toHaveCount(0);
  await expect(page.locator(".app-footer")).toHaveCount(0);
  await expect(page.locator("iframe.workspace-beta-frame")).toHaveCount(4);

  await expect(page.getByRole("heading", { name: "Sources & Materials", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Core Knowledge", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Practice & Mastery", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI Studio", exact: true })).toBeVisible();
  await expect(
    page.locator(".workspace-beta-header-left").getByRole("link", { name: "Back to Standard Version" }),
  ).toBeVisible();

  const sources = page.frameLocator('iframe[name="studyapp-workspace-sources"]');
  const knowledge = page.frameLocator('iframe[name="studyapp-workspace-knowledge"]');
  const practice = page.frameLocator('iframe[name="studyapp-workspace-practice"]');
  const ai = page.frameLocator('iframe[name="studyapp-workspace-ai"]');

  await expect(sources.getByRole("heading", { name: "Sources & Materials" })).toBeVisible();
  await expect(knowledge.getByRole("heading", { name: "Core Knowledge" })).toBeVisible();
  await expect(practice.getByRole("heading", { name: "Practice & Mastery" })).toBeVisible();
  await expect(ai.getByRole("heading", { name: "AI Assistant", exact: true })).toBeVisible();

  await expect(sources.locator(".app-header")).toHaveCount(0);
  await expect(knowledge.locator(".app-header")).toHaveCount(0);
  await expect(sources.locator(".app-footer")).toHaveCount(0);
  await expect(knowledge.getByText("No chapters imported yet.")).toBeVisible();

  await sources.getByRole("link", { name: "Library", exact: true }).click();
  await expect(sources.getByRole("heading", { name: "Library" })).toBeVisible();
  await expect(knowledge.getByRole("heading", { name: "Core Knowledge" })).toBeVisible();
  await expect(practice.getByRole("heading", { name: "Practice & Mastery" })).toBeVisible();

  await page.getByRole("button", { name: "Go to Sources & Materials home" }).click();
  await expect(sources.getByRole("heading", { name: "Sources & Materials" })).toBeVisible();

  const assistantLink = page.getByRole("link", { name: "Start StudyApp AI Assistant" });
  await expect(assistantLink).toHaveAttribute("target", "_blank");
  await expect(assistantLink).toHaveAttribute("href", /^https:\/\/chatgpt\.com\//u);
});

test("Workspace BETA keeps legal, feedback and version information in the Info menu", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  const infoMenu = page.locator(".workspace-beta-info-menu");
  await infoMenu.locator("summary").click();

  await expect(page.locator(".workspace-beta-info-popover")).toBeVisible();
  await expect(page.getByRole("link", { name: "Important Info" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Feedback" })).toHaveAttribute("href", /^mailto:/u);
  await expect(page.getByRole("link", { name: "Back to markellosecosystem" })).toHaveAttribute(
    "target",
    "_blank",
  );
  await expect(page.getByRole("link", { name: "License" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Privacy" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Analytics choices" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Copyright protected" })).toBeVisible();
  await expect(page.getByText("© 2026 Markellos Markides. All rights reserved.")).toBeVisible();
  await expect(page.locator(".workspace-beta-info-version")).toContainText(/^v/u);
});

test("Workspace BETA desktop dividers resize adjacent panels and can reset", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");

  const panels = page.locator(".workspace-beta-functional-panel");
  const dividers = page.locator(".workspace-beta-resizer");
  await expect(dividers).toHaveCount(3);
  await expect(dividers.first()).toBeVisible();

  const before = await panels.evaluateAll((items) =>
    items.map((item) => item.getBoundingClientRect().width),
  );
  const dividerBox = await dividers.first().boundingBox();
  if (!dividerBox) throw new Error("Workspace divider was not measurable");

  await page.mouse.move(
    dividerBox.x + dividerBox.width / 2,
    dividerBox.y + dividerBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    dividerBox.x + dividerBox.width / 2 + 72,
    dividerBox.y + dividerBox.height / 2,
    { steps: 6 },
  );
  await page.mouse.up();

  const afterDrag = await panels.evaluateAll((items) =>
    items.map((item) => item.getBoundingClientRect().width),
  );
  expect(afterDrag[0]).toBeGreaterThan(before[0] + 35);
  expect(afterDrag[1]).toBeLessThan(before[1] - 35);
  expect(Math.abs(afterDrag[2] - before[2])).toBeLessThan(4);
  expect(Math.abs(afterDrag[3] - before[3])).toBeLessThan(4);

  await dividers.first().dblclick();
  await expect.poll(async () => {
    const resetWidths = await panels.evaluateAll((items) =>
      items.map((item) => item.getBoundingClientRect().width),
    );
    return Math.abs(resetWidths[0] - before[0]);
  }).toBeLessThan(4);
});

test("Workspace BETA wheel scrolls a frame even when parent focus is left outside it", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");

  const divider = page.locator(".workspace-beta-resizer").nth(1);
  const dividerBox = await divider.boundingBox();
  if (!dividerBox) throw new Error("Workspace divider was not measurable");

  await page.mouse.move(
    dividerBox.x + dividerBox.width / 2,
    dividerBox.y + dividerBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    dividerBox.x + dividerBox.width / 2 + 48,
    dividerBox.y + dividerBox.height / 2,
    { steps: 5 },
  );
  await page.mouse.up();

  const practiceFrameElement = page.locator('iframe[name="studyapp-workspace-practice"]');
  const practiceBox = await practiceFrameElement.boundingBox();
  if (!practiceBox) throw new Error("Practice iframe was not measurable");

  const practiceFrame = page.frame({ name: "studyapp-workspace-practice" });
  if (!practiceFrame) throw new Error("Practice iframe was not available");

  await practiceFrame.evaluate(() => {
    const spacer = document.createElement("div");
    spacer.dataset.workspaceWheelTest = "true";
    spacer.style.height = "1800px";
    document.body.appendChild(spacer);
    window.scrollTo(0, 0);
  });

  await page.mouse.move(
    practiceBox.x + practiceBox.width / 2,
    practiceBox.y + Math.min(practiceBox.height / 2, 320),
  );
  await divider.focus();
  await expect.poll(() => page.evaluate(() =>
    document.activeElement?.classList.contains("workspace-beta-resizer"),
  )).toBe(true);
  await expect(practiceFrame.evaluate(() => document.hasFocus())).resolves.toBe(false);

  await page.mouse.wheel(0, 600);

  await expect.poll(() => practiceFrame.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await expect.poll(() => practiceFrame.evaluate(() => document.hasFocus())).toBe(true);
});

test("Workspace BETA Core Knowledge keeps chapter titles hidden until its modal opens", async ({ page }) => {
  await seedCoreKnowledgeChapter(page);
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");

  const knowledge = page.frameLocator('iframe[name="studyapp-workspace-knowledge"]');
  const chapterButton = knowledge.getByRole("button", {
    name: "Open chapter 7 — Cognitive Psychology",
  });

  await expect(knowledge.getByText("Cognitive Psychology", { exact: true })).toHaveCount(0);
  await expect(knowledge.getByText("Explain attention", { exact: true })).toHaveCount(0);
  await expect(chapterButton).toHaveText("07");

  await chapterButton.click();
  const dialog = knowledge.getByRole("dialog", { name: "Cognitive Psychology" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Learning goals" })).toBeVisible();
  await expect(dialog.getByText("Explain attention", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Key points" })).toBeVisible();
  await expect(dialog.getByText("Attention is selective", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Important terms" })).toBeVisible();
  await expect(dialog.getByText("working memory", { exact: true })).toBeVisible();
  await expect(dialog.getByText("2 linked flashcards", { exact: true })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(chapterButton).toBeFocused();
});

test("Workspace BETA language sync follows active mobile panels and layout stays contained", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/workspace-beta");

  const sources = page.frameLocator('iframe[name="studyapp-workspace-sources"]');
  const knowledge = page.frameLocator('iframe[name="studyapp-workspace-knowledge"]');
  const practice = page.frameLocator('iframe[name="studyapp-workspace-practice"]');
  const tabs = page.locator(".workspace-beta-mobile-panel-tabs");

  await expect(sources.getByRole("heading", { name: "Sources & Materials" })).toBeVisible();
  await expect(page.locator(".workspace-beta-resizer").first()).toBeHidden();
  await page.getByRole("button", { name: "GR", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Πηγές & Υλικό", exact: true })).toBeVisible();
  await expect(sources.getByRole("heading", { name: "Πηγές & Υλικό" })).toBeVisible();

  await tabs.getByRole("button", { name: "Γνώση", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Βασική Γνώση", exact: true })).toBeVisible();
  await expect(knowledge.getByRole("heading", { name: "Βασική Γνώση" })).toBeVisible();

  await tabs.getByRole("button", { name: "Εξάσκηση", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Εξάσκηση & Εμπέδωση", exact: true })).toBeVisible();
  await expect(practice.getByRole("heading", { name: "Εξάσκηση & Εμπέδωση" })).toBeVisible();

  const mobileMenu = page.locator(".workspace-beta-mobile-menu");
  await mobileMenu.locator("summary").click();
  await expect(
    mobileMenu.getByRole("link", { name: "Επιστροφή στην κανονική έκδοση" }),
  ).toBeVisible();

  const overflow = await page.locator(".workspace-beta-main").evaluate((main) => ({
    clientWidth: main.clientWidth,
    scrollWidth: main.scrollWidth,
    documentFits: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  expect(overflow.documentFits).toBe(true);
});
