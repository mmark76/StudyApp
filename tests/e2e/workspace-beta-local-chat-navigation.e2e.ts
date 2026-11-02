import { expect, test } from "@playwright/test";

test("connected Local AI Studio can visit AI options and return to its preserved conversation", async ({ page }) => {
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
  const studio = page.locator(".workspace-beta-panel-studio");
  const chat = studio.locator(".workspace-local-chat");
  await expect(chat).toBeVisible();
  await studio.getByRole("textbox", { name: "Message ChatGPT" }).fill("Keep this conversation");
  await studio.getByRole("button", { name: "Send", exact: true }).click();
  await expect(chat.getByText("This answer stays in the conversation.")).toBeVisible();

  await studio.locator('.workspace-local-chat-upload input[type="file"]').setInputFiles({
    name: "preserved-notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("These local notes remain attached while visiting AI options."),
  });
  await expect(chat.getByText("preserved-notes.txt")).toBeVisible();
  await studio.getByRole("textbox", { name: "Message ChatGPT" }).fill("Draft kept across navigation");

  await page.getByRole("button", { name: "Back to AI Options" }).click();
  const aiFrame = page.frameLocator('iframe[name="studyapp-workspace-ai"]');
  await expect(studio.locator('iframe[name="studyapp-workspace-ai"]')).toBeVisible();
  await expect(aiFrame.getByText("1. Custom GPT / Plugin", { exact: true })).toBeVisible();
  await expect(aiFrame.getByText("2. Sign in with ChatGPT", { exact: true })).toBeVisible();
  await expect(aiFrame.getByText("3. ChatGPT App / MCP", { exact: true })).toBeVisible();
  await expect(aiFrame.getByText("4. StudyApp AI / API", { exact: true })).toBeVisible();
  await expect(chat).toBeHidden();
  await expect(chat).toHaveCount(1);
  await expect(studio.getByRole("button", { name: "Disconnect", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Return to ChatGPT conversation" }).click();
  await expect(studio.locator('iframe[name="studyapp-workspace-ai"]')).toHaveCount(0);
  await expect(chat).toBeVisible();
  await expect(chat.getByText("This answer stays in the conversation.")).toBeVisible();
  await expect(chat.getByText("preserved-notes.txt")).toBeVisible();
  await expect(studio.getByRole("textbox", { name: "Message ChatGPT" })).toHaveValue("Draft kept across navigation");
  await expect(studio.getByRole("button", { name: "Disconnect", exact: true })).toBeVisible();
  expect(chatRequests).toBe(1);
  expect(connectionChanges).toBe(0);
});
