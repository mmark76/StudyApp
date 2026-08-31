import { useEffect, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { LegalPage } from "../legal/LegalPage";
import { legalPages } from "../legal/legalPages";
import {
  ANALYTICS_PREFERENCES_EVENT,
  isDeviceExcludedFromAnalytics,
  readGoogleAnalyticsConsent,
  setDeviceExcludedFromAnalytics,
  writeGoogleAnalyticsConsent,
} from "./analyticsPreferences";

export function AnalyticsChoicesPage() {
  const { text } = useLanguage();
  const [googleConsent, setGoogleConsent] = useState(readGoogleAnalyticsConsent);
  const [deviceExcluded, setDeviceExcluded] = useState(isDeviceExcludedFromAnalytics);

  useEffect(() => {
    function syncPreferences() {
      setGoogleConsent(readGoogleAnalyticsConsent());
      setDeviceExcluded(isDeviceExcludedFromAnalytics());
    }

    window.addEventListener(ANALYTICS_PREFERENCES_EVENT, syncPreferences);
    return () => window.removeEventListener(ANALYTICS_PREFERENCES_EVENT, syncPreferences);
  }, []);

  const googleStatus = googleConsent === "granted"
    ? text("Allowed on this device", "Επιτρέπεται σε αυτή τη συσκευή")
    : googleConsent === "denied"
      ? text("Blocked on this device", "Αποκλείεται σε αυτή τη συσκευή")
      : text("No choice saved", "Δεν έχει αποθηκευτεί επιλογή");

  return (
    <>
      <LegalPage content={legalPages.analytics} />
      <section className="content-panel analytics-choices-panel" aria-labelledby="analytics-controls-heading">
        <h3 id="analytics-controls-heading">{text("Your choices on this device", "Οι επιλογές σου σε αυτή τη συσκευή")}</h3>
        <dl className="analytics-status-list">
          <div>
            <dt>Plausible</dt>
            <dd>{deviceExcluded ? text("Excluded", "Εξαιρείται") : text("Cookieless measurement active", "Ενεργή μέτρηση χωρίς cookies")}</dd>
          </div>
          <div>
            <dt>Google Analytics</dt>
            <dd>{deviceExcluded ? text("Excluded", "Εξαιρείται") : googleStatus}</dd>
          </div>
        </dl>
        <div className="button-row">
          <button className="button primary" onClick={() => writeGoogleAnalyticsConsent("granted")} type="button">
            {text("Allow Google Analytics", "Αποδοχή Google Analytics")}
          </button>
          <button className="button secondary" onClick={() => writeGoogleAnalyticsConsent("denied")} type="button">
            {text("Block Google Analytics", "Αποκλεισμός Google Analytics")}
          </button>
          <button
            className="button secondary"
            onClick={() => setDeviceExcludedFromAnalytics(!deviceExcluded)}
            type="button"
          >
            {deviceExcluded
              ? text("Include this device again", "Να μετράται ξανά αυτή η συσκευή")
              : text("Exclude this device from all analytics", "Εξαίρεση αυτής της συσκευής από όλα τα analytics")}
          </button>
        </div>
        <p className="muted" role="status" aria-live="polite">
          {text(
            "Changes apply to future measurements in this browser. They do not erase already aggregated statistics.",
            "Οι αλλαγές εφαρμόζονται στις μελλοντικές μετρήσεις αυτού του browser. Δεν διαγράφουν στατιστικά που έχουν ήδη συγκεντρωθεί.",
          )}
        </p>
      </section>
    </>
  );
}
