import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  analyticsConsentChangeEvent,
  enableGoogleAnalytics,
  readAnalyticsConsent,
  setAnalyticsConsent,
  type AnalyticsConsent,
} from "./analyticsConsent";

export function AnalyticsConsentBanner() {
  const { text } = useLanguage();
  const [consent, setConsent] = useState<AnalyticsConsent | null>(
    readAnalyticsConsent,
  );

  useEffect(() => {
    if (consent === "granted") enableGoogleAnalytics();

    function handleChange(event: Event) {
      setConsent((event as CustomEvent<AnalyticsConsent>).detail);
    }

    window.addEventListener(analyticsConsentChangeEvent, handleChange);
    return () =>
      window.removeEventListener(analyticsConsentChangeEvent, handleChange);
  }, [consent]);

  if (consent !== null) return null;

  return (
    <aside className="analytics-consent-banner" aria-label={text("Analytics choice", "Επιλογή analytics")}>
      <p>
        {text(
          "StudyApp can use Google Analytics only if you allow it. Study content and local files are not sent.",
          "Το StudyApp μπορεί να χρησιμοποιεί Google Analytics μόνο αν το επιτρέψεις. Το υλικό μελέτης και τα τοπικά αρχεία δεν αποστέλλονται.",
        )}
      </p>
      <div className="analytics-consent-actions">
        <button className="button primary" type="button" onClick={() => setAnalyticsConsent("granted")}>
          {text("Allow analytics", "Να επιτρέπονται")}
        </button>
        <button className="button secondary" type="button" onClick={() => setAnalyticsConsent("denied")}>
          {text("No thanks", "Όχι, ευχαριστώ")}
        </button>
        <Link to="/legal/analytics">
          {text("Analytics choices", "Επιλογές analytics")}
        </Link>
      </div>
    </aside>
  );
}
