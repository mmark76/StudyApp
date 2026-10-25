import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { StudyAppLocalWindowsZipLink } from "../../shared/components/StudyAppReleaseZipLinks";
import {
  askChatGptPlan,
  getChatGptPlanConnection,
  isStudyAppLocalEdition,
  LocalCompanionError,
  prepareChatGptPlanConnection,
  removeChatGptPlanConnection,
  startChatGptPlanConnection,
  type ChatGptPlanConnectionStatus,
} from "../../infrastructure/local-companion/localCompanionClient";

type ViewState = "checking" | "ready" | "working" | "error";

const disconnected: ChatGptPlanConnectionStatus = {
  connected: false,
  connectionState: "disconnected",
  planUsageAuthorized: false,
  scope: "current-windows-user",
};

export function LocalChatGptPlanPage() {
  const { text } = useLanguage();
  const localEdition = isStudyAppLocalEdition();
  const [connection, setConnection] = useState<ChatGptPlanConnectionStatus>(disconnected);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [question, setQuestion] = useState("");
  const [setupRequired, setSetupRequired] = useState(false);
  const [awaitingApproval, setAwaitingApproval] = useState(false);
  const [state, setState] = useState<ViewState>(localEdition ? "checking" : "ready");

  const refresh = useCallback(async () => {
    try {
      const status = await getChatGptPlanConnection();
      setConnection(status);
      setSetupRequired(false);
      if (status.connected || status.connectionState === "unreadable") setAwaitingApproval(false);
      setState("ready");
    } catch (error: unknown) {
      setAwaitingApproval(false);
      setState("error");
      setMessage(error instanceof Error ? error.message : "The local connection is unavailable.");
    }
  }, []);

  useEffect(() => {
    if (!localEdition) return;
    void refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [localEdition, refresh]);

  useEffect(() => {
    if (!localEdition || !awaitingApproval) return;
    const timer = window.setInterval(() => void refresh(), 1_500);
    return () => window.clearInterval(timer);
  }, [awaitingApproval, localEdition, refresh]);

  async function connect() {
    setState("working");
    setMessage(text("Finish approval in your browser, then return here.", "Ολοκλήρωσε την έγκριση στον browser και έπειτα επέστρεψε εδώ."));
    try {
      const status = await startChatGptPlanConnection();
      setConnection(status);
      setAwaitingApproval(true);
      setState("ready");
    } catch (error) {
      setState("error");
      setSetupRequired(error instanceof LocalCompanionError && error.setupRequired);
      setMessage(error instanceof Error ? error.message : "The connection could not start.");
    }
  }

  async function prepare() {
    setState("working");
    try {
      await prepareChatGptPlanConnection();
      setSetupRequired(false);
      setMessage(text("A Windows setup window was opened. Complete it, then connect with ChatGPT.", "Άνοιξε παράθυρο ρύθμισης Windows. Ολοκλήρωσέ το και έπειτα συνδέσου με το ChatGPT."));
      setState("ready");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "The local connection setup could not start.");
    }
  }

  async function disconnect() {
    setState("working");
    try {
      const status = await removeChatGptPlanConnection();
      setConnection(status);
      setAwaitingApproval(false);
      setAnswer("");
      setQuestion("");
      setMessage(text("The local ChatGPT connection was removed.", "Η τοπική σύνδεση ChatGPT αφαιρέθηκε."));
      setState("ready");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "The connection could not be removed.");
    }
  }

  async function ask() {
    const value = question.trim();
    if (!value) {
      setMessage(text("Enter a question first.", "Πρόσθεσε πρώτα μια ερώτηση."));
      return;
    }
    setState("working");
    setAnswer("");
    setMessage(text("ChatGPT is responding…", "Το ChatGPT απαντά…"));
    try {
      const response = await askChatGptPlan(value);
      setAnswer(response.answer);
      setMessage(text("Answer ready. It is shown only in this page until you leave it.", "Η απάντηση είναι έτοιμη. Εμφανίζεται μόνο σε αυτή τη σελίδα έως ότου φύγεις από αυτήν."));
      setState("ready");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "ChatGPT could not complete the question.");
    }
  }

  const connected = connection.connected;
  const planReady = connected && connection.planUsageAuthorized;

  return (
    <div className="local-chatgpt-plan-page stack-lg">
      <header className="assistant-guide-hero">
        <div>
          <p className="eyebrow">StudyApp Local</p>
          <h2>{text("Use your ChatGPT plan", "Χρήση του πλάνου ChatGPT")}</h2>
          <p>{text(
            "An optional local connection for StudyApp Local. It uses your eligible ChatGPT subscription or available ChatGPT credits, not an API key or StudyApp credits.",
            "Προαιρετική τοπική σύνδεση για το StudyApp Local. Χρησιμοποιεί το επιλέξιμο ChatGPT subscription ή τα διαθέσιμα ChatGPT credits σου, όχι API key ή credits του StudyApp.",
          )}</p>
          <div className="button-row">
            <Link className="button secondary" to="/ai-assistant-guide">{text("Back to AI Assistant", "Πίσω στον Βοηθό AI")}</Link>
          </div>
        </div>
        <img alt="" src="/study-assistant-avatar.svg" />
      </header>

      {!localEdition ? (
        <section className="assistant-guide-note">
          <h3>{text("Available in StudyApp Local", "Διαθέσιμο στο StudyApp Local")}</h3>
          <p>{text(
            "This web/PWA edition keeps the current private external-link flow. The separate Windows Local package is required before you can connect a ChatGPT account on this device.",
            "Η web/PWA έκδοση διατηρεί την υπάρχουσα ιδιωτική ροή εξωτερικού συνδέσμου. Απαιτείται το ξεχωριστό Windows Local package πριν συνδέσεις λογαριασμό ChatGPT σε αυτή τη συσκευή.",
          )}</p>
          <div className="button-row">
            <StudyAppLocalWindowsZipLink />
          </div>
        </section>
      ) : (
        <section className="local-chatgpt-plan-card">
          <div className="local-chatgpt-plan-heading">
            <div>
              <p className="eyebrow">{planReady
                ? text("Connected", "Συνδεδεμένο")
                : connected
                  ? text("Plan approval needed", "Χρειάζεται έγκριση πλάνου")
                  : text("Not connected", "Δεν έχει συνδεθεί")}</p>
              <h3>ChatGPT</h3>
            </div>
            <span className={planReady ? "local-chatgpt-plan-dot is-connected" : "local-chatgpt-plan-dot"} aria-hidden="true" />
          </div>
          <p>{planReady
            ? text(
              "Your ChatGPT plan is ready for questions. StudyApp sends only the question you submit.",
              "Το πλάνο ChatGPT είναι έτοιμο για ερωτήσεις. Το StudyApp στέλνει μόνο την ερώτηση που υποβάλλεις.",
            )
            : connected
              ? text(
                "ChatGPT is connected, but plan use was not approved. Disconnect and connect again to approve plan use.",
                "Το ChatGPT είναι συνδεδεμένο, αλλά δεν εγκρίθηκε η χρήση του πλάνου. Αποσυνδέσου και συνδέσου ξανά για να εγκρίνεις τη χρήση του πλάνου.",
              )
              : text(
                "Connect opens ChatGPT in your browser for approval. AI questions require an eligible ChatGPT subscription or available ChatGPT credits. StudyApp stores the protected connection only for your current Windows user and never reads or sends library material automatically.",
                "Η Σύνδεση ανοίγει το ChatGPT στον browser για έγκριση. Οι ερωτήσεις AI απαιτούν επιλέξιμο ChatGPT subscription ή διαθέσιμα ChatGPT credits. Το StudyApp αποθηκεύει την προστατευμένη σύνδεση μόνο για τον τρέχοντα χρήστη Windows και δεν διαβάζει ή στέλνει αυτόματα υλικό βιβλιοθήκης.",
              )}</p>
          <div className="button-row">
            {connected ? (
              <button className="button secondary" disabled={state === "working"} onClick={() => void disconnect()} type="button">{text("Disconnect", "Αποσύνδεση")}</button>
            ) : (
              <>
                {setupRequired ? <button className="button secondary" disabled={state === "working"} onClick={() => void prepare()} type="button">{text("Prepare secure connection", "Προετοιμασία ασφαλούς σύνδεσης")}</button> : null}
                <button className="button primary" disabled={state === "working"} onClick={() => void connect()} type="button">{text("Connect with ChatGPT", "Σύνδεση με ChatGPT")}</button>
              </>
            )}
          </div>

          {planReady ? (
            <div className="local-chatgpt-plan-question">
              <label htmlFor="local-chatgpt-plan-question">{text("Your question", "Η ερώτησή σου")}</label>
              <textarea id="local-chatgpt-plan-question" maxLength={12000} onChange={(event) => setQuestion(event.target.value)} placeholder={text("Ask for study help…", "Ζήτησε βοήθεια για τη μελέτη…")} value={question} />
              <button className="button primary" disabled={state === "working"} onClick={() => void ask()} type="button">{text("Ask ChatGPT", "Ρώτησε το ChatGPT")}</button>
              {answer ? <article className="local-chatgpt-plan-answer"><h4>{text("ChatGPT answer", "Απάντηση ChatGPT")}</h4><p>{answer}</p></article> : null}
            </div>
          ) : null}
        </section>
      )}

      {message ? <p className={state === "error" ? "local-chatgpt-plan-message is-error" : "local-chatgpt-plan-message"} role="status">{message}</p> : null}
    </div>
  );
}
