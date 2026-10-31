import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

test("PDF RAG BETA can attach a temporary PDF and requires passage approval", async ({ page }) => {
  let sourceRequests = 0;
  await page.route("**/api/chatgpt-plan/connection", async (route) => {
    await route.fulfill({ json: {
      connected: true,
      connectionState: "connected",
      planUsageAuthorized: true,
      scope: "current-windows-user",
    } });
  });
  await page.route("**/api/chatgpt-plan/ask-with-sources", async (route) => {
    sourceRequests += 1;
    await route.fulfill({ json: { answer: "The relevant concept is working memory." } });
  });

  await page.goto("/#/local-chatgpt-plan");
  await expect(page.getByRole("heading", { name: /PDF RAG.*BETA/u })).toBeVisible();
  const document = await PDFDocument.create();
  const pdfPage = document.addPage([612, 792]);
  pdfPage.drawText("Working memory helps us retain information temporarily.", { x: 40, y: 720, size: 14 });
  const bytes = await document.save();
  await page.locator('input[type="file"][accept=".pdf,application/pdf"]').setInputFiles({
    name: "working-memory.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(bytes),
  });
  await expect(page.getByText("working-memory.pdf", { exact: true })).toBeVisible();
  expect(sourceRequests).toBe(0);
  await page.getByLabel("Question about these PDFs").fill("What is working memory?");
  await page.getByRole("button", { name: "Find passages on this device" }).click();
  await expect(page.getByText("Working memory helps us retain information temporarily.", { exact: false })).toBeVisible();
  expect(sourceRequests).toBe(0);
  await page.getByLabel("I approve sending the question and the passages shown above to ChatGPT.").check();
  await page.getByRole("button", { name: "Send approved passages" }).click();
  await expect(page.getByText("The relevant concept is working memory.")).toBeVisible();
  expect(sourceRequests).toBe(1);
});
