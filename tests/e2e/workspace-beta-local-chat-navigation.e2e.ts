import { expect, test } from "@playwright/test";

test("connected Local conversation survives switching Workspace views", async ({ page }) => {
  let connectionChanges = 0;
  let chatRequests = 0;
  await page.route("**/api/chatgpt-plan/connection", async (route) => {
    if (route.request().method() !== "GET") connectionChanges += 1;
    await route.fulfill({ json: {
      connected: true,
      connectionState: "connected",
      planUsageAuthorized: true,
      scope: "current-windows-user",
    } });
  });
  await page.route("**/api/chatgpt-plan/models", async (route) => {
    await route.fulfill({ json: { models: [{ slug: "model-a", displayName: "Model A" }] } });
  });
  await page.route("**/api/chatgpt-plan/ask", async (route) => {
    chatRequests += 1;
    await route.fulfill({ json: { answer: "This answer stays in the conversation." } });
  });

  await page.goto("/#/workspace-beta");
  const workspace = page.locator(".workspace-beta-phase-workspace");
  const chat = workspace.locator(".workspace-local-chat");
  await page.getByRole("button", { name: /Sign in with ChatGPT/u }).click();
  await expect(chat).toBeVisible();
  await chat.getByRole("textbox", { name: "Message ChatGPT" }).fill("Keep this conversation");
  await chat.getByRole("button", { name: "Send", exact: true }).click();
  await expect(chat.getByText("This answer stays in the conversation.")).toBeVisible();

  await chat.locator('input[type="file"]').setInputFiles({
    name: "preserved-notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("These local notes remain attached while visiting Workspace tools."),
  });
  await chat.getByRole("textbox", { name: "Message ChatGPT" }).fill("Draft kept across navigation");

  await page.getByRole("button", { name: "Learning Goals", exact: true }).click();
  await expect(page.locator('iframe[name="studyapp-workspace-workspace"]')).toBeVisible();
  await page.getByRole("button", { name: "Back to AI options", exact: true }).click();
  await expect(page.locator(".workspace-beta-ai-options")).toBeVisible();
  await page.getByRole("button", { name: /Sign in with ChatGPT/u }).click();

  await expect(chat).toBeVisible();
  await expect(chat.getByText("This answer stays in the conversation.")).toBeVisible();
  await expect(chat.getByText("preserved-notes.txt")).toBeVisible();
  await expect(chat.getByRole("textbox", { name: "Message ChatGPT" })).toHaveValue("Draft kept across navigation");
  expect(chatRequests).toBe(1);
  expect(connectionChanges).toBe(0);
});
