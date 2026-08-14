import { expect, test } from "@playwright/test";

test("renders both instruction cases in the required import order", async ({
  page,
}) => {
  await page.goto("/#/instructions");

  await expect(page).toHaveURL(/#\/instructions$/u);
  await expect(
    page.getByRole("heading", {
      name: "How to add AI-generated study material to StudyApp",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "StudyApp does not receive files automatically from ChatGPT.",
      { exact: false },
    ),
  ).toBeVisible();

  const completeWorkflow = page.getByRole("region", {
    name: "I have a PDF + Chapters CSV + Flashcards CSV",
  });
  const flashcardsOnlyWorkflow = page.getByRole("region", {
    name: "I only have a Flashcards CSV",
  });
  await expect(completeWorkflow).toBeVisible();
  await expect(flashcardsOnlyWorkflow).toBeVisible();
  await expect(completeWorkflow.getByRole("listitem")).toHaveCount(10);
  await expect(flashcardsOnlyWorkflow.getByRole("listitem")).toHaveCount(8);

  const completeWorkflowText = await completeWorkflow.innerText();
  const chaptersImportIndex = completeWorkflowText.indexOf(
    "Import the Chapters CSV FIRST",
  );
  const flashcardsImportIndex = completeWorkflowText.indexOf(
    "Import the Flashcards CSV SECOND",
  );
  expect(chaptersImportIndex).toBeGreaterThanOrEqual(0);
  expect(flashcardsImportIndex).toBeGreaterThan(chaptersImportIndex);
  await expect(
    completeWorkflow.getByLabel("Chapters CSV, then Flashcards CSV"),
  ).toContainText("Chapters CSV→Flashcards CSV");

  const learnLink = page.getByRole("link", {
    name: "Open Learn & Practice",
  });
  await expect(learnLink).toHaveAttribute("href", "#/learn");
  await learnLink.click();
  await expect(page).toHaveURL(/#\/learn$/u);
  await expect(
    page.getByRole("heading", { name: "Manage practice content" }),
  ).toBeVisible();
});

test("links the Assistant guide to localized responsive instructions", async ({
  page,
}) => {
  await page.goto("/#/ai-assistant-guide");

  const instructionsLink = page.getByRole("link", {
    name: "Step-by-step StudyApp instructions",
  });
  await expect(instructionsLink).toHaveAttribute("href", "#/instructions");
  await instructionsLink.click();

  await page.getByRole("button", { name: "GR" }).click();
  await page.setViewportSize({ width: 390, height: 844 });

  await expect(
    page.getByRole("heading", {
      name: "Πώς να προσθέσεις στο StudyApp υλικό από τον Βοηθό AI",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", {
      name: "Έχω PDF + Chapters CSV + Flashcards CSV",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Έχω μόνο Flashcards CSV" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Το StudyApp δεν λαμβάνει αρχεία αυτόματα από το ChatGPT.",
      { exact: false },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Άνοιξε το Μάθηση & Εξάσκηση" }),
  ).toHaveAttribute("href", "#/learn");

  const pageWidth = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(pageWidth.scrollWidth).toBeLessThanOrEqual(pageWidth.clientWidth);
});
