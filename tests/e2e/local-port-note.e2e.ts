import { expect, test } from "@playwright/test";

test("port note explains both safe options and closes with Escape", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");
  const trigger = page.getByRole("button", { name: "IMPORTANT NOTE", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Starting StudyApp Local" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("port 8767");
  await expect(dialog).toContainText("This file does not stop other apps.");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("port note is available in the mobile menu in Greek", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/workspace-beta");
  await page.getByRole("button", { name: "GR", exact: true }).click();
  await page.getByLabel("Άνοιγμα μενού χώρου εργασίας").click();
  await page.getByRole("button", { name: "ΣΗΜΑΝΤΙΚΗ ΣΗΜΕΙΩΣΗ", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Εκκίνηση του StudyApp Local" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("δεν σταματά άλλες εφαρμογές");
  await dialog.getByRole("button", { name: "Κλείσιμο" }).click();
  await expect(dialog).not.toBeVisible();
});
