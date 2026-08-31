import { useEffect, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  ANALYTICS_PREFERENCES_EVENT,
  isDeviceExcludedFromAnalytics,
  readGoogleAnalyticsConsent,
  writeGoogleAnalyticsConsent,
} from "./analyticsPreferences";
import { isAnalyticsProductionContext, startAnalyticsRuntime } from "./analyticsClient";

export function AnalyticsRuntime() {
  const { text } = useLanguage();
  const [consent, setConsent] = useState(readGoogleAnalyticsConsent);
  const [deviceExcluded, setDeviceExcluded] = useState(isDeviceExcludedFromAnalytics);

  useEffect(() => startAnalyticsRuntime(), []);

  useEffect(() => {
    function syncPreferences() {
      setConsent(readGoogleAnalyticsConsent());
      setDeviceExcluded(isDeviceExcludedFromAnalytics());
    }

    window.addEventListener(ANALYTICS_PREFERENCES_EVENT, syncPreferences);
    return () => window.removeEventListener(ANALYTICS_PREFERENCES_EVENT, syncPreferences);
  }, []);

  if (!isAnalyticsProductionContext() || consent !== "unset" || deviceExcluded) return null;

  return (
    <aside
      aria-label={text("Optional analytics choice", "Επιλογή προαιρετικών αναλυτικών στοιχείων")}
      className="analytics-consent-banner"
    >
      <div>
        <strong>{text("Privacy-friendly traffic measurement", "Μέτρηση επισκεψιμότητας με σεβασμό στο απόρρητο")}</strong>
        <p>
          {text(
            "Cookieless Plausible measures anonymous traffic trends. Google Analytics loads only if you allow it. Neither service receives study content, file names, searches, form entries, downloads or click events.",
            "Το Plausible μετρά ανώνυμες τάσεις επισκεψιμότητας χωρίς cookies. Το Google Analytics φορτώνεται μόνο αν το επιτρέψεις. Καμία υπηρεσία δεν λαμβάνει υλικό μελέτης, ονόματα αρχείων, αναζητήσεις, στοιχεία φορμών, λήψεις ή συμβάντα κλικ.",
          )}
        </p>
        <a className="text-link" href="#/legal/analytics">
          {text("Analytics details and choices", "Λεπτομέρειες και επιλογές analytics")}
        </a>
      </div>
      <div className="analytics-consent-actions">
        <button
          className="button secondary"
          onClick={() => writeGoogleAnalyticsConsent("denied")}
          type="button"
        >
          {text("Plausible only", "Μόνο Plausible")}
        </button>
        <button
          className="button primary"
          onClick={() => writeGoogleAnalyticsConsent("granted")}
          type="button"
        >
          {text("Allow Google Analytics", "Αποδοχή Google Analytics")}
        </button>
      </div>
    </aside>
  );
}
