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
          <p>{text(
            "Start with a guided ChatGPT study session or review the options planned for later.",
            "Ξεκίνησε μια καθοδηγούμενη μελέτη με το ChatGPT ή δες τις επιλογές που σχεδιάζονται για αργότερα.",
          )}</p>
          <div className="button-row">
            <Link className="button secondary" to="/">{text("Back to Home", "Πίσω στην Αρχική")}</Link>
          </div>
        </div>
        <img alt="" src="/study-assistant-avatar.svg" />
      </header>

      <section className="assistant-guide-grid" aria-label={text("AI Assistant options", "Επιλογές Βοηθού AI")}>
        <article className="assistant-guide-card">
          <p className="eyebrow">{text("Available", "Διαθέσιμο")}</p>
          <h3>ChatGPT Companion</h3>
          <p>{text(
            "Follow guided steps to prepare your study instructions and continue in ChatGPT.",
            "Ακολούθησε καθοδηγούμενα βήματα για να ετοιμάσεις τις οδηγίες μελέτης και να συνεχίσεις στο ChatGPT.",
          )}</p>
        </article>

        <article className="assistant-guide-card">
          <p className="eyebrow">{text("Coming soon", "Σύντομα")}</p>
          <h3>ChatGPT App / MCP</h3>
          <p>{text("Use StudyApp inside ChatGPT.", "Χρησιμοποίησε το StudyApp μέσα στο ChatGPT.")}</p>
        </article>

        <article className="assistant-guide-card">
          <p className="eyebrow">{text("Coming soon", "Σύντομα")}</p>
          <h3>StudyApp AI</h3>
          <p>{text("Automatic AI with StudyApp credits. No charges yet.", "Αυτόματο AI με credits του StudyApp. Δεν γίνεται χρέωση ακόμη.")}</p>
        </article>
      </section>

      <section className="content-panel">
        <p className="eyebrow">ChatGPT Companion</p>
        <h3>{text("How it works", "Πώς λειτουργεί")}</h3>
        <ol className="assistant-guide-steps">
          {[
            text("Paste the study text you choose.", "Επικόλλησε το υλικό μελέτης που επιλέγεις."),
            text("Choose what you want ChatGPT to do.", "Επίλεξε τι θέλεις να κάνει το ChatGPT."),
            text("Review and edit the prepared instructions.", "Έλεγξε και επεξεργάσου τις έτοιμες οδηγίες."),
            text("Copy the instructions and continue in ChatGPT.", "Αντέγραψε τις οδηγίες και συνέχισε στο ChatGPT."),
          ].map((step, index) => (
            <li key={step}>
              <span aria-hidden="true">{index + 1}</span>
              <div><strong>{step}</strong></div>
            </li>
          ))}
        </ol>
        <p className="assistant-privacy-note">{text(
          "StudyApp does not automatically read your library. Only text you deliberately paste into the Assistant is used to prepare the instructions.",
          "Το StudyApp δεν διαβάζει αυτόματα τη βιβλιοθήκη σου. Χρησιμοποιείται μόνο το κείμενο που επικολλάς σκόπιμα στον Βοηθό για την προετοιμασία των οδηγιών.",
        )}</p>
      </section>
    </div>
  );
}
