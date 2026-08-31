import {
  ANALYTICS_PREFERENCES_EVENT,
  isDeviceExcludedFromAnalytics,
  readGoogleAnalyticsConsent,
} from "./analyticsPreferences";

type AnalyticsArguments = readonly unknown[];
type GoogleTag = (...args: AnalyticsArguments) => void;
type PlausibleTag = ((eventName: string, options?: Record<string, unknown>) => void) & {
  init?: (options?: Record<string, unknown>) => void;
  o?: Record<string, unknown>;
  q?: AnalyticsArguments[];
};

declare global {
  interface Window {
    dataLayer?: AnalyticsArguments[];
    gtag?: GoogleTag;
    plausible?: PlausibleTag;
  }
}

const PRODUCTION_HOST = "studyapp.markellosecosystem.com";
const GA_SCRIPT_ID = "studyapp-ga4-script";
const PLAUSIBLE_SCRIPT_ID = "studyapp-plausible-script";
const SAFE_ROUTES = new Set([
  "/",
  "/appearance",
  "/ai-assistant-guide",
  "/ai-assistant-comparison",
  "/important-info",
  "/instructions",
  "/sources",
  "/core-knowledge",
  "/study",
  "/study/theory",
  "/learn",
  "/library",
  "/units",
  "/flashcards",
  "/review",
  "/quiz",
  "/progress",
  "/import",
  "/tools",
  "/legal/license",
  "/legal/privacy",
  "/legal/analytics",
  "/legal/copyright",
  "/workspace-beta",
]);
const ALLOWED_CAMPAIGN_PARAMETERS = [
  "ref",
  "utm_source",
  "utm_medium",
  "utm_campaign",
] as const;

let googleTagInitialized = false;

export function isAnalyticsProductionContext(): boolean {
  return typeof window !== "undefined"
    && window.location.protocol === "https:"
    && window.location.hostname === PRODUCTION_HOST
    && window.top === window.self
    && !window.name.startsWith("studyapp-workspace-");
}

export function getSafeAnalyticsRoute(hash: string): string {
  const candidate = hash.replace(/^#/, "").split(/[?#]/u, 1)[0] || "/";
  const normalized = candidate.startsWith("/") ? candidate : `/${candidate}`;
  return SAFE_ROUTES.has(normalized) ? normalized : "/other";
}

function getSafeCampaignQuery(search: string): string {
  const source = new URLSearchParams(search);
  const safe = new URLSearchParams();

  for (const name of ALLOWED_CAMPAIGN_PARAMETERS) {
    const value = source.get(name)?.trim();
    if (value) safe.set(name, value.slice(0, 120));
  }

  const query = safe.toString();
  return query ? `?${query}` : "";
}

export function getSafeAnalyticsUrl(location: Pick<Location, "hash" | "origin" | "search">): string {
  return `${location.origin}${getSafeAnalyticsRoute(location.hash)}${getSafeCampaignQuery(location.search)}`;
}

function appendScript(id: string, source: string, onLoad?: () => void): void {
  if (!source || document.getElementById(id)) return;

  const script = document.createElement("script");
  script.async = true;
  script.id = id;
  script.src = source;
  if (onLoad) script.addEventListener("load", onLoad, { once: true });
  document.head.append(script);
}

export function getApprovedPlausibleScriptUrl(value: string | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    const approvedPath = /^\/js\/pa-[A-Za-z0-9_-]+\.js$/u.test(url.pathname);
    if (
      url.protocol !== "https:"
      || url.hostname !== "plausible.io"
      || url.port
      || url.username
      || url.password
      || url.search
      || url.hash
      || !approvedPath
    ) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

function ensurePlausibleQueue(): PlausibleTag {
  if (window.plausible) return window.plausible;

  const plausible = ((...args: AnalyticsArguments) => {
    plausible.q = plausible.q ?? [];
    plausible.q.push(args);
  }) as PlausibleTag;
  plausible.init = (options = {}) => {
    plausible.o = options;
  };
  window.plausible = plausible;
  return plausible;
}

function loadPlausible(): void {
  const scriptUrl = getApprovedPlausibleScriptUrl(import.meta.env.VITE_PLAUSIBLE_SCRIPT_URL?.trim());
  if (!scriptUrl || !isAnalyticsProductionContext() || isDeviceExcludedFromAnalytics()) return;

  const plausible = ensurePlausibleQueue();
  plausible.init?.({
    autoCapturePageviews: false,
    hashBasedRouting: false,
  });
  appendScript(PLAUSIBLE_SCRIPT_ID, scriptUrl);
}

function ensureGoogleTag(): GoogleTag {
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = window.gtag ?? ((...args: AnalyticsArguments) => {
    window.dataLayer?.push(args);
  });
  return window.gtag;
}

function googleDisableKey(measurementId: string): string {
  return `ga-disable-${measurementId}`;
}

function setGoogleDisabled(measurementId: string, disabled: boolean): void {
  (window as unknown as Record<string, unknown>)[googleDisableKey(measurementId)] = disabled;
}

function loadGoogleAnalytics(): void {
  const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID?.trim();
  if (
    !measurementId
    || !/^G-[A-Z0-9]+$/u.test(measurementId)
    || !isAnalyticsProductionContext()
    || isDeviceExcludedFromAnalytics()
    || readGoogleAnalyticsConsent() !== "granted"
  ) {
    return;
  }

  setGoogleDisabled(measurementId, false);
  const gtag = ensureGoogleTag();
  if (googleTagInitialized) {
    gtag("consent", "update", { analytics_storage: "granted" });
    return;
  }
  googleTagInitialized = true;
  gtag("consent", "default", {
    ad_personalization: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    analytics_storage: "granted",
  });
  gtag("js", new Date());
  gtag("config", measurementId, {
    allow_ad_personalization_signals: false,
    allow_google_signals: false,
    cookie_expires: 5_184_000,
    send_page_view: false,
  });
  appendScript(GA_SCRIPT_ID, `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`);
}

function clearGoogleAnalyticsCookies(measurementId: string): void {
  const cookieNames = ["_ga", `_ga_${measurementId.replace(/^G-/u, "")}`];
  for (const cookieName of cookieNames) {
    document.cookie = `${cookieName}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
    document.cookie = `${cookieName}=; Max-Age=0; Path=/; Domain=.markellosecosystem.com; SameSite=Lax; Secure`;
  }
}

function applyGooglePrivacyChoice(): void {
  const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID?.trim();
  if (!measurementId || !/^G-[A-Z0-9]+$/u.test(measurementId)) return;

  const disabled = isDeviceExcludedFromAnalytics() || readGoogleAnalyticsConsent() !== "granted";
  setGoogleDisabled(measurementId, disabled);
  window.gtag?.("consent", "update", {
    ad_personalization: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    analytics_storage: disabled ? "denied" : "granted",
  });
  if (disabled) clearGoogleAnalyticsCookies(measurementId);
}

function sendSafePageView(): void {
  if (!isAnalyticsProductionContext() || isDeviceExcludedFromAnalytics()) return;

  const safeRoute = getSafeAnalyticsRoute(window.location.hash);
  const safeUrl = getSafeAnalyticsUrl(window.location);
  window.plausible?.("pageview", { url: safeUrl });

  if (readGoogleAnalyticsConsent() === "granted") {
    window.gtag?.("event", "page_view", {
      page_location: safeUrl,
      page_path: safeRoute,
      page_title: `StudyApp ${safeRoute}`,
    });
  }
}

export function startAnalyticsRuntime(): () => void {
  if (!isAnalyticsProductionContext()) return () => undefined;

  let previousConsent = readGoogleAnalyticsConsent();
  let previousDeviceExcluded = isDeviceExcludedFromAnalytics();
  loadPlausible();
  loadGoogleAnalytics();
  sendSafePageView();

  const handleRouteChange = () => sendSafePageView();
  const handlePreferencesChange = () => {
    const nextConsent = readGoogleAnalyticsConsent();
    const nextDeviceExcluded = isDeviceExcludedFromAnalytics();
    applyGooglePrivacyChoice();
    loadPlausible();
    loadGoogleAnalytics();
    const startedMeasuringGoogle = previousConsent !== "granted" && nextConsent === "granted";
    const includedDevice = previousDeviceExcluded && !nextDeviceExcluded;
    if (!nextDeviceExcluded && (startedMeasuringGoogle || includedDevice)) {
      sendSafePageView();
    }
    previousConsent = nextConsent;
    previousDeviceExcluded = nextDeviceExcluded;
  };

  window.addEventListener("hashchange", handleRouteChange);
  window.addEventListener(ANALYTICS_PREFERENCES_EVENT, handlePreferencesChange);
  return () => {
    window.removeEventListener("hashchange", handleRouteChange);
    window.removeEventListener(ANALYTICS_PREFERENCES_EVENT, handlePreferencesChange);
  };
}
