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
  await expect(assistantCard).toContainText("Open the dedicated assistant in ChatGPT.");
  await expect(options.getByRole("button", { name: /Sign in with ChatGPT/u })).toContainText("Connect your ChatGPT plan in StudyApp Local for Windows.");
  await expect(options.getByRole("button", { name: /ChatGPT App \/ MCP/u })).toContainText("Use StudyApp inside ChatGPT.");
  await expect(options.getByRole("button", { name: /StudyApp AI \/ API/u })).toContainText("Automatic AI is not active. No charges yet.");

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
  await expect(options.getByRole("link", { name: /StudyApp AI Assistant/u })).toContainText("Άνοιξε τον ειδικό βοηθό στο ChatGPT.");
  await expect(options.getByRole("button", { name: /Σύνδεση με ChatGPT/u })).toContainText("Σύνδεσε το πλάνο ChatGPT στο StudyApp Local για Windows.");
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
