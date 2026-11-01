import { expect, test } from "@playwright/test";
test("Sources and AI modes follow Practice row visual standard", async ({ page }) => {
  await page.setViewportSize({width:1600,height:900});
  await page.goto("/#/workspace-beta");
  const sources = page.frameLocator('iframe[name="studyapp-workspace-sources"]');
  const ai = page.frameLocator('iframe[name="studyapp-workspace-ai"]');
  const sourceRows = sources.locator(".dashboard-action-card");
  const aiRows = ai.locator(".ai-studio-option");
  await expect(sourceRows).toHaveCount(2);
  await expect(aiRows).toHaveCount(4);
  for (const row of [sourceRows.first(), sourceRows.last(), aiRows.first(), aiRows.last()]) {
    const shape = await row.evaluate(e => ({ radius:getComputedStyle(e).borderTopLeftRadius, border:getComputedStyle(e).borderBottomStyle, display:getComputedStyle(e).display }));
    expect(shape.radius).toBe("0px");
    expect(shape.border).toBe("solid");
    expect(shape.display).toBe("grid");
  }
  await expect(ai.getByRole("link", {name:"Open StudyApp AI Assistant"})).toBeVisible();
  await expect(ai.getByRole("link", {name:"Open PDF RAG (BETA)"})).toBeVisible();
});
