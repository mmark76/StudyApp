import { expect, test } from "@playwright/test";

test("BETA summary wording does not change the hidden Standard summary route", async ({ page }) => {
  await page.goto("/#/summary");
  await expect(page.getByRole("heading", { name: "Summary and Main Points" })).toBeVisible();
  await expect(page.getByText("Create a study summary from your local materials.", { exact: false })).toBeVisible();

  await page.goto("/#/summary?workspace=beta");
  await expect(page.getByRole("heading", { name: "Summary of Uploaded Material" })).toBeVisible();
  await expect(page.getByText("Select material uploaded from the left panel and create its summary.")).toBeVisible();
});

test("Practice Summary and Main Points uses local sources and a confirmed mocked AI draft", async ({ page }) => {
  await page.goto("/#/workspace-beta");

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
  await page.route("**/api/chatgpt-plan/models", (route) => route.fulfill({ status: 200, contentType: "application/json",
    body: JSON.stringify({ models: [{ slug: "test-model", displayName: "Test Model" }] }) }));
  await page.route("**/api/chatgpt-plan/summarize-parts", async (route) => {
    requests += 1;
    const body = route.request().postDataJSON() as { confirmExternalRequest: boolean; phase: string; model: string; parts: { sourceId: string; text: string }[] };
    expect(body.confirmExternalRequest).toBe(true);
    expect(body.model).toBe("test-model");
    expect(body.phase).toBe("extract");
    expect(body.parts).toHaveLength(1);
    expect(body.parts[0].text).toContain("Attention filters information");
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      answer: JSON.stringify({ summary: "Attention filters information [S1]", mainPoints: ["Working memory is limited [S1]"] }),
    }) });
  });

  await page.getByRole("button", { name: "Summary of Uploaded Material", exact: true }).click();
  await expect(page.locator('iframe[name="studyapp-workspace-workspace"]')).toHaveAttribute("src", "/#/summary?workspace=beta");
  const practice = page.frameLocator('iframe[name="studyapp-workspace-workspace"]');
  await expect(practice.getByRole("heading", { name: "Summary of Uploaded Material" })).toBeVisible();
  await expect(practice.getByText("Select material uploaded from the left panel and create its summary.")).toBeVisible();
  await expect(practice.locator(".summary-page textarea")).toHaveCount(2);
  await practice.getByLabel("Source material").selectOption("file:summary-e2e-source");
  await practice.getByRole("button", { name: "Check full-document coverage" }).click();
  await expect(practice.getByText("Complete readable coverage.", { exact: false })).toBeVisible();
  expect(requests).toBe(0);
  await practice.getByLabel("I approve sending all selected document text to ChatGPT across multiple requests to create this draft.").check();
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

test("full-document consent sends every chunk from two long sources before a final draft", async ({ page }) => {
  await page.goto("/#/workspace-beta");
  const first = `BEGIN ${"alpha ".repeat(3_500)} MIDDLE`;
  const second = `${"beta ".repeat(3_500)} END`;
  await page.evaluate(async (documents) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("generic-study-app");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("studyFiles", "readwrite");
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => { db.close(); resolve(); };
        for (const [index, content] of documents.entries()) {
          const data = new Blob([content], { type: "text/plain" });
          transaction.objectStore("studyFiles").put({ id: `long-${index}`, title: `Long ${index + 1}`,
            fileName: `long-${index}.txt`, size: data.size, createdAt: `2026-11-03T00:00:0${index}Z`, data,
            mimeType: "text/plain", fileKind: "text", fileSource: "source-material" });
        }
      };
    });
  }, [first, second]);

  const sent = new Map<string, string[]>();
  let combines = 0;
  await page.route("**/api/chatgpt-plan/models", (route) => route.fulfill({ status: 200, contentType: "application/json",
    body: JSON.stringify({ models: [{ slug: "test-model", displayName: "Test Model" }] }) }));
  await page.route("**/api/chatgpt-plan/summarize-parts", async (route) => {
    const body = route.request().postDataJSON() as { confirmExternalRequest: boolean; model: string; phase: "extract" | "combine";
      parts: { sourceId: string; citation: string; text: string }[] };
    expect(body.confirmExternalRequest).toBe(true);
    expect(body.model).toBe("test-model");
    if (body.phase === "extract") {
      const part = body.parts[0];
      sent.set(part.sourceId, [...(sent.get(part.sourceId) ?? []), part.text]);
    } else combines += 1;
    const content = body.parts.map((part) => part.text).join(" ");
    const markers = ["BEGIN", "MIDDLE", "END"].filter((marker) => content.includes(marker)).join(" ") || "study content";
    const citation = body.phase === "extract" ? body.parts[0].citation : "[S1] [S2]";
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      answer: JSON.stringify({ summary: `${markers} ${citation}`, mainPoints: [`${markers} ${citation}`] }),
    }) });
  });

  await page.getByRole("button", { name: "Summary of Uploaded Material", exact: true }).click();
  const practice = page.frameLocator('iframe[name="studyapp-workspace-workspace"]');
  await practice.getByLabel("Source material").selectOption(["file:long-0", "file:long-1"]);
  await practice.getByRole("button", { name: "Check full-document coverage" }).click();
  await expect(practice.getByText(/2 sources, 2 pages or sections, \d+ extracted chunks/)).toBeVisible();
  expect(sent.size).toBe(0);
  await practice.getByLabel("I approve sending all selected document text to ChatGPT across multiple requests to create this draft.").check();
  await practice.getByRole("button", { name: "Generate AI draft" }).click();
  await expect(practice.locator(".summary-page textarea").first()).toHaveValue(/BEGIN MIDDLE END/u);
  expect((sent.get("S1") ?? []).join("")).toBe(first);
  expect((sent.get("S2") ?? []).join("")).toBe(second);
  expect((sent.get("S1")?.length ?? 0) + (sent.get("S2")?.length ?? 0)).toBeGreaterThan(6);
  expect(combines).toBeGreaterThan(0);
});
