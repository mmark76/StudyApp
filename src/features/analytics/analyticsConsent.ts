const ANALYTICS_SCRIPT_ID = "studyapp-cookieless-analytics";
const ANALYTICS_SCRIPT_URL = "https://analytics.markellosecosystem.com/v1/script.js";
const PRODUCTION_HOSTNAME = "studyapp.markellosecosystem.com";

export function initializeAnalytics(): boolean {
  if (
    typeof window === "undefined"
    || window.location.protocol !== "https:"
    || window.location.hostname.toLowerCase() !== PRODUCTION_HOSTNAME
    || document.getElementById(ANALYTICS_SCRIPT_ID)
  ) {
    return false;
  }

  const script = document.createElement("script");
  script.id = ANALYTICS_SCRIPT_ID;
  script.async = true;
  script.src = ANALYTICS_SCRIPT_URL;
  document.head.append(script);
  return true;
}
