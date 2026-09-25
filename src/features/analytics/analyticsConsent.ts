export type AnalyticsConsent = "granted" | "denied";

export const analyticsConsentStorageKey = "studyapp.analyticsConsent.v1";
export const studyAppGa4MeasurementId = "G-KQB1RM91V3";
export const analyticsConsentChangeEvent = "studyapp:analytics-consent-change";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let hashTrackingInstalled = false;

export function readAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(analyticsConsentStorageKey);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function setAnalyticsConsent(consent: AnalyticsConsent): void {
  window.localStorage.setItem(analyticsConsentStorageKey, consent);
  window.dispatchEvent(
    new CustomEvent<AnalyticsConsent>(analyticsConsentChangeEvent, {
      detail: consent,
    }),
  );

  if (consent === "granted") {
    enableGoogleAnalytics();
  } else {
    disableGoogleAnalytics();
  }
}

function ensureGtag(): NonNullable<Window["gtag"]> {
  window.dataLayer ??= [];
  window.gtag ??= (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };
  return window.gtag;
}

function trackHashPageView(): void {
  if (readAnalyticsConsent() !== "granted" || !window.gtag) return;

  window.gtag("event", "page_view", {
    page_location: window.location.href,
    page_path: `${window.location.pathname}${window.location.hash}`,
    page_title: document.title,
  });
}

export function enableGoogleAnalytics(): void {
  if (typeof window === "undefined" || readAnalyticsConsent() !== "granted") {
    return;
  }

  const gtag = ensureGtag();
  gtag("consent", "default", { analytics_storage: "granted" });
  gtag("js", new Date());
  gtag("config", studyAppGa4MeasurementId, { send_page_view: true });

  if (!document.getElementById("studyapp-ga4-script")) {
    const script = document.createElement("script");
    script.id = "studyapp-ga4-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${studyAppGa4MeasurementId}`;
    document.head.append(script);
  }

  if (!hashTrackingInstalled) {
    window.addEventListener("hashchange", trackHashPageView);
    hashTrackingInstalled = true;
  }
}

export function disableGoogleAnalytics(): void {
  if (typeof window === "undefined") return;

  if (window.gtag) {
    window.gtag("consent", "update", { analytics_storage: "denied" });
  }

  document.getElementById("studyapp-ga4-script")?.remove();
}
