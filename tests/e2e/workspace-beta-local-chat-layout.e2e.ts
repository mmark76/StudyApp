import { expect, test } from "@playwright/test";

test("RAG approval controls stay keyboard reachable at 100% zoom with six passages", async ({ page }) => {
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
    await route.fulfill({ json: { answer: "Approved passages received." } });
  });

  const viewports = [
    { width: 1280, height: 720, theme: "light" },
    { width: 1440, height: 900, theme: "dark" },
  ] as const;

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/#/workspace-beta");
    await page.evaluate((theme) => document.documentElement.setAttribute("data-workspace-theme", theme), viewport.theme);
    expect(await page.evaluate(() => window.visualViewport?.scale ?? 1)).toBe(1);
    expect(await page.evaluate(() => window.devicePixelRatio)).toBe(1);

    const studio = page.locator(".workspace-beta-panel-studio");
    await expect(studio.getByRole("textbox", { name: "Message ChatGPT" })).toBeVisible();
    const content = Array.from({ length: 12 }, (_, index) =>
      `Passage ${index + 1} describes attention and study strategies. ${"Attention helps learners focus on the relevant study material. ".repeat(48)}`,
    ).join(" ");
    await studio.locator('.workspace-local-chat-upload input[type="file"]').setInputFiles({
      name: "six-passages.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(content),
    });
    await studio.getByRole("textbox", { name: "Message ChatGPT" }).fill("Explain attention in study strategies");
    await studio.getByRole("button", { name: "Find excerpts" }).click();

    const review = studio.locator(".workspace-local-chat-review");
    await expect(review.getByText("Review excerpts before sending")).toBeVisible();
    await expect(review.locator(".workspace-local-chat-review-excerpts details")).toHaveCount(6);
    expect(sourceRequests).toBe(0);

    const composer = studio.locator(".workspace-local-chat-composer");
    const consent = review.getByRole("checkbox", { name: /I approve sending my question/ });
    await consent.focus();
    await expect(consent).toBeInViewport();
    await page.keyboard.press("Space");

    const send = review.getByRole("button", { name: "Send approved excerpts" });
    const cancel = review.getByRole("button", { name: "Cancel" });
    await expect(send).toBeEnabled();
    await page.keyboard.press("Tab");
    await expect(send).toBeFocused();
    await expect(send).toBeInViewport();
    await page.keyboard.press("Tab");
    await expect(cancel).toBeFocused();
    await expect(cancel).toBeInViewport();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    if (viewport.height <= 720) {
      expect(await composer.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    }

    await cancel.click();
    await expect(review).toHaveCount(0);
    expect(sourceRequests).toBe(0);
  }
});
