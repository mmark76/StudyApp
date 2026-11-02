import { expect, test } from "@playwright/test";

test.use({
  channel: process.env.STUDYAPP_TEST_CHROME === "1" ? "chrome" : undefined,
  serviceWorkers: "block",
});

test("Local AI Studio connects and disconnects without leaving the workspace", async ({ page }) => {
  let connected = false;
  await page.route("**/api/chatgpt-plan/connection", async (route) => {
    const request = route.request();
    if (request.method() === "POST") connected = true;
    if (request.method() === "DELETE") connected = false;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        connected,
        connectionState: connected ? "connected" : "disconnected",
        planUsageAuthorized: connected,
        scope: "current-windows-user",
      }),
    });
  });

  await page.goto("/#/workspace-beta");
  const studio = page.locator(".workspace-beta-panel-studio");
  await expect(studio.getByRole("button", { name: "Connect", exact: true })).toBeVisible();

  await studio.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(studio.getByRole("button", { name: "Disconnect", exact: true })).toBeVisible();
  await expect(studio.getByRole("textbox", { name: "Message ChatGPT" })).toBeVisible();
  await expect(studio.locator("iframe[name=studyapp-workspace-ai]")).toHaveCount(0);

  await studio.getByRole("button", { name: "Disconnect", exact: true }).click();
  await expect(studio.getByRole("button", { name: "Connect", exact: true })).toBeVisible();
  await expect(studio.getByRole("textbox", { name: "Message ChatGPT" })).toHaveCount(0);
  await expect(studio.locator("iframe[name=studyapp-workspace-ai]")).toBeVisible();
});

test("Connected chat attaches a text study file and sends excerpts only after approval", async ({ page }) => {
  let sentSources = 0;
  await page.route("**/api/chatgpt-plan/connection", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ connected: true, connectionState: "connected", planUsageAuthorized: true, scope: "current-windows-user" }),
    });
  });
  await page.route("**/api/chatgpt-plan/ask-with-sources", async (route) => {
    sentSources += 1;
    const payload = route.request().postDataJSON() as { question: string; passages: Array<{ documentTitle: string; text: string }> };
    expect(payload.question).toBe("Explain selective attention");
    expect(payload.passages[0].documentTitle).toBe("notes.txt");
    expect(payload.passages[0].text).toContain("Selective attention");
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ answer: "Selective attention focuses on relevant information." }) });
  });

  await page.goto("/#/workspace-beta");
  const studio = page.locator(".workspace-beta-panel-studio");
  const attach = studio.getByRole("button", { name: "Attach study files" });
  await expect(attach).toBeVisible();
  await studio.locator('.workspace-local-chat-upload input[type="file"]').setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Selective attention helps learners focus on relevant information rather than distractions."),
  });
  await expect(studio.getByText("notes.txt")).toBeVisible();
  await studio.getByRole("textbox", { name: "Message ChatGPT" }).fill("Explain selective attention");
  const send = studio.getByRole("button", { name: "Send", exact: true });
  await send.click();
  await expect(studio.getByText("Review excerpts before sending")).toBeVisible();
  expect(sentSources).toBe(0);
  await expect(send).toBeDisabled();
  await studio.getByRole("checkbox", { name: /I approve sending my question/ }).check();
  await send.click();
  await expect(studio.getByText("Selective attention focuses on relevant information.")).toBeVisible();
  expect(sentSources).toBe(1);
});

test("Connected chat sends a text-only question with the same Send button", async ({ page }) => {
  let requestCount = 0;
  await page.route("**/api/chatgpt-plan/connection", async (route) => {
    await route.fulfill({ json: { connected: true, connectionState: "connected", planUsageAuthorized: true, scope: "current-windows-user" } });
  });
  await page.route("**/api/chatgpt-plan/ask", async (route) => {
    requestCount += 1;
    expect(route.request().postDataJSON()).toEqual({ confirmExternalRequest: true, question: "Explain selective attention" });
    await route.fulfill({ json: { answer: "Attention is selective." } });
  });

  await page.goto("/#/workspace-beta");
  const studio = page.locator(".workspace-beta-panel-studio");
  await studio.getByRole("textbox", { name: "Message ChatGPT" }).fill("Explain selective attention");
  await studio.getByRole("button", { name: "Send", exact: true }).click();
  await expect(studio.getByText("Attention is selective.")).toBeVisible();
  expect(requestCount).toBe(1);
  await expect(studio.locator(".workspace-local-chat-review")).toHaveCount(0);
});
