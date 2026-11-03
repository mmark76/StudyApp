import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { askChatGptPlan, askChatGptPlanWithPdfPassages, getChatGptPlanModels, LocalCompanionError, type ChatGptPlanModel } from "../../infrastructure/local-companion/localCompanionClient";
import { validateLocalStudyFile } from "../study-materials/localFilePolicy";
import { MAX_LOCAL_FILE_SIZE } from "../study-materials/localStudyFiles";
import {
  extractPdfChunks, MAX_RAG_SELECTED_PDFS, rankPdfPassages,
  splitPageIntoChunks, tokenizeStudyText,
  type PdfChunk, type PdfPassage,
} from "../assistant/localPdfRag";
import type { LocalStudyFile } from "../../shared/types/models";
import { extractOfficeTextParts } from "./officeTextExtraction";
import { AiCapabilitiesLimits } from "../assistant/AiCapabilitiesLimits";

type AttachmentFormat = "pdf" | "docx" | "pptx" | "txt" | "markdown" | "csv";
type ChatAttachment = LocalStudyFile & { format: AttachmentFormat };
type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
  sources?: { title: string; page: number }[];
};
type PendingContext = { question: string; passages: PdfPassage[] };

function sourceLocation(title: string, page: number, english: boolean): string {
  const extension = title.toLowerCase().split(".").pop();
  if (extension === "pptx") return english ? `slide ${page}` : `διαφάνεια ${page}`;
  if (extension === "docx") return english ? "document text" : "κείμενο εγγράφου";
  if (extension === "pdf") return english ? `page ${page}` : `σελ. ${page}`;
  return english ? "text" : "κείμενο";
}

const ALLOWED_FORMATS = new Set<AttachmentFormat>(["pdf", "docx", "pptx", "txt", "markdown", "csv"]);
const MAX_TEXT_BYTES = 2 * 1024 * 1024;

/** Files remain on the user's device. Only approved text passages leave this component. */
export function WorkspaceLocalChat() {
  const { text } = useLanguage();
  const inputId = useId();
  const attachmentId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [pendingContext, setPendingContext] = useState<PendingContext | null>(null);
  const [consent, setConsent] = useState(false);
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

  useEffect(() => {
    if (pendingContext) reviewRef.current?.focus();
  }, [pendingContext]);

  function invalidatePreview() {
    setPendingContext(null);
    setConsent(false);
  }

  async function attachFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    invalidatePreview();
    setError("");
    if (attachments.length + files.length > MAX_RAG_SELECTED_PDFS) {
      setError(text("Select at most eight files.", "Επίλεξε έως οκτώ αρχεία."));
      return;
    }
    try {
      const additions: ChatAttachment[] = [];
      for (const file of files) {
        if (!file.size || file.size > MAX_LOCAL_FILE_SIZE) {
          throw new Error(text("Files must be nonempty and at most 50 MB.", "Τα αρχεία πρέπει να έχουν περιεχόμενο και μέγεθος έως 50 MB."));
        }
        const validated = await validateLocalStudyFile(file);
        if (!ALLOWED_FORMATS.has(validated.format as AttachmentFormat)) {
          throw new Error(text("Supported attachments: PDF, DOCX, PPTX, TXT, Markdown and CSV.", "Υποστηρίζονται PDF, DOCX, PPTX, TXT, Markdown και CSV."));
        }
        const format = validated.format as AttachmentFormat;
        if (!(["pdf", "docx", "pptx"] as string[]).includes(format) && file.size > MAX_TEXT_BYTES) {
          throw new Error(text("Text files must be at most 2 MB.", "Τα αρχεία κειμένου πρέπει να είναι έως 2 MB."));
        }
        additions.push({
          id: crypto.randomUUID(),
          title: file.name,
          fileName: file.name,
          size: file.size,
          createdAt: new Date().toISOString(),
          data: file,
          mimeType: validated.canonicalMimeType,
          fileKind: validated.fileKind,
          format,
        });
      }
      setAttachments((current) => [...current, ...additions]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : text("Could not attach these files.", "Δεν ήταν δυνατή η επισύναψη."));
    }
  }

  async function selectPassages(query: string): Promise<PdfPassage[]> {
    const chunks: PdfChunk[] = [];
    for (const file of attachments) {
      if (file.format === "pdf") {
        const pdfChunks = await extractPdfChunks([file]);
        for (const chunk of pdfChunks) chunks.push({ ...chunk, sourceId: `S${chunks.length + 1}` });
      } else {
        const parts = file.format === "docx" || file.format === "pptx"
          ? await extractOfficeTextParts(file.data, file.format)
          : [{ part: 1, text: await file.data.text() }];
        for (const part of parts) {
          for (const passage of splitPageIntoChunks(part.text)) {
            chunks.push({
              sourceId: `S${chunks.length + 1}`,
              documentId: file.id,
              documentTitle: file.title,
              page: part.part,
              text: passage,
              terms: tokenizeStudyText(passage),
            });
          }
        }
      }
    }
    return rankPdfPassages(query, chunks).map((passage, index) => ({
      ...passage, sourceId: `S${index + 1}`,
    }));
  }

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitted = question.trim();
    if (!submitted || isSending || !selectedModel || modelsLoading) return;
    if (pendingContext) {
      if (consent) await sendApprovedPassages();
      return;
    }
    setError("");
    invalidatePreview();
    if (attachments.length) {
      setIsSending(true);
      try {
        const passages = await selectPassages(submitted);
        if (!passages.length) {
          setError(text("No relevant passages were found. Refine your question or remove the files.", "Δεν βρέθηκαν σχετικά αποσπάσματα. Άλλαξε την ερώτηση ή αφαίρεσε τα αρχεία."));
        } else {
          setPendingContext({ question: submitted, passages });
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : text("The attached files could not be read.", "Δεν ήταν δυνατή η ανάγνωση των αρχείων."));
      } finally {
        setIsSending(false);
      }
      return;
    }
    const id = Date.now();
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

  async function sendApprovedPassages() {
    if (!pendingContext || !consent || isSending) return;
    const { question: approvedQuestion, passages } = pendingContext;
    const id = Date.now();
    setError("");
    setIsSending(true);
    try {
      const response = await askChatGptPlanWithPdfPassages(approvedQuestion, passages, selectedModel);
      setMessages((current) => [...current, { id, role: "user", content: approvedQuestion }, {
        id: id + 1,
        role: "assistant",
        content: response.answer,
        sources: passages.map(({ documentTitle, page }) => ({ title: documentTitle, page })),
      }]);
      setPendingContext(null);
      setConsent(false);
      setQuestion("");
    } catch (cause) {
      setConsent(false);
      if (cause instanceof LocalCompanionError && cause.code === "model_unavailable") {
        setModelRefresh((current) => current + 1);
        setError(text("Selected model is no longer available. Choose a model and approve the excerpts again.", "Το επιλεγμένο μοντέλο δεν είναι πλέον διαθέσιμο. Επίλεξε μοντέλο και ενέκρινε ξανά τα αποσπάσματα."));
      } else {
        setError(cause instanceof Error ? cause.message : text("ChatGPT could not answer from the selected excerpts.", "Το ChatGPT δεν μπόρεσε να απαντήσει από τα επιλεγμένα αποσπάσματα."));
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
          <span>{text("Only your question and expressly approved excerpts are sent.", "Αποστέλλονται μόνο η ερώτησή σου και τα αποσπάσματα που εγκρίνεις ρητά.")}</span>
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
      <div className="workspace-local-chat-history" aria-live="polite">
        {messages.length === 0 ? (
          <p className="workspace-local-chat-empty">{text("Ask ChatGPT or add study files with +.", "Ρώτησε το ChatGPT ή πρόσθεσε αρχεία με το +.")}</p>
        ) : messages.map((message) => (
          <article className={`workspace-local-chat-message workspace-local-chat-message--${message.role}`} key={message.id}>
            <p className="workspace-local-chat-message-role">{message.role === "user" ? text("You", "Εσύ") : "ChatGPT"}</p>
            <p>{message.content}</p>
            {message.sources?.length ? (
              <details className="workspace-local-chat-sources">
                <summary>{text("Source excerpts used", "Αποσπάσματα πηγών που χρησιμοποιήθηκαν")}</summary>
                <ul>{message.sources.map((source, index) => <li key={index}>{source.title} — {text(sourceLocation(source.title, source.page, true), sourceLocation(source.title, source.page, false))}</li>)}</ul>
              </details>
            ) : null}
          </article>
        ))}
        {isSending ? <p className="workspace-local-chat-thinking" role="status">{text("Processing…", "Επεξεργασία…")}</p> : null}
      </div>
      <form className="workspace-local-chat-composer" onSubmit={(event) => void submitQuestion(event)}>
        <div className="workspace-local-chat-input-bar">
          <div className="workspace-local-chat-upload">
            <input accept=".pdf,.docx,.pptx,.txt,.md,.csv" aria-label={text("Choose study files", "Επιλογή αρχείων μελέτης")} id={attachmentId} multiple onChange={(event) => void attachFiles(event)} ref={fileInputRef} type="file" />
            <button aria-label={text("Attach study files", "Προσθήκη αρχείων μελέτης")} disabled={isSending || attachments.length >= MAX_RAG_SELECTED_PDFS} onClick={() => fileInputRef.current?.click()} title={text("Add PDF, Office or text files", "Προσθήκη PDF, Office ή αρχείων κειμένου")} type="button">+</button>
          </div>
          <label className="workspace-local-chat-input-label" htmlFor={inputId}>{text("Message ChatGPT", "Μήνυμα στο ChatGPT")}</label>
          <textarea disabled={isSending} id={inputId} maxLength={12000} onChange={(event) => { setQuestion(event.target.value); invalidatePreview(); }} placeholder={text("Ask ChatGPT", "Ρώτησε το ChatGPT")} rows={1} value={question} />
          <button className="workspace-local-chat-send" disabled={isSending || modelsLoading || !selectedModel || !question.trim() || Boolean(pendingContext && !consent)} type="submit">{text("Send", "Αποστολή")}</button>
        </div>
        {attachments.length ? (
          <div aria-label={text("Attached study files", "Συνημμένα αρχεία μελέτης")} className="workspace-local-chat-attachments">
            {attachments.map((file) => (
              <span className="workspace-local-chat-attachment" key={file.id}>
                {file.title}
                <button aria-label={text(`Remove ${file.title}`, `Αφαίρεση ${file.title}`)} disabled={isSending} onClick={() => { setAttachments((current) => current.filter((item) => item.id !== file.id)); invalidatePreview(); }} type="button">×</button>
              </span>
            ))}
          </div>
        ) : null}
        {pendingContext ? (
          <div className="workspace-local-chat-review" ref={reviewRef} tabIndex={-1}>
            <strong>{text("Review excerpts before sending", "Έλεγχος αποσπασμάτων πριν από την αποστολή")}</strong>
            <p>{text("Review the locally selected excerpts. Approve them below, then press Send to share only those excerpts.", "Έλεγξε τα αποσπάσματα που επιλέχθηκαν τοπικά. Ενέκρινε την αποστολή τους παρακάτω και πάτησε Αποστολή για να σταλούν μόνο αυτά.")}</p>
            <div className="workspace-local-chat-review-excerpts">
              {pendingContext.passages.map((passage) => (
                <details key={passage.sourceId}>
                  <summary>{passage.sourceId}: {passage.documentTitle}, {text(sourceLocation(passage.documentTitle, passage.page, true), sourceLocation(passage.documentTitle, passage.page, false))}</summary>
                  <p>{passage.text}</p>
                </details>
              ))}
            </div>
            <label className="workspace-local-chat-consent">
              <input checked={consent} onChange={(event) => setConsent(event.target.checked)} type="checkbox" />
              {text("I approve sending my question and the displayed excerpts to ChatGPT.", "Εγκρίνω την αποστολή της ερώτησης και των εμφανιζόμενων αποσπασμάτων στο ChatGPT.")}
            </label>
            <div className="workspace-local-chat-review-actions">
              <button disabled={isSending} onClick={invalidatePreview} type="button">{text("Cancel", "Ακύρωση")}</button>
            </div>
          </div>
        ) : null}
        {error ? <p className="workspace-local-chat-error" role="alert">{error}</p> : null}
      </form>
    </section>
  );
}
