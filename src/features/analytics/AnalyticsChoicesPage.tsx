import { useLanguage } from "../../i18n/LanguageContext";
import { LegalPage } from "../legal/LegalPage";
import { legalPages } from "../legal/legalPages";

export function AnalyticsChoicesPage() {
  const { text } = useLanguage();

  return (
    <>
      <LegalPage content={legalPages.analytics} />
      <section className="content-panel analytics-choice-panel">
        <h3>{text("Analytics without cookies", "Analytics χωρίς cookies")}</h3>
        <p>
          {text(
            "This information does not store an analytics choice in your browser. It describes the aggregate visit counts used only to help the administrator understand overall traffic.",
            "Η ενημέρωση αυτή δεν αποθηκεύει επιλογή analytics στον browser σου. Περιγράφει τις συγκεντρωτικές μετρήσεις επισκέψεων που χρησιμοποιούνται μόνο για να κατανοεί ο διαχειριστής τη συνολική επισκεψιμότητα.",
          )}
        </p>
      </section>
    </>
  );
}
