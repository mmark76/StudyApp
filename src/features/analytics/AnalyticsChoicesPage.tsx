import { useEffect, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { LegalPage } from "../legal/LegalPage";
import { legalPages } from "../legal/legalPages";
import {
  analyticsConsentChangeEvent,
  readAnalyticsConsent,
  setAnalyticsConsent,
  type AnalyticsConsent,
} from "./analyticsConsent";

export function AnalyticsChoicesPage() {
  const { text } = useLanguage();
  const [consent, setConsent] = useState<AnalyticsConsent | null>(
    readAnalyticsConsent,
  );

  useEffect(() => {
    function handleChange(event: Event) {
      setConsent((event as CustomEvent<AnalyticsConsent>).detail);
    }

    window.addEventListener(analyticsConsentChangeEvent, handleChange);
    return () =>
      window.removeEventListener(analyticsConsentChangeEvent, handleChange);
  }, []);

  const status =
    consent === "granted"
      ? text("Allowed", "Επιτρέπονται")
      : consent === "denied"
        ? text("Not allowed", "Δεν επιτρέπονται")
        : text("Not chosen yet", "Δεν έχει γίνει επιλογή");

  return (
    <>
      <LegalPage content={legalPages.analytics} />
      <section className="content-panel analytics-choice-panel">
        <h3>{text("Your current choice", "Η τρέχουσα επιλογή σου")}</h3>
        <p><strong>{status}</strong></p>
        <p>
          {text(
            "You can change this choice at any time. Disabling analytics stops future StudyApp analytics events from being sent from this browser.",
            "Μπορείς να αλλάξεις αυτή την επιλογή οποτεδήποτε. Η απενεργοποίηση σταματά την αποστολή μελλοντικών συμβάντων analytics του StudyApp από αυτόν τον browser.",
          )}
        </p>
        <div className="analytics-consent-actions">
          <button className="button primary" type="button" onClick={() => setAnalyticsConsent("granted")}>
            {text("Allow analytics", "Να επιτρέπονται")}
          </button>
          <button className="button secondary" type="button" onClick={() => setAnalyticsConsent("denied")}>
            {text("Disable analytics", "Απενεργοποίηση analytics")}
          </button>
        </div>
      </section>
    </>
  );
}
