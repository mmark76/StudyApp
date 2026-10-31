import { Link } from "react-router-dom";
import { getStudyAppAssistantUrl } from "./assistantDestination";
import { useLanguage } from "../../i18n/LanguageContext";

function isWorkspaceAiFrame(): boolean {
  return typeof window !== "undefined" && window.name === "studyapp-workspace-ai";
}

export function AssistantGuidePage() {
  const { text } = useLanguage();

  if (isWorkspaceAiFrame()) {
    return (
      <div className="assistant-guide-page assistant-guide-page--workspace stack-lg">
        <section className="assistant-guide-workspace-primary">
          <p className="eyebrow">{text("AI options", "Επιλογές AI")}</p>
          <h2>{text("AI Assistant", "Βοηθός AI")}</h2>
          <div className="ai-studio-options">
            <section className="ai-studio-option">
              <div className="ai-studio-option-heading">
                <strong>1. Custom GPT / Plugin</strong>
                <span className="assistant-comparison-status available">{text("Available", "Διαθέσιμο")}</span>
              </div>
              <p>{text("StudyApp AI Assistant in ChatGPT.", "Βοηθός AI του StudyApp στο ChatGPT.")}</p>
              <a className="button secondary" href={getStudyAppAssistantUrl()} rel="noopener noreferrer" target="_blank">
                {text("Open StudyApp AI Assistant", "Άνοιγμα Βοηθού AI")}
              </a>
            </section>
            <section className="ai-studio-option">
              <div className="ai-studio-option-heading">
                <strong>2. ChatGPT App / MCP</strong>
                <span className="assistant-comparison-status soon">{text("Coming Soon", "Σύντομα")}</span>
              </div>
            </section>
            <section className="ai-studio-option">
              <div className="ai-studio-option-heading">
                <strong>3. StudyApp AI / API</strong>
                <span className="assistant-comparison-status soon">{text("Coming Soon", "Σύντομα")}</span>
              </div>
            </section>
            <section className="ai-studio-option">
              <div className="ai-studio-option-heading">
                <strong>4. Sign in with ChatGPT</strong>
                <span className="assistant-comparison-status available">{text("Available", "Διαθέσιμο")}</span>
              </div>
              <p>{text("StudyApp Local (Windows only).", "StudyApp Local (μόνο Windows).")}</p>
              <Link className="button secondary" to="/local-chatgpt-plan">
                {text("Chat with ChatGPT", "Συνομιλία με ChatGPT")}
              </Link>
              <div className="ai-studio-rag-option">
                <span className="assistant-comparison-status available">PDF RAG · BETA</span>
                <Link className="button secondary" to="/local-chatgpt-plan#pdf-rag">
                  {text("Open PDF RAG (BETA)", "Άνοιγμα PDF RAG (BETA)")}
                </Link>
              </div>
            </section>
          </div>
          <Link className="button secondary" to="/ai-assistant-comparison">
            {text("Compare AI options", "Σύγκριση επιλογών AI")}
          </Link>
        </section>
      </div>
    );
  }

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
            <Link className="button secondary" to="/ai-assistant-comparison">
              {text("Compare AI options", "Σύγκριση επιλογών AI")}
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
          <p className="eyebrow">StudyApp Local</p>
          <h3>{text("ChatGPT plan connection", "Σύνδεση με πλάνο ChatGPT")}</h3>
          <p>{text(
            "In the optional local Windows edition, connect your ChatGPT account and use its eligible subscription or available ChatGPT credits without an API key. Study material stays local until you explicitly enter a question.",
            "Στην προαιρετική τοπική έκδοση Windows, σύνδεσε τον λογαριασμό ChatGPT και χρησιμοποίησε το επιλέξιμο subscription ή τα διαθέσιμα ChatGPT credits του χωρίς API key. Το υλικό μελέτης μένει τοπικό μέχρι να γράψεις ρητά μια ερώτηση.",
          )}</p>
          <div className="button-row">
            <Link className="button secondary" to="/local-chatgpt-plan">{text("Open local connection", "Άνοιγμα τοπικής σύνδεσης")}</Link>
          </div>
        </article>

        <article className="assistant-guide-card">
          <p className="eyebrow">{text("Available", "Διαθέσιμο")}</p>
          <h3>{text("StudyApp AI Assistant", "Βοηθός AI του StudyApp")}</h3>
          <p>
            {text(
              "Open the dedicated StudyApp AI Assistant in ChatGPT. Choose and share any study material directly in ChatGPT.",
              "Άνοιξε τον ειδικό Βοηθό AI του StudyApp στο ChatGPT. Επίλεξε και μοιράσου οποιοδήποτε υλικό μελέτης απευθείας στο ChatGPT.",
            )}
          </p>
          <div className="button-row">
            <Link className="button secondary" to="/instructions">
              {text(
                "Step-by-step StudyApp instructions",
                "Οδηγίες StudyApp βήμα προς βήμα",
              )}
            </Link>
          </div>
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
