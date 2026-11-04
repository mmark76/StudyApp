import { expect, test } from "@playwright/test";

test("Workspace BETA desktop defaults to 20-60-20 resizable columns", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");
  const panels = page.locator(".workspace-beta-phase-one-grid > .workspace-beta-panel");
  await expect(panels).toHaveCount(3);
  const widths = await panels.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().width));
  expect(Math.abs(widths[0] - widths[2])).toBeLessThanOrEqual(2);
  expect(Math.abs(widths[1] - (widths[0] * 3))).toBeLessThanOrEqual(4);

  const dividers = page.locator('[role="separator"][aria-orientation="vertical"]');
  await expect(dividers).toHaveCount(2);
  const firstDividerBox = await dividers.first().boundingBox();
  if (!firstDividerBox) throw new Error("First Workspace divider was not measurable");
  await page.mouse.move(firstDividerBox.x + firstDividerBox.width / 2, firstDividerBox.y + 80);
  await page.mouse.down();
  await page.mouse.move(firstDividerBox.x + firstDividerBox.width / 2 + 80, firstDividerBox.y + 80, { steps: 5 });
  await page.mouse.up();
  const resizedWidths = await panels.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().width));
  expect(resizedWidths[0]).toBeGreaterThan(widths[0]);
  expect(resizedWidths[1]).toBeLessThan(widths[1]);
  expect(Math.abs(resizedWidths[2] - widths[2])).toBeLessThanOrEqual(2);

  await dividers.first().dblclick();
  const resetWidths = await panels.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().width));
  expect(Math.abs(resetWidths[0] - resetWidths[2])).toBeLessThanOrEqual(2);
  expect(Math.abs(resetWidths[1] - (resetWidths[0] * 3))).toBeLessThanOrEqual(4);

  await dividers.nth(1).focus();
  await dividers.nth(1).press("ArrowLeft");
  const keyboardWidths = await panels.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().width));
  expect(keyboardWidths[1]).toBeLessThan(resetWidths[1]);
  expect(keyboardWidths[2]).toBeGreaterThan(resetWidths[2]);
  await dividers.nth(1).press("Home");
  const keyboardResetWidths = await panels.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().width));
  expect(Math.abs(keyboardResetWidths[0] - keyboardResetWidths[2])).toBeLessThanOrEqual(2);
  expect(Math.abs(keyboardResetWidths[1] - (keyboardResetWidths[0] * 3))).toBeLessThanOrEqual(4);
});

test("AI Agent panel starts at 10 percent, remains unavailable in Web/PWA, and has a movable horizontal divider", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");

  const upper = page.locator(".workspace-beta-central-content");
  const agent = page.locator(".workspace-beta-persistent-agent");
  const divider = page.getByRole("separator", { name: "Resize Workspace and AI Agent" });
  await expect(divider).toBeVisible();

  const initial = await Promise.all([upper, agent].map((locator) => locator.evaluate((element) => element.getBoundingClientRect().height)));
  const initialAgentRatio = initial[1] / (initial[0] + initial[1]);
  expect(initialAgentRatio).toBeGreaterThan(0.08);
  expect(initialAgentRatio).toBeLessThan(0.12);
  await expect(agent.locator(".workspace-beta-agent-bar")).toContainText("Not available");

  const dividerBox = await divider.boundingBox();
  if (!dividerBox) throw new Error("AI Agent divider was not measurable");
  await page.mouse.move(dividerBox.x + dividerBox.width / 2, dividerBox.y + dividerBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(dividerBox.x + dividerBox.width / 2, dividerBox.y - 60, { steps: 5 });
  await page.mouse.up();
  const resizedAgentHeight = await agent.evaluate((element) => element.getBoundingClientRect().height);
  expect(resizedAgentHeight).toBeGreaterThan(initial[1]);

  await divider.dblclick();
  const reset = await Promise.all([upper, agent].map((locator) => locator.evaluate((element) => element.getBoundingClientRect().height)));
  const resetAgentRatio = reset[1] / (reset[0] + reset[1]);
  expect(resetAgentRatio).toBeGreaterThan(0.08);
  expect(resetAgentRatio).toBeLessThan(0.12);
});

test("Local ChatGPT connection changes the default central split to 50-50 and disconnect restores 90-10", async ({ page }) => {
  let connected = false;
  await page.route("**/api/chatgpt-plan/connection", async (route) => {
    if (route.request().method() === "POST") connected = true;
    if (route.request().method() === "DELETE") connected = false;
    await route.fulfill({ json: {
      connected,
      connectionState: connected ? "connected" : "disconnected",
      planUsageAuthorized: connected,
      scope: "current-windows-user",
    } });
  });
  await page.route("**/api/chatgpt-plan/models", async (route) => {
    await route.fulfill({ json: { models: [{ slug: "model-a", displayName: "Model A" }] } });
  });

  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");
  const upper = page.locator(".workspace-beta-central-content");
  const agent = page.locator(".workspace-beta-persistent-agent");
  const divider = page.getByRole("separator", { name: "Resize Workspace and AI Agent" });
  const agentRatio = async () => {
    const heights = await Promise.all([upper, agent].map((panel) => panel.evaluate((element) => element.getBoundingClientRect().height)));
    return heights[1] / (heights[0] + heights[1]);
  };

  await expect(divider).toHaveAttribute("aria-valuenow", "90");
  await page.getByRole("button", { name: /Sign in with ChatGPT/u }).click();
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(divider).toHaveAttribute("aria-valuenow", "50");
  await expect.poll(agentRatio).toBeGreaterThan(0.48);
  expect(await agentRatio()).toBeLessThan(0.52);

  const dividerBox = await divider.boundingBox();
  if (!dividerBox) throw new Error("Connected Local AI Agent divider was not measurable");
  await page.mouse.move(dividerBox.x + dividerBox.width / 2, dividerBox.y + dividerBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(dividerBox.x + dividerBox.width / 2, dividerBox.y + dividerBox.height / 2 - 60, { steps: 5 });
  await page.mouse.up();
  expect(await agentRatio()).toBeGreaterThan(0.54);

  await divider.dblclick();
  await expect(divider).toHaveAttribute("aria-valuenow", "50");
  await expect.poll(agentRatio).toBeLessThan(0.52);

  await page.getByRole("button", { name: "Disconnect", exact: true }).click();
  await expect(divider).toHaveAttribute("aria-valuenow", "90");
  await expect.poll(agentRatio).toBeLessThan(0.12);
  expect(await agentRatio()).toBeGreaterThan(0.08);
});
