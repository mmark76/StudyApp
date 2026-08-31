export type GoogleAnalyticsConsent = "granted" | "denied" | "unset";

export const GOOGLE_ANALYTICS_CONSENT_KEY = "studyapp.analytics.google-consent.v1";
export const PLAUSIBLE_IGNORE_KEY = "plausible_ignore";
export const ANALYTICS_PREFERENCES_EVENT = "studyapp:analytics-preferences";

function storageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readGoogleAnalyticsConsent(): GoogleAnalyticsConsent {
  if (!storageAvailable()) return "unset";

  const value = window.localStorage.getItem(GOOGLE_ANALYTICS_CONSENT_KEY);
  return value === "granted" || value === "denied" ? value : "unset";
}

export function writeGoogleAnalyticsConsent(consent: Exclude<GoogleAnalyticsConsent, "unset">): void {
  if (!storageAvailable()) return;
  if (window.localStorage.getItem(GOOGLE_ANALYTICS_CONSENT_KEY) === consent) return;

  window.localStorage.setItem(GOOGLE_ANALYTICS_CONSENT_KEY, consent);
  window.dispatchEvent(new Event(ANALYTICS_PREFERENCES_EVENT));
}

export function isDeviceExcludedFromAnalytics(): boolean {
  return storageAvailable() && window.localStorage.getItem(PLAUSIBLE_IGNORE_KEY) === "true";
}

export function setDeviceExcludedFromAnalytics(excluded: boolean): void {
  if (!storageAvailable()) return;
  if (isDeviceExcludedFromAnalytics() === excluded) return;

  if (excluded) {
    window.localStorage.setItem(PLAUSIBLE_IGNORE_KEY, "true");
  } else {
    window.localStorage.removeItem(PLAUSIBLE_IGNORE_KEY);
  }
  window.dispatchEvent(new Event(ANALYTICS_PREFERENCES_EVENT));
}
