import { expect, test, type Page } from "@playwright/test";

async function seedKnowledgeViews(page: Page) {
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
            id: "phase-one-knowledge-unit",
            number: 7,
            title: "Cognitive Psychology",
            objectives: ["Explain selective attention"],
            summary: ["Working memory has a limited capacity"],
            keyTerms: ["cognitive load"],
          }],
        });
      };
    });
  });
}

test("Workspace BETA Phase 1 keeps three columns, existing modes and routed tools", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  await expect(page.getByRole("heading", { name: "Sources & Materials", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI Studio - Workspace", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI-Assisted Tools", exact: true })).toBeVisible();
  await expect(page.locator(".workspace-beta-ai-option")).toHaveCount(4);
  await expect(page.getByRole("button", { name: /ChatGPT App \/ MCP/u })).toBeDisabled();
  await expect(page.locator(".workspace-beta-tools-grid > button")).toHaveCount(8);

  const sources = page.frameLocator('iframe[name="studyapp-workspace-sources"]');
  await expect(sources.getByRole("link", { name: "Open Library" })).toBeVisible();
  await expect(sources.getByRole("link", { name: "Manual Import" })).toBeVisible();
  await expect(sources.getByRole("link", { name: "Split PDF Tool" })).toBeVisible();
  await expect(sources.getByText("AI-Assisted Structuring — planned and unavailable.")).toBeVisible();

  await page.getByRole("button", { name: "Learning Goals" }).click();
  await expect(page.getByRole("button", { name: "Back to AI options" })).toBeVisible();
  await expect(page.locator('iframe[name="studyapp-workspace-workspace"]')).toHaveAttribute(
    "src",
    "/#/core-knowledge?view=goals",
  );

  await page.getByRole("button", { name: "Back to AI options" }).click();
  await expect(page.locator(".workspace-beta-ai-option")).toHaveCount(4);
  await expect(page.locator(".workspace-beta-tools-avatar img")).toBeVisible();
  await expect(page.locator(".workspace-beta-agent-bar")).toContainText("Not available");
  await page.getByRole("button", { name: "Hide AI Agent panel" }).click();
  await expect(page.getByRole("button", { name: "Show AI Agent panel" })).toBeVisible();
});

test("Workspace BETA Phase 1 switches the three approved mobile panels", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/workspace-beta");

  await expect(page.getByRole("heading", { name: "Sources & Materials", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI Studio - Workspace", exact: true })).toBeHidden();
  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  await expect(page.getByRole("heading", { name: "AI Studio - Workspace", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Tools", exact: true }).click();
  await expect(page.getByRole("heading", { name: "AI-Assisted Tools", exact: true })).toBeVisible();
});

test("Workspace BETA filters each approved knowledge view by hash-route query", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");
  await seedKnowledgeViews(page);

  const cases = [
    {
      tool: "Learning Goals",
      heading: "Learning Goals",
      shown: "Explain selective attention",
      hidden: ["Working memory has a limited capacity", "cognitive load"],
    },
    {
      tool: "Key Points",
      heading: "Key Points",
      shown: "Working memory has a limited capacity",
      hidden: ["Explain selective attention", "cognitive load"],
    },
    {
      tool: "Important Terms",
      heading: "Important Terms",
      shown: "cognitive load",
      hidden: ["Explain selective attention", "Working memory has a limited capacity"],
    },
  ] as const;

  for (const item of cases) {
    await page.getByRole("button", { name: item.tool, exact: true }).click();
    const workspace = page.frameLocator('iframe[name="studyapp-workspace-workspace"]');
    await expect(workspace.getByRole("heading", { name: item.heading, exact: true })).toBeVisible();
    await workspace.getByRole("button", { name: /Open chapter 7/u }).click();
    await expect(workspace.getByText(item.shown, { exact: true })).toBeVisible();
    for (const hidden of item.hidden) {
      await expect(workspace.getByText(hidden, { exact: true })).toHaveCount(0);
    }
    await workspace.getByRole("button", { name: "Close", exact: true }).click();
  }
});
