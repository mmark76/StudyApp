import { expect, test } from "@playwright/test";
import { PDFDocument, StandardFonts } from "pdf-lib";

test("selected PDF passages stay local until the user approves sending them", async ({ page }) => {
  const pdf = await PDFDocument.create();
  const pageOne = pdf.addPage();
  pageOne.setSize(612, 792);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  pageOne.drawText("Mitochondria release energy for the cell.", { x: 50, y: 700, size: 18, font });
  await page.goto("/");
  await page.evaluate(async (encodedPdf) => {
    const bytes = Uint8Array.from(atob(encodedPdf), (character) => character.charCodeAt(0));
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("generic-study-app");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("studyFiles", "readwrite");
      transaction.objectStore("studyFiles").put({
        id: "pdf-rag-fixture",
        title: "Biology source",
        fileName: "Biology.pdf",
        size: bytes.byteLength,
        createdAt: new Date().toISOString(),
        mimeType: "application/pdf",
        fileKind: "pdf",
        fileSource: "source-material",
        materialType: "book",
        data: new Blob([bytes], { type: "application/pdf" }),
      });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }, Buffer.from(await pdf.save()).toString("base64"));

  let providerRequest: Record<string, unknown> | undefined;
  await page.route("**/api/chatgpt-plan/connection", (route) => route.fulfill({
    json: { connected: true, connectionState: "connected", planUsageAuthorized: true, scope: "current-windows-user" },
  }));
  await page.route("**/api/chatgpt-plan/ask-with-sources", async (route) => {
    providerRequest = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ json: { answer: "Mitochondria release energy [S1, p. 1]." } });
  });

  await page.goto("/#/local-chatgpt-plan");
  await expect(page.getByText("Biology source").first()).toBeVisible();
  await page.getByRole("checkbox", { name: "Biology source" }).check();
  await page.getByRole("textbox", { name: "Question about these PDFs" }).fill("What releases energy?");
  await page.getByRole("button", { name: "Find passages on this device" }).click();
  await expect(page.getByText("Mitochondria release energy for the cell.")).toBeVisible();
  await expect(page.getByText("Biology source · page 1")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send approved passages" })).toBeDisabled();
  expect(providerRequest).toBeUndefined();

  await page.getByRole("checkbox", { name: "I approve sending the question and the passages shown above to ChatGPT." }).check();
  await page.getByRole("button", { name: "Send approved passages" }).click();
  await expect(page.getByText("Mitochondria release energy [S1, p. 1].")).toBeVisible();
  expect(providerRequest).toMatchObject({
    confirmExternalRequest: true,
    question: "What releases energy?",
    passages: [{ documentTitle: "Biology source", page: 1, text: "Mitochondria release energy for the cell.", sourceId: "S1" }],
  });
  expect(JSON.stringify(providerRequest)).not.toContain("unselected");
});
