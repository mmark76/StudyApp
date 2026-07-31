import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";

export function AssistantGuidePage() {
  const { text } = useLanguage();

  return (
    <div className="assistant-guide-page stack-lg">
      <header className="assistant-guide-hero">
        <div>
          <p className="eyebrow">{text("AI options", "Επιλογές AI")}</p>
          <h2>{text("AI Assistant", "Βοηθός AI")}</h2>
          <p>
            {text(
              "Open the StudyApp AI Assistant in ChatGPT or review the options planned for later.",
              "Άνοιξε τον Βοηθό AI του StudyApp στο ChatGPT ή δες τις επιλογές που σχεδιάζονται για αργότερα.",
            )}
          </p>
          <div className="button-row">
            <Link className="button secondary" to="/">
              {text("Back to Home", "Πίσω στην Αρχική")}
            </Link>
          </div>
        </div>
        <img alt="" src="/study-assistant-avatar.svg" />
      </header>

      <section
        aria-label={text("AI Assistant options", "Επιλογές Βοηθού AI")}
        className="assistant-guide-grid"
      >
        <article className="assistant-guide-card">
          <p className="eyebrow">{text("Available", "Διαθέσιμο")}</p>
          <h3>ChatGPT Companion</h3>
          <p>
            {text(
              "Open the dedicated StudyApp AI Assistant in ChatGPT. Choose and share any study material directly in ChatGPT.",
              "Άνοιξε τον ειδικό Βοηθό AI του StudyApp στο ChatGPT. Επίλεξε και μοιράσου οποιοδήποτε υλικό μελέτης απευθείας στο ChatGPT.",
            )}
          </p>
        </article>

        <article className="assistant-guide-card">
          <p className="eyebrow">{text("Coming soon", "Σύντομα")}</p>
          <h3>ChatGPT App / MCP</h3>
          <p>
            {text(
              "Use StudyApp inside ChatGPT.",
              "Χρησιμοποίησε το StudyApp μέσα στο ChatGPT.",
            )}
          </p>
        </article>

        <article className="assistant-guide-card">
          <p className="eyebrow">{text("Coming soon", "Σύντομα")}</p>
          <h3>StudyApp AI</h3>
          <p>
            {text(
              "Automatic AI is not active. No charges yet.",
              "Το αυτόματο AI δεν είναι ενεργό. Δεν γίνεται χρέωση ακόμη.",
            )}
          </p>
        </article>
      </section>

      <section className="assistant-guide-note">
        <h3>{text("Your data stays under your control", "Τα δεδομένα σου παραμένουν υπό τον έλεγχό σου")}</h3>
        <p>
          {text(
            "Opening ChatGPT does not make StudyApp read, copy, or send your library or study material. StudyApp does not use the clipboard or access IndexedDB for this handoff.",
            "Το άνοιγμα του ChatGPT δεν επιτρέπει στο StudyApp να διαβάσει, να αντιγράψει ή να στείλει τη βιβλιοθήκη ή το υλικό μελέτης σου. Το StudyApp δεν χρησιμοποιεί το πρόχειρο ούτε προσπελαύνει το IndexedDB για αυτή τη μετάβαση.",
          )}
        </p>
      </section>
    </div>
  );
}
