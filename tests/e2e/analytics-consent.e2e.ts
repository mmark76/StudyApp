import { expect, test } from "@playwright/test";

const consentKey = "studyapp.analyticsConsent.v1";
const measurementId = "G-KQB1RM91V3";

test("analytics remains off until explicit consent and can be disabled", async ({
  page,
}) => {
  await page.route("https://www.googletagmanager.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "",
    });
  });

  await page.goto("/");
  await page.evaluate((key) => window.localStorage.removeItem(key), consentKey);
  await page.reload();

  const banner = page.getByRole("complementary", {
    name: "Analytics choice",
  });
  await expect(banner).toBeVisible();
  await expect(page.locator("#studyapp-ga4-script")).toHaveCount(0);
  await expect
    .poll(() => page.evaluate((key) => window.localStorage.getItem(key), consentKey))
    .toBeNull();

  await banner.getByRole("button", { name: "Allow analytics" }).click();

  await expect(banner).toHaveCount(0);
  await expect(page.locator("#studyapp-ga4-script")).toHaveAttribute(
    "src",
    `https://www.googletagmanager.com/gtag/js?id=${measurementId}`,
  );
  await expect
    .poll(() => page.evaluate((key) => window.localStorage.getItem(key), consentKey))
    .toBe("granted");

  await page.goto("/#/legal/analytics");
  await expect(
    page.getByRole("heading", { name: "Your current choice" }),
  ).toBeVisible();
  await expect(page.getByText("Allowed", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Disable analytics" }).click();

  await expect(page.locator("#studyapp-ga4-script")).toHaveCount(0);
  await expect
    .poll(() => page.evaluate((key) => window.localStorage.getItem(key), consentKey))
    .toBe("denied");
  await expect(page.getByText("Not allowed", { exact: true })).toBeVisible();
});


test("Workspace BETA shows one consent banner and never loads GA4 in panel frames", async ({
  page,
}) => {
  await page.route("https://www.googletagmanager.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "",
    });
  });

  await page.goto("/");
  await page.evaluate((key) => window.localStorage.removeItem(key), consentKey);
  await page.reload();
  await page.goto("/#/workspace-beta");

  const banner = page.getByRole("complementary", {
    name: "Analytics choice",
  });
  await expect(banner).toHaveCount(1);

  const frames = [
    page.frameLocator('iframe[name="studyapp-workspace-sources"]'),
    page.frameLocator('iframe[name="studyapp-workspace-knowledge"]'),
    page.frameLocator('iframe[name="studyapp-workspace-practice"]'),
    page.frameLocator('iframe[name="studyapp-workspace-ai"]'),
  ];

  for (const frame of frames) {
    await expect(
      frame.getByRole("complementary", { name: "Analytics choice" }),
    ).toHaveCount(0);
    await expect(frame.locator("#studyapp-ga4-script")).toHaveCount(0);
  }

  await banner.getByRole("button", { name: "Allow analytics" }).click();

  await expect(page.locator("#studyapp-ga4-script")).toHaveCount(1);
  for (const frame of frames) {
    await expect(frame.locator("#studyapp-ga4-script")).toHaveCount(0);
  }
});
