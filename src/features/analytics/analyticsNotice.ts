export const ANALYTICS_NOTICE_DISMISSAL_KEY = "studyapp.analyticsNoticeDismissed.v1";

function storage(): Storage | undefined {
  return typeof window === "undefined" ? undefined : window.localStorage;
}

export function isAnalyticsNoticeDismissed(): boolean {
  try {
    return storage()?.getItem(ANALYTICS_NOTICE_DISMISSAL_KEY) === "true";
  } catch {
    return false;
  }
}

export function dismissAnalyticsNotice(): void {
  try {
    storage()?.setItem(ANALYTICS_NOTICE_DISMISSAL_KEY, "true");
  } catch {
    // Storage is optional; the informational notice must remain usable without it.
  }
}
