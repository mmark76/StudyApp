import { expect, test } from "@playwright/test";

const chaptersHeader =
  "Chapter number,Chapter title,What should you learn?,Key points,Important terms";

const flashcardsHeader = "Chapter number,Question,Answer,Keywords";

test("flashcard keywords stay hidden until the answer is revealed", async ({ page }) => {
  await page.goto("/#/learn");

  const manager = page.getByRole("region", { name: "Manage practice content" });
  await manager.locator('input[name="chapters-csv"]').setInputFiles({
    name: "keyword-visibility-chapters.csv",
    mimeType: "text/csv",
    buffer: Buffer.from([
      chaptersHeader,
      "91,Keyword visibility,Recall without hints,Active recall,testing",
    ].join("\n"), "utf8"),
  });
  await expect(manager.getByRole("status")).toHaveText("1 practice chapter saved.");

  await manager.locator('input[name="flashcards-csv"]').setInputFiles({
    name: "keyword-visibility-flashcards.csv",
    mimeType: "text/csv",
    buffer: Buffer.from([
      flashcardsHeader,
      "91,What is the test question?,This is the test answer,unique-keyword-hint",
    ].join("\n"), "utf8"),
  });
  await expect(manager.getByRole("status")).toHaveText("1 flashcard saved.");

  await page.goto("/#/flashcards");

  await expect(page.getByRole("heading", { name: "What is the test question?" })).toBeVisible();
  await expect(page.getByText("unique-keyword-hint", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Show answer" }).click();

  await expect(page.getByRole("heading", { name: "This is the test answer" })).toBeVisible();
  await expect(page.getByText("unique-keyword-hint", { exact: true })).toBeVisible();
});
