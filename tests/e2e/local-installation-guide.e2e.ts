import { expect, test } from "@playwright/test";

test("Workspace BETA opens the bilingual StudyApp Local installation guide", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#/workspace-beta");

  await page.getByRole("link", { name: "Installation Guide", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Installation Guide" });
  await expect(dialog).toBeVisible();
  const guide = page.frameLocator("iframe.workspace-beta-info-modal-frame");
  await expect(guide.getByRole("heading", { name: "First-time installation" })).toBeVisible();
  await expect(guide.getByRole("heading", { name: "Update StudyApp Local" })).toBeVisible();
  await expect(guide.getByText("Keep this Terminal running. You can minimize it, but do not close it.")).toBeVisible();
  await expect(guide.getByText("Only your question and the excerpts you approve are sent to ChatGPT; the original files stay on your device.")).toBeVisible();

  await dialog.getByRole("button", { name: "Close" }).click();
  await page.getByRole("button", { name: "GR" }).click();
  await page.getByRole("link", { name: "Οδηγός εγκατάστασης", exact: true }).click();
  const greekDialog = page.getByRole("dialog", { name: "Οδηγός εγκατάστασης" });
  const greekGuide = page.frameLocator("iframe.workspace-beta-info-modal-frame");
  await expect(greekDialog).toBeVisible();
  await expect(greekGuide.getByRole("heading", { name: "Πρώτη εγκατάσταση" })).toBeVisible();
  await expect(greekGuide.getByRole("heading", { name: "Ενημέρωση StudyApp Local" })).toBeVisible();
  await expect(greekGuide.getByText("Διατήρησε το παράθυρο ανοιχτό. Μπορείς να το ελαχιστοποιήσεις, αλλά όχι να το κλείσεις.")).toBeVisible();
  await expect(greekGuide.getByText("Στο ChatGPT αποστέλλονται μόνο η ερώτησή σου και τα αποσπάσματα που εγκρίνεις· τα αρχικά αρχεία παραμένουν στη συσκευή σου.")).toBeVisible();
});

test("mobile Workspace menu includes the Local installation guide", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/workspace-beta");
  await page.locator(".workspace-beta-mobile-menu > summary").click();
  await page.locator(".workspace-beta-mobile-menu-popover").getByRole("button", { name: "Installation Guide" }).click();
  await expect(page.getByRole("dialog", { name: "Installation Guide" })).toBeVisible();
});
