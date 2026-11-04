import { expect, test } from "@playwright/test";

test("Sources, AI options and tools use the approved compact card treatment", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");
  const sources = page.frameLocator('iframe[name="studyapp-workspace-sources"]');
  const sourceRows = sources.locator(".dashboard-action-card");
  const aiRows = page.locator(".workspace-beta-ai-option");
  const toolRows = page.locator(".workspace-beta-tools-grid > button");
  await expect(sourceRows).toHaveCount(2);
  await expect(aiRows).toHaveCount(4);
  await expect(toolRows).toHaveCount(8);
  const titleHierarchy = await Promise.all([
    sourceRows.first().evaluate((element) => ({
      title: parseFloat(getComputedStyle(element.querySelector("h3")!).fontSize),
      description: parseFloat(getComputedStyle(element.querySelector("p:not(.eyebrow)")!).fontSize),
    })),
    aiRows.first().evaluate((element) => ({
      title: parseFloat(getComputedStyle(element.querySelector("strong")!).fontSize),
      description: parseFloat(getComputedStyle(element.querySelector("p")!).fontSize),
    })),
    toolRows.first().evaluate((element) => ({
      title: parseFloat(getComputedStyle(element.querySelector("span")!).fontSize),
      description: parseFloat(getComputedStyle(element.querySelector("small")!).fontSize),
    })),
  ]);
  for (const hierarchy of titleHierarchy) {
    expect(hierarchy.title).toBeGreaterThan(hierarchy.description);
  }
  for (const row of [aiRows.first(), aiRows.last(), toolRows.first(), toolRows.last()]) {
    const shape = await row.evaluate((element) => ({
      border: getComputedStyle(element).borderBottomStyle,
      display: getComputedStyle(element).display,
      radius: getComputedStyle(element).borderTopLeftRadius,
    }));
    expect(shape.border).toBe("solid");
    expect(shape.display).toBe("grid");
    expect(parseFloat(shape.radius)).toBeGreaterThan(0);
  }
});
