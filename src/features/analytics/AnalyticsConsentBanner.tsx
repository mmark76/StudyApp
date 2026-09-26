import { useEffect, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  analyticsConsentChangeEvent,
  enableGoogleAnalytics,
  isTopLevelAnalyticsContext,
  readAnalyticsConsent,
  setAnalyticsConsent,
  type AnalyticsConsent,
} from "./analyticsConsent";

export function AnalyticsConsentBanner() {
  const { text } = useLanguage();
  const [consent, setConsent] = useState<AnalyticsConsent | null>(
    readAnalyticsConsent,
  );
  const isTopLevel = isTopLevelAnalyticsContext();

  useEffect(() => {
    if (!isTopLevel) return undefined;
    if (consent === "granted") enableGoogleAnalytics();

    function handleChange(event: Event) {
      setConsent((event as CustomEvent<AnalyticsConsent>).detail);
    }

    window.addEventListener(analyticsConsentChangeEvent, handleChange);
    return () =>
      window.removeEventListener(analyticsConsentChangeEvent, handleChange);
  }, [consent, isTopLevel]);

  if (!isTopLevel || consent !== null) return null;

  return (
    <aside className="analytics-consent-banner" aria-label={text("Analytics choice", "Επιλογή analytics")}>
      <p>
        {text(
          "Optional Google Analytics is off until you allow it. Study content and local files are never sent.",
          "Το προαιρετικό Google Analytics παραμένει κλειστό μέχρι να το επιτρέψεις. Το υλικό μελέτης και τα τοπικά αρχεία δεν αποστέλλονται.",
        )}
      </p>
      <div className="analytics-consent-actions">
        <button className="button primary" type="button" onClick={() => setAnalyticsConsent("granted")}>
          {text("Allow analytics", "Να επιτρέπονται")}
        </button>
        <button className="button secondary" type="button" onClick={() => setAnalyticsConsent("denied")}>
          {text("No thanks", "Όχι, ευχαριστώ")}
        </button>
        <a href="#/legal/analytics">
          {text("Analytics choices", "Επιλογές analytics")}
        </a>
      </div>
    </aside>
  );
}
