import { expect, test } from "@playwright/test";

const assistantUrl =
  "https://chatgpt.com/g/g-6a6b687029608191af7b26717f0a2072-studyapp-ai-assistant";

test("Workspace BETA sends the available Assistant card directly to the Custom GPT", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  const options = page.locator(".workspace-beta-ai-options");
  await expect(options).toBeVisible();
  const assistantCard = options.getByRole("link", { name: /StudyApp AI Assistant/u });
  await expect(assistantCard).toHaveAttribute("href", assistantUrl);
  await expect(assistantCard).toHaveAttribute("target", "_blank");
  await expect(assistantCard).toHaveAttribute("rel", "noopener noreferrer");
  await expect(assistantCard).toContainText("Work there directly; StudyApp does not send your material.");
  await expect(options.getByRole("button", { name: /Sign in with ChatGPT/u })).toContainText("connect your ChatGPT plan for questions and PDF RAG.");
  await expect(options.getByRole("button", { name: /ChatGPT App \/ MCP/u })).toContainText("Not available yet.");
  await expect(options.getByRole("button", { name: /StudyApp AI \/ API/u })).toContainText("It is not active and there are no charges yet.");
  const tools = page.locator(".workspace-beta-tools-grid");
  await expect(tools.getByRole("button", { name: /Learning Goals/u })).toContainText("Set clear goals for this chapter.");
  await expect(tools.getByRole("button", { name: /Progress/u })).toContainText("View results, backup, restore and archive.");

  await assistantCard.evaluate((element) => {
    element.addEventListener("click", (event) => event.preventDefault(), { once: true });
  });
  await assistantCard.click();
  await expect(options).toBeVisible();
  await expect(page.locator('iframe[name="studyapp-workspace-workspace"]')).toHaveCount(0);

  await page.getByRole("button", { name: "Compare AI options" }).click();
  await expect(page.locator(".workspace-beta-info-modal")).toBeVisible();

  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "GR", exact: true }).click();
  await expect(options.getByRole("link", { name: /StudyApp AI Assistant/u })).toContainText("Η εργασία γίνεται εκεί· το StudyApp δεν στέλνει υλικό.");
  await expect(options.getByRole("button", { name: /Σύνδεση με ChatGPT/u })).toContainText("σύνδεσε το πλάνο ChatGPT για ερωτήσεις και PDF RAG.");
  await expect(tools.getByRole("button", { name: /Στόχοι μάθησης/u })).toContainText("Όρισε καθαρούς στόχους για αυτό το κεφάλαιο.");
  await expect(tools.getByRole("button", { name: /Πρόοδος/u })).toContainText("Δες αποτελέσματα, αντίγραφα, επαναφορά και αρχείο.");
});

test("AI option controls use the compact shared typography hierarchy", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");
  const controls = page.locator(".workspace-beta-ai-option");
  const sizes = await controls.evaluateAll((elements) => elements.map((element) => ({
    family: getComputedStyle(element).fontFamily,
    height: element.getBoundingClientRect().height,
    titleSize: parseFloat(getComputedStyle(element.querySelector("strong") as Element).fontSize),
  })));
  expect(new Set(sizes.map(({ family }) => family))).toHaveProperty("size", 1);
  expect(new Set(sizes.map(({ height }) => height))).toHaveProperty("size", 1);
  for (const item of sizes) expect(item.titleSize).toBeLessThanOrEqual(15);
});
