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
          <p>{text("Choose the option that suits you.", "Επίλεξε τον τρόπο που σε εξυπηρετεί.")}</p>
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
          <p>{text("Prepare a prompt and open ChatGPT.", "Ετοίμασε ένα prompt και άνοιξε το ChatGPT.")}</p>
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
            text("Choose a task.", "Επίλεξε εργασία."),
            text("Paste your study text.", "Επικόλλησε το υλικό μελέτης."),
            text("Copy the prompt.", "Αντέγραψε το prompt."),
            text("Open ChatGPT.", "Άνοιξε το ChatGPT."),
          ].map((step, index) => (
            <li key={step}>
              <span aria-hidden="true">{index + 1}</span>
              <div><strong>{step}</strong></div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
