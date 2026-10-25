import { useId, useState, type FormEvent } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { askChatGptPlan } from "../../infrastructure/local-companion/localCompanionClient";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
};

export function WorkspaceLocalChat() {
  const { text } = useLanguage();
  const inputId = useId();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedQuestion = question.trim();
    if (!submittedQuestion || isSending) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: submittedQuestion,
    };
    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setError("");
    setIsSending(true);

    try {
      const response = await askChatGptPlan(submittedQuestion);
      setMessages((current) => [...current, {
        id: Date.now() + 1,
        role: "assistant",
        content: response.answer,
      }]);
    } catch (requestError) {
      setError(requestError instanceof Error
        ? requestError.message
        : text("ChatGPT could not complete the question.", "Το ChatGPT δεν μπόρεσε να ολοκληρώσει την ερώτηση."));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section
      aria-label={text("ChatGPT conversation", "Συνομιλία ChatGPT")}
      className="workspace-local-chat"
    >
      <header className="workspace-local-chat-status">
        <span className="workspace-local-chat-status-dot" aria-hidden="true" />
        <div>
          <p>{text("Connected", "Συνδεδεμένο")}</p>
          <span>{text(
            "Ask for study help. StudyApp sends only what you type.",
            "Ζήτησε βοήθεια για τη μελέτη. Το StudyApp στέλνει μόνο ό,τι πληκτρολογείς.",
          )}</span>
        </div>
      </header>

      <div className="workspace-local-chat-history" aria-live="polite">
        {messages.length === 0 ? (
          <p className="workspace-local-chat-empty">
            {text(
              "Your local ChatGPT plan is ready. Start a conversation below.",
              "Το τοπικό πλάνο ChatGPT είναι έτοιμο. Ξεκίνα μια συνομιλία παρακάτω.",
            )}
          </p>
        ) : messages.map((message) => (
          <article
            className={`workspace-local-chat-message workspace-local-chat-message--${message.role}`}
            key={message.id}
          >
            <p className="workspace-local-chat-message-role">
              {message.role === "user"
                ? text("You", "Εσύ")
                : "ChatGPT"}
            </p>
            <p>{message.content}</p>
          </article>
        ))}
        {isSending ? (
          <p className="workspace-local-chat-thinking" role="status">
            {text("ChatGPT is responding…", "Το ChatGPT απαντά…")}
          </p>
        ) : null}
      </div>

      <form className="workspace-local-chat-composer" onSubmit={(event) => void submitQuestion(event)}>
        <label htmlFor={inputId}>{text("Message ChatGPT", "Μήνυμα στο ChatGPT")}</label>
        <textarea
          disabled={isSending}
          id={inputId}
          maxLength={12000}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={text("Ask ChatGPT", "Ρώτησε το ChatGPT")}
          value={question}
        />
        <div className="workspace-local-chat-composer-footer">
          <span>{text("Answers are not saved to your study data.", "Οι απαντήσεις δεν αποθηκεύονται στα δεδομένα μελέτης σου.")}</span>
          <button disabled={isSending || !question.trim()} type="submit">
            {isSending ? text("Sending…", "Αποστολή…") : text("Send", "Αποστολή")}
          </button>
        </div>
        {error ? <p className="workspace-local-chat-error" role="alert">{error}</p> : null}
      </form>
    </section>
  );
}
