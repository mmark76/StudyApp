import { expect, test } from "@playwright/test";

test.use({
  channel: process.env.STUDYAPP_TEST_CHROME === "1" ? "chrome" : undefined,
  serviceWorkers: "block",
});

test.beforeEach(async ({ page }) => {
  await page.route("**/api/chatgpt-plan/models", async (route) => {
    await route.fulfill({ json: { models: [{ slug: "model-a", displayName: "Model A" }] } });
  });
});

async function openLocalMode(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /Sign in with ChatGPT/u }).click();
  return page.locator(".workspace-beta-phase-workspace");
}

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
  const studio = await openLocalMode(page);
  await expect(studio.getByRole("button", { name: "Connect", exact: true })).toBeVisible();

  await studio.getByRole("button", { name: "Connect", exact: true }).click();
  const disconnect = studio.getByRole("button", { name: "Disconnect", exact: true });
  await expect(disconnect).toBeVisible();
  const statusBox = await studio.getByText("ChatGPT connected", { exact: true }).boundingBox();
  const buttonBox = await disconnect.boundingBox();
  expect(statusBox).not.toBeNull();
  expect(buttonBox).not.toBeNull();
  expect(buttonBox!.x - (statusBox!.x + statusBox!.width)).toBeLessThan(16);
  await expect(studio.getByRole("textbox", { name: "Message ChatGPT" })).toBeVisible();
  await expect(studio.locator("iframe[name=studyapp-workspace-workspace]")).toHaveCount(0);

  await studio.getByRole("button", { name: "Disconnect", exact: true }).click();
  await expect(studio.getByRole("button", { name: /Sign in with ChatGPT/u })).toBeVisible();
  await expect(studio.getByRole("textbox", { name: "Message ChatGPT" })).toHaveCount(0);
  await expect(studio.locator(".workspace-beta-ai-options")).toBeVisible();
});

test("Disconnect reports an unconfirmed remote revocation", async ({ page }) => {
  let connected = true;
  await page.route("**/api/chatgpt-plan/connection", async (route) => {
    if (route.request().method() === "DELETE") connected = false;
    await route.fulfill({ json: {
      connected, connectionState: connected ? "connected" : "disconnected",
      planUsageAuthorized: connected, scope: "current-windows-user", revocationUnconfirmed: !connected,
    } });
  });
  await page.goto("/#/workspace-beta");
  const studio = await openLocalMode(page);
  await studio.getByRole("button", { name: "Disconnect", exact: true }).click();
  await expect(studio.getByRole("alert")).toContainText("could not be revoked");
});

test("Connected chat keeps RAG unavailable and never sends passages", async ({ page }) => {
  let sentSources = 0;
  await page.route("**/api/chatgpt-plan/connection", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ connected: true, connectionState: "connected", planUsageAuthorized: true, scope: "current-windows-user" }),
    });
  });
  await page.route("**/api/chatgpt-plan/ask-with-sources", async (route) => {
    sentSources += 1;
    await route.fulfill({ status: 503, json: { error: "RAG unavailable" } });
  });

  await page.goto("/#/workspace-beta");
  const studio = await openLocalMode(page);
  await expect(studio.getByText("RAG is still under construction and not available.")).toBeVisible();
  await expect(studio.getByRole("button", { name: "Attach study files" })).toHaveCount(0);
  expect(sentSources).toBe(0);
  await expect(studio.locator(".workspace-local-chat-review")).toHaveCount(0);
});

test("Connected chat sends a text-only question with the same Send button", async ({ page }) => {
  let requestCount = 0;
  await page.route("**/api/chatgpt-plan/connection", async (route) => {
    await route.fulfill({ json: { connected: true, connectionState: "connected", planUsageAuthorized: true, scope: "current-windows-user" } });
  });
  await page.route("**/api/chatgpt-plan/ask", async (route) => {
    requestCount += 1;
    expect(route.request().postDataJSON()).toEqual({ confirmExternalRequest: true, question: "Explain selective attention", model: "model-a" });
    await route.fulfill({ json: { answer: "Attention is selective." } });
  });

  await page.goto("/#/workspace-beta");
  const studio = page.locator(".workspace-beta-phase-workspace");
  await page.getByRole("button", { name: /Sign in with ChatGPT/u }).click();
  await studio.getByRole("textbox", { name: "Message ChatGPT" }).fill("Explain selective attention");
  await studio.getByRole("button", { name: "Send", exact: true }).click();
  await expect(studio.getByText("Attention is selective.")).toBeVisible();
  expect(requestCount).toBe(1);
  await expect(studio.locator(".workspace-local-chat-review")).toHaveCount(0);
});

test("Connected chat selects a discovered model and refreshes after an account change", async ({ page }) => {
  let connectionId = "account-one";
  let catalog = [
    { slug: "model-a", displayName: "Model A" },
    { slug: "model-b", displayName: "Model B" },
  ];
  let sentModel = "";
  await page.route("**/api/chatgpt-plan/connection", async (route) => {
    await route.fulfill({ json: { connected: true, connectionState: "connected", planUsageAuthorized: true, scope: "current-windows-user", connectionId } });
  });
  await page.route("**/api/chatgpt-plan/models", async (route) => {
    await route.fulfill({ json: { models: catalog } });
  });
  await page.route("**/api/chatgpt-plan/ask", async (route) => {
    sentModel = route.request().postDataJSON().model;
    await route.fulfill({ json: { answer: "Answer" } });
  });

  await page.goto("/#/workspace-beta");
  const studio = page.locator(".workspace-beta-phase-workspace");
  await page.getByRole("button", { name: /Sign in with ChatGPT/u }).click();
  const selector = studio.getByRole("combobox", { name: "Model" });
  await expect(selector).toBeEnabled();
  await expect(selector.locator("option")).toHaveText(["Model A", "Model B"]);
  await selector.selectOption("model-b");
  await studio.getByRole("textbox", { name: "Message ChatGPT" }).fill("Question");
  await studio.getByRole("button", { name: "Send", exact: true }).click();
  await expect(studio.getByText("Answer", { exact: true })).toBeVisible();
  expect(sentModel).toBe("model-b");

  catalog = [{ slug: "model-c", displayName: "Model C" }];
  connectionId = "account-two";
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(selector).toHaveValue("model-c");
  await expect(selector.locator("option")).toHaveText(["Model C"]);
});

test("Unavailable model keeps the draft and reloads the account catalog", async ({ page }) => {
  let catalog = [{ slug: "model-a", displayName: "Model A" }];
  await page.route("**/api/chatgpt-plan/connection", async (route) => {
    await route.fulfill({ json: { connected: true, connectionState: "connected", planUsageAuthorized: true, scope: "current-windows-user" } });
  });
  await page.route("**/api/chatgpt-plan/models", async (route) => {
    await route.fulfill({ json: { models: catalog } });
  });
  await page.route("**/api/chatgpt-plan/ask", async (route) => {
    catalog = [{ slug: "model-b", displayName: "Model B" }];
    await route.fulfill({ status: 400, json: { error: "Model unavailable", code: "model_unavailable" } });
  });

  await page.goto("/#/workspace-beta");
  const studio = page.locator(".workspace-beta-phase-workspace");
  await page.getByRole("button", { name: /Sign in with ChatGPT/u }).click();
  const question = studio.getByRole("textbox", { name: "Message ChatGPT" });
  await expect(studio.getByRole("combobox", { name: "Model" })).toHaveValue("model-a");
  await question.fill("Keep this question");
  await studio.getByRole("button", { name: "Send", exact: true }).click();
  await expect(studio.getByText("Selected model is no longer available. Choose a model and try again.")).toBeVisible();
  await expect(question).toHaveValue("Keep this question");
  await expect(studio.getByRole("combobox", { name: "Model" })).toHaveValue("model-b");
});
