import { expect, test } from "@playwright/test";

test("AI action buttons distinguish Open and PDF RAG badge follows the button", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");
  const ai = page.frameLocator('iframe[name="studyapp-workspace-ai"]');
  await expect(ai.getByRole("link", { name: "Sign in with ChatGPT" })).toBeVisible();
  await expect(ai.getByRole("link", { name: "Open PDF RAG (BETA)" })).toHaveCount(0);
  const first = ai.getByRole("link", { name: "Open StudyApp AI Assistant" });
  const style = await first.evaluate(el => ({ bg: getComputedStyle(el).backgroundColor, fg: getComputedStyle(el).color }));
  expect(style.bg).not.toBe("rgb(36, 36, 34)");
  expect(style.fg).toBe("rgb(255, 255, 255)");
  for (const name of ["Back to Sources & Materials home", "Back to Core Knowledge home", "Back to Practice & Mastery home", "Back to AI Options"]) {
    const bg = await page.getByRole("button", { name }).evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bg).toBe("rgb(60, 97, 77)");
  }
});
