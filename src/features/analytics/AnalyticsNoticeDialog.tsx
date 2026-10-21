import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  dismissAnalyticsNotice,
  isAnalyticsNoticeDismissed,
} from "./analyticsNotice";

export function AnalyticsNoticeDialog() {
  const { text } = useLanguage();
  const [isOpen, setIsOpen] = useState(() => !isAnalyticsNoticeDismissed());

  function closeNotice() {
    dismissAnalyticsNotice();
    setIsOpen(false);
  }

  if (!isOpen) return null;

  return (
    <aside
      aria-describedby="analytics-notice-description"
      aria-labelledby="analytics-notice-title"
      className="analytics-notice-banner"
    >
      <p className="eyebrow">{text("Analytics information", "Πληροφορίες analytics")}</p>
      <h2 id="analytics-notice-title">{text("Cookie-less analytics", "Analytics χωρίς cookies")}</h2>
      <p id="analytics-notice-description">
        {text(
          "This website uses cookie-less aggregate analytics only to help the administrator understand overall traffic.",
          "Η ιστοσελίδα χρησιμοποιεί μόνο συγκεντρωτικά analytics χωρίς cookies, ώστε ο διαχειριστής να κατανοεί τη συνολική επισκεψιμότητα.",
        )}
      </p>
      <p>
        {text(
          "No analytics cookies, visitor identifiers, paths, referrers, device information, download interactions or events are used. Only the UTC hour, domain and country are recorded in aggregate form.",
          "Δεν χρησιμοποιούνται cookies analytics, αναγνωριστικά επισκέπτη, διαδρομές, referrers, στοιχεία συσκευής, αλληλεπιδράσεις λήψης ή events. Καταγράφονται συγκεντρωτικά μόνο η ώρα UTC, το domain και η χώρα.",
        )}
      </p>
      <div className="home-guide-actions">
        <button className="button secondary" onClick={closeNotice} type="button">
          {text("Close", "Κλείσιμο")}
        </button>
      </div>
    </aside>
  );
}
