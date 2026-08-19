import { expect, test } from "@playwright/test";

test("Workspace BETA wheel scrolls the element under the pointer without a click", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  const divider = page.locator(".workspace-beta-resizer").first();
  const dividerBox = await divider.boundingBox();
  if (!dividerBox) throw new Error("Workspace divider was not measurable");

  await page.mouse.move(
    dividerBox.x + dividerBox.width / 2,
    dividerBox.y + dividerBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    dividerBox.x + dividerBox.width / 2 + 72,
    dividerBox.y + dividerBox.height / 2,
    { steps: 5 },
  );
  await page.mouse.up();

  const practiceFrameElement = page.locator('iframe[name="studyapp-workspace-practice"]');
  const practiceBox = await practiceFrameElement.boundingBox();
  if (!practiceBox) throw new Error("Practice iframe was not measurable");

  const practiceFrame = page.frame({ name: "studyapp-workspace-practice" });
  if (!practiceFrame) throw new Error("Practice iframe was not available");

  await practiceFrame.evaluate(() => {
    const scroller = document.createElement("div");
    scroller.dataset.workspaceWheelScroller = "true";
    Object.assign(scroller.style, {
      position: "fixed",
      left: "20px",
      top: "120px",
      width: "240px",
      height: "160px",
      overflow: "auto",
      zIndex: "2147483647",
      background: "white",
    });

    const content = document.createElement("div");
    content.style.height = "1400px";
    scroller.appendChild(content);
    document.body.appendChild(scroller);
    scroller.scrollTop = 0;
  });

  await divider.focus();
  await expect.poll(() => page.evaluate(() =>
    document.activeElement?.classList.contains("workspace-beta-resizer"),
  )).toBe(true);

  await page.mouse.move(practiceBox.x + 80, practiceBox.y + 180);
  await page.mouse.wheel(0, 500);

  await expect.poll(() => practiceFrame.evaluate(() => {
    const scroller = document.querySelector<HTMLElement>("[data-workspace-wheel-scroller]");
    return scroller?.scrollTop ?? 0;
  })).toBeGreaterThan(0);
});
