import { expect, test } from "@playwright/test";

test("Practice Summary and Main Points uses local sources and a confirmed mocked AI draft", async ({ page }) => {
  await page.goto("/#/workspace-beta");
  const practice = page.frameLocator('iframe[name="studyapp-workspace-practice"]');
  const cards = practice.locator(".learn-tools-grid .learning-stage-card");
  await expect(cards).toHaveCount(5);
  await expect(cards.nth(0)).toContainText("Summary and Main Points");
  await expect(cards.nth(0).locator(".stage-number")).toHaveText("1");
  await expect(cards.nth(1)).toContainText("Flashcards");
  await expect(cards.nth(4).locator(".stage-number")).toHaveText("5");

  await page.evaluate(async () => {
    const blob = new Blob(["Attention filters information. Working memory has limited capacity."], { type: "text/plain" });
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("generic-study-app");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("studyFiles", "readwrite");
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.objectStore("studyFiles").put({
          id: "summary-e2e-source", title: "Psychology notes", fileName: "psychology.txt",
          size: blob.size, createdAt: "2026-11-03T00:00:00Z", data: blob,
          mimeType: "text/plain", fileKind: "text", fileSource: "source-material", materialType: "my-note",
        });
        transaction.objectStore("studyFiles").put({
          id: "summary-e2e-second", title: "Other notes", fileName: "other.txt",
          size: blob.size, createdAt: "2026-11-03T00:00:01Z", data: blob,
          mimeType: "text/plain", fileKind: "text", fileSource: "source-material", materialType: "my-note",
        });
      };
    });
  });

  let requests = 0;
  await page.route("**/api/chatgpt-plan/ask-with-sources", async (route) => {
    requests += 1;
    const body = route.request().postDataJSON() as { confirmExternalRequest: boolean; passages: { sourceId: string; text: string }[] };
    expect(body.confirmExternalRequest).toBe(true);
    expect(body.passages).toHaveLength(1);
    expect(body.passages[0].text).toContain("Attention filters information");
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      answer: JSON.stringify({ summary: "Attention filters information [S1]", mainPoints: ["Working memory is limited [S1]"] }),
    }) });
  });

  await practice.getByRole("link", { name: "Create a summary" }).click();
  await expect(practice.getByRole("heading", { name: "Summary and Main Points" })).toBeVisible();
  await expect(practice.locator(".summary-page textarea")).toHaveCount(2);
  await practice.getByLabel("Source material").selectOption("file:summary-e2e-source");
  await practice.getByRole("button", { name: "Review excerpts for AI" }).click();
  await expect(practice.getByText("Only these excerpts will be sent.", { exact: false })).toBeVisible();
  expect(requests).toBe(0);
  await practice.getByLabel("I approve sending these excerpts to ChatGPT to create a draft.").check();
  await practice.getByRole("button", { name: "Generate AI draft" }).click();
  await expect(practice.locator(".summary-page textarea").first()).toHaveValue("Attention filters information [S1]");
  expect(requests).toBe(1);
  page.once("dialog", (dialog) => void dialog.dismiss());
  await practice.getByLabel("Source material").selectOption("file:summary-e2e-second");
  await expect(practice.getByLabel("Source material")).toHaveValue("file:summary-e2e-source");
  await expect(practice.locator(".summary-page textarea").first()).toHaveValue("Attention filters information [S1]");
  await practice.getByRole("button", { name: "Save locally" }).click();
  await expect(practice.getByText("Saved locally in Library → Summaries.")).toBeVisible();
  await expect(practice.getByRole("button", { name: "Download Psychology notes" })).toBeVisible();
  const download = page.waitForEvent("download");
  await practice.getByRole("button", { name: "Download Psychology notes" }).click();
  expect((await download).suggestedFilename()).toMatch(/\.txt$/u);
});
