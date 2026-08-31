import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  getApprovedPlausibleScriptUrl,
  getSafeAnalyticsRoute,
  getSafeAnalyticsUrl,
} from "../src/features/analytics/analyticsClient";
import { legalPages } from "../src/features/legal/legalPages";

function readRepositoryFile(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("analytics privacy boundary", () => {
  it("uses only allowlisted StudyApp routes", () => {
    expect(getSafeAnalyticsRoute("#/library")).toBe("/library");
    expect(getSafeAnalyticsRoute("#/workspace-beta")).toBe("/workspace-beta");
    expect(getSafeAnalyticsRoute("#/library?search=private-notes")).toBe("/library");
    expect(getSafeAnalyticsRoute("#/unknown/private-chapter-name")).toBe("/other");
    expect(getSafeAnalyticsRoute("#javascript:private-data")).toBe("/other");
  });

  it("keeps approved campaign attribution but removes arbitrary parameters and hash data", () => {
    const safeUrl = getSafeAnalyticsUrl({
      hash: "#/flashcards?query=secret-term",
      origin: "https://studyapp.markellosecosystem.com",
      search: "?utm_source=newsletter&utm_campaign=launch&utm_term=private-search&token=secret&filename=notes.pdf",
    } as Location);

    expect(safeUrl).toBe(
      "https://studyapp.markellosecosystem.com/flashcards?utm_source=newsletter&utm_campaign=launch",
    );
    expect(safeUrl).not.toContain("secret");
    expect(safeUrl).not.toContain("notes.pdf");
  });

  it("loads only a site-specific script from the approved Plausible host", () => {
    expect(getApprovedPlausibleScriptUrl("https://plausible.io/js/pa-AbC123_xYz.js")).toBe(
      "https://plausible.io/js/pa-AbC123_xYz.js",
    );
    expect(getApprovedPlausibleScriptUrl("https://example.com/js/pa-AbC123.js")).toBeNull();
    expect(getApprovedPlausibleScriptUrl("https://plausible.io/js/script.js")).toBeNull();
    expect(getApprovedPlausibleScriptUrl("javascript:alert(1)")).toBeNull();
  });

  it("keeps Plausible and GA4 interaction measurements disabled in runtime configuration", () => {
    const client = readRepositoryFile("src/features/analytics/analyticsClient.ts");
    const productionEnvironment = readRepositoryFile(".env.production");

    expect(client).toContain("autoCapturePageviews: false");
    expect(client).toContain("hashBasedRouting: false");
    expect(client).toContain("send_page_view: false");
    expect(client).toContain('ad_storage: "denied"');
    expect(client).toContain('ad_user_data: "denied"');
    expect(client).toContain('ad_personalization: "denied"');
    expect(client).not.toContain('gtag?.("event", "click"');
    expect(client).not.toContain('plausible?.("File Download"');
    expect(productionEnvironment).toContain("VITE_GA4_MEASUREMENT_ID=G-KQB1RM91V3");
  });

  it("documents both providers and excludes study content", () => {
    const analyticsCopy = JSON.stringify(legalPages.analytics);
    const privacyCopy = JSON.stringify(legalPages.privacy);

    expect(analyticsCopy).toContain("Plausible Analytics");
    expect(analyticsCopy).toContain("Google Analytics");
    expect(privacyCopy).toContain("Neither analytics service receives study material");
    expect(privacyCopy).toContain("Καμία υπηρεσία analytics δεν λαμβάνει υλικό μελέτης");
  });
});
