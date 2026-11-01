import { expect, test } from "@playwright/test";

test("Workspace BETA displays the two agreed AI header actions without redundant in-frame navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  const ai = page.frameLocator('iframe[name="studyapp-workspace-ai"]');
  const header = page.locator(".workspace-beta-panel-studio .workspace-beta-functional-panel-header");
  const compare = header.getByRole("button", { name: "Compare AI options" });
  const back = header.getByRole("button", { name: "Back to AI Options" });

  await expect(ai.getByRole("heading", { name: "AI Assistant", exact: true })).toBeVisible();
  await expect(ai.getByRole("link", { name: "Back to Home" })).toHaveCount(0);
  await expect(page.locator(".workspace-beta-panel-studio > .workspace-beta-ai-launch-row")).toBeVisible();
  await expect(header.locator(".workspace-beta-panel-tools button")).toHaveCount(2);
  await expect(compare).toBeVisible();
  await expect(back).toBeVisible();

  await compare.click();
  await expect(page.locator(".workspace-beta-info-modal")).toBeVisible();
  await page.locator(".workspace-beta-info-modal").getByRole("button", { name: "Close" }).click();

  await ai.getByRole("link", { name: "Sign in with ChatGPT" }).click();
  await expect(ai.getByRole("heading", { name: "Use your ChatGPT plan" })).toBeVisible();
  await back.click();
  await expect(ai.getByText("1. Custom GPT / Plugin")).toBeVisible();
});

test("AI Studio download and Open Local actions share compact type and height", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/#/workspace-beta");
  const ai = page.frameLocator('iframe[name="studyapp-workspace-ai"]');
  await ai.getByRole("link", { name: "Sign in with ChatGPT" }).click();
  await expect(ai.getByRole("heading", { name: "Available in StudyApp Local" })).toBeVisible();
  const controls = ai.locator(".local-chatgpt-plan-download-link, .local-chatgpt-plan-open-local-link");
  await expect(controls).toHaveCount(3);
  const dimensions = await controls.evaluateAll((elements) =>
    elements.map((element) => ({
      height: element.getBoundingClientRect().height,
      fontSize: parseFloat(getComputedStyle(element).fontSize),
    })),
  );
  for (const { height, fontSize } of dimensions) {
    expect(fontSize).toBeLessThanOrEqual(12.5);
    expect(height).toBeLessThanOrEqual(28);
  }
  for (const { height } of dimensions.slice(1)) {
    expect(Math.abs(height - dimensions[0].height)).toBeLessThanOrEqual(1);
  }
});
