import { expect, test } from "@playwright/test";

test("local development shows the informational notice without loading analytics", async ({
  page,
}) => {
  await page.goto("/");

  const notice = page.getByRole("complementary", { name: "Cookie-less analytics" });
  await expect(notice).toBeVisible();
  await expect(page.locator("#studyapp-cookieless-analytics")).toHaveCount(0);
  await expect(
    page.locator('script[src*="googletagmanager.com"]'),
  ).toHaveCount(0);
  await expect(
    page.evaluate(() => window.localStorage.getItem("studyapp.analyticsNoticeDismissed.v1")),
  ).resolves.toBeNull();
  await notice.getByRole("button", { name: "Close" }).click();
  await expect(notice).toBeHidden();
  await expect(
    page.evaluate(() => window.localStorage.getItem("studyapp.analyticsNoticeDismissed.v1")),
  ).resolves.toBe("true");
});

test("analytics information explains the cookie-less aggregate boundary", async ({ page }) => {
  await page.goto("/#/legal/analytics");

  await expect(
    page.getByRole("heading", { name: "Analytics information" }),
  ).toBeVisible();
  await expect(page.getByText("No analytics cookies are used.")).toBeVisible();
  await expect(
    page.getByText("The collector records only aggregate visit counts by UTC hour, domain and country."),
  ).toBeVisible();
  await expect(
    page.getByText("It does not store visitor identifiers, page paths, referrers, device details or events."),
  ).toBeVisible();
});

test("Workspace BETA does not duplicate the notice or analytics script in its panel frames", async ({
  page,
}) => {
  await page.goto("/#/workspace-beta");

  await expect(
    page.getByRole("complementary", { name: /analytics choice/i }),
  ).toHaveCount(0);
  await expect(page.locator("#studyapp-cookieless-analytics")).toHaveCount(0);

  const frames = [
    page.frameLocator('iframe[name="studyapp-workspace-sources"]'),
    page.frameLocator('iframe[name="studyapp-workspace-knowledge"]'),
    page.frameLocator('iframe[name="studyapp-workspace-practice"]'),
    page.frameLocator('iframe[name="studyapp-workspace-ai"]'),
  ];

  for (const frame of frames) {
    await expect(
      frame.getByRole("complementary", { name: /analytics choice/i }),
    ).toHaveCount(0);
    await expect(frame.locator("#studyapp-cookieless-analytics")).toHaveCount(0);
  }
});
