import { expect, test } from "@playwright/test";

test("Workspace BETA wheel scrolls the active frame under the pointer", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");
  const sourceElement = page.locator('iframe[name="studyapp-workspace-sources"]');
  const sourceBox = await sourceElement.boundingBox();
  const sourceFrame = page.frame({ name: "studyapp-workspace-sources" });
  if (!sourceBox || !sourceFrame) throw new Error("Sources frame was not available");

  await sourceFrame.evaluate(() => {
    const scroller = document.createElement("div");
    scroller.dataset.workspaceWheelScroller = "true";
    Object.assign(scroller.style, {
      position: "fixed", left: "20px", top: "100px", width: "180px", height: "160px",
      overflow: "auto", zIndex: "2147483647", background: "white",
    });
    const content = document.createElement("div");
    content.style.height = "1400px";
    scroller.appendChild(content);
    document.body.appendChild(scroller);
  });

  await page.getByRole("button", { name: "Compare AI options" }).focus();
  await page.mouse.move(sourceBox.x + 80, sourceBox.y + 180);
  await page.mouse.wheel(0, 500);
  await expect.poll(() => sourceFrame.evaluate(() =>
    document.querySelector<HTMLElement>("[data-workspace-wheel-scroller]")?.scrollTop ?? 0,
  )).toBeGreaterThan(0);
});
