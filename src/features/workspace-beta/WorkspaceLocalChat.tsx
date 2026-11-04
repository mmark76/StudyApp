import { useEffect, useId, useState, type FormEvent } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { askChatGptPlan, getChatGptPlanModels, LocalCompanionError, type ChatGptPlanModel } from "../../infrastructure/local-companion/localCompanionClient";
import { AiCapabilitiesLimits } from "../assistant/AiCapabilitiesLimits";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
};

/** Direct Local ChatGPT conversation. RAG remains deliberately unavailable. */
export function WorkspaceLocalChat() {
  const { text } = useLanguage();
  const inputId = useId();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [models, setModels] = useState<ChatGptPlanModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelError, setModelError] = useState("");
  const [modelRefresh, setModelRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    setModelsLoading(true);
    setModelError("");
    void getChatGptPlanModels().then((available) => {
      if (!active) return;
      setModels(available);
      setSelectedModel((current) => available.some((item) => item.slug === current) ? current : (available[0]?.slug ?? ""));
      if (!available.length) setModelError(text("No models are available for this ChatGPT account.", "Δεν υπάρχουν διαθέσιμα μοντέλα για αυτόν τον λογαριασμό ChatGPT."));
    }).catch(() => {
      if (!active) return;
      setModels([]);
      setSelectedModel("");
      setModelError(text("Could not load models. Try refreshing the list.", "Δεν φορτώθηκαν τα μοντέλα. Δοκίμασε ανανέωση της λίστας."));
    }).finally(() => { if (active) setModelsLoading(false); });
    return () => { active = false; };
  }, [modelRefresh, text]);

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitted = question.trim();
    if (!submitted || isSending || !selectedModel || modelsLoading) return;
    const id = Date.now();
    setError("");
    setIsSending(true);
    try {
      const response = await askChatGptPlan(submitted, selectedModel);
      setMessages((current) => [...current, { id, role: "user", content: submitted }, { id: id + 1, role: "assistant", content: response.answer }]);
      setQuestion("");
    } catch (cause) {
      if (cause instanceof LocalCompanionError && cause.code === "model_unavailable") {
        setModelRefresh((current) => current + 1);
        setError(text("Selected model is no longer available. Choose a model and try again.", "Το επιλεγμένο μοντέλο δεν είναι πλέον διαθέσιμο. Επίλεξε μοντέλο και δοκίμασε ξανά."));
      } else {
        setError(cause instanceof Error ? cause.message : text("ChatGPT could not complete the question.", "Το ChatGPT δεν μπόρεσε να ολοκληρώσει την ερώτηση."));
      }
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section aria-label={text("ChatGPT conversation", "Συνομιλία ChatGPT")} className="workspace-local-chat">
      <header className="workspace-local-chat-status">
        <span className="workspace-local-chat-status-dot" aria-hidden="true" />
        <div>
          <p>{text("Connected", "Συνδεδεμένο")}</p>
          <span>{text("Only the question you submit is sent.", "Αποστέλλεται μόνο η ερώτηση που υποβάλλεις.")}</span>
        </div>
      </header>
      <AiCapabilitiesLimits mode="questions" />
      <div className="workspace-local-chat-models">
        <label htmlFor={`${inputId}-model`}>{text("Model", "Μοντέλο")}</label>
        <select disabled={isSending || modelsLoading || !models.length} id={`${inputId}-model`} onChange={(event) => setSelectedModel(event.target.value)} value={selectedModel}>
          {modelsLoading || !models.length ? <option value="">{modelsLoading ? text("Loading models…", "Φόρτωση μοντέλων…") : text("No models available", "Δεν υπάρχουν μοντέλα")}</option> : null}
          {models.map((model) => <option key={model.slug} value={model.slug}>{model.displayName}</option>)}
        </select>
        <button disabled={isSending || modelsLoading} onClick={() => setModelRefresh((current) => current + 1)} type="button">{text("Refresh models", "Ανανέωση μοντέλων")}</button>
        {modelError ? <p role="alert">{modelError}</p> : null}
      </div>
      <p className="workspace-local-chat-rag-unavailable" role="note">{text("RAG is still under construction and not available.", "Το RAG βρίσκεται ακόμη υπό κατασκευή και δεν είναι διαθέσιμο.")}</p>
      <div className="workspace-local-chat-history" aria-live="polite">
        {messages.length === 0 ? (
          <p className="workspace-local-chat-empty">{text("Ask ChatGPT.", "Ρώτησε το ChatGPT.")}</p>
        ) : messages.map((message) => (
          <article className={`workspace-local-chat-message workspace-local-chat-message--${message.role}`} key={message.id}>
            <p className="workspace-local-chat-message-role">{message.role === "user" ? text("You", "Εσύ") : "ChatGPT"}</p>
            <p>{message.content}</p>
          </article>
        ))}
        {isSending ? <p className="workspace-local-chat-thinking" role="status">{text("Processing…", "Επεξεργασία…")}</p> : null}
      </div>
      <form className="workspace-local-chat-composer" onSubmit={(event) => void submitQuestion(event)}>
        <div className="workspace-local-chat-input-bar">
          <label className="workspace-local-chat-input-label" htmlFor={inputId}>{text("Message ChatGPT", "Μήνυμα στο ChatGPT")}</label>
          <textarea disabled={isSending} id={inputId} maxLength={12000} onChange={(event) => setQuestion(event.target.value)} placeholder={text("Ask ChatGPT", "Ρώτησε το ChatGPT")} rows={1} value={question} />
          <button className="workspace-local-chat-send" disabled={isSending || modelsLoading || !selectedModel || !question.trim()} type="submit">{text("Send", "Αποστολή")}</button>
        </div>
        {error ? <p className="workspace-local-chat-error" role="alert">{error}</p> : null}
      </form>
    </section>
  );
}
