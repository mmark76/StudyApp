import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { StudyAppLocalWindowsZipLink } from "../../shared/components/StudyAppReleaseZipLinks";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { LocalStudyFile } from "../../shared/types/models";
import { isPdfStudyFile, MAX_LOCAL_FILE_SIZE } from "../study-materials/localStudyFiles";
import { validateLocalStudyFile } from "../study-materials/localFilePolicy";
import {
  askChatGptPlan,
  askChatGptPlanWithPdfPassages,
  getChatGptPlanConnection,
  isStudyAppLocalEdition,
  LocalCompanionError,
  prepareChatGptPlanConnection,
  removeChatGptPlanConnection,
  startChatGptPlanConnection,
  STUDYAPP_LOCAL_PROTOCOL_URL,
  type ChatGptPlanConnectionStatus,
} from "../../infrastructure/local-companion/localCompanionClient";
import { extractPdfChunks, MAX_RAG_SELECTED_PDFS, rankPdfPassages, type PdfPassage } from "./localPdfRag";

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
  const [selectedPdfIds, setSelectedPdfIds] = useState<string[]>([]);
  const [attachedPdfs, setAttachedPdfs] = useState<LocalStudyFile[]>([]);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [pdfQuestion, setPdfQuestion] = useState("");
  const [pdfPassages, setPdfPassages] = useState<PdfPassage[]>([]);
  const [pdfConsent, setPdfConsent] = useState(false);
  const [pdfAnswer, setPdfAnswer] = useState("");
  const pdfFiles = useLiveQuery(
    () => localEdition ? studyDatabase.studyFiles.orderBy("createdAt").toArray() : Promise.resolve<LocalStudyFile[]>([]),
    [localEdition],
    [] as LocalStudyFile[],
  ) ?? [];
  const selectablePdfs = useMemo(
    () => pdfFiles.filter((file) => isPdfStudyFile(file)),
    [pdfFiles],
  );
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
      setPdfQuestion("");
      setAttachedPdfs([]);
      setSelectedPdfIds([]);
      setPdfPassages([]);
      setPdfConsent(false);
      setPdfAnswer("");
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

  function togglePdf(fileId: string) {
    setSelectedPdfIds((current) => current.includes(fileId)
      ? current.filter((id) => id !== fileId)
      : [...current, fileId]);
    setPdfPassages([]);
    setPdfConsent(false);
    setPdfAnswer("");
  }

  async function attachPdfs(files: FileList | null) {
    if (!files?.length) return;
    const remaining = MAX_RAG_SELECTED_PDFS - selectedPdfIds.length - attachedPdfs.length;
    if (files.length > remaining) {
      setMessage(text("You can select up to eight PDFs in total.", "Μπορείς να επιλέξεις έως οκτώ PDF συνολικά."));
      return;
    }
    try {
      const additions: LocalStudyFile[] = [];
      for (const file of Array.from(files)) {
        if (!file.size || file.size > MAX_LOCAL_FILE_SIZE) {
          throw new Error(text("Each PDF must be nonempty and at most 50 MB.", "Κάθε PDF πρέπει να έχει περιεχόμενο και μέγεθος έως 50 MB."));
        }
        const validated = await validateLocalStudyFile(file);
        if (validated.format !== "pdf") {
          throw new Error(text("Only PDF attachments are supported.", "Υποστηρίζονται μόνο συνημμένα PDF."));
        }
        additions.push({
          id: crypto.randomUUID(),
          title: file.name,
          fileName: file.name,
          size: file.size,
          createdAt: new Date().toISOString(),
          data: file,
          mimeType: validated.canonicalMimeType,
          fileKind: "pdf",
        });
      }
      setAttachedPdfs((current) => [...current, ...additions]);
      setPdfPassages([]);
      setPdfConsent(false);
      setPdfAnswer("");
      setMessage(text("PDF attached locally. Nothing has been sent.", "Το PDF επισυνάφθηκε τοπικά. Δεν έχει σταλεί τίποτα."));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : text("PDF attachment failed.", "Η επισύναψη PDF απέτυχε."));
    } finally {
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  }

  async function preparePdfPassages() {
    const questionValue = pdfQuestion.trim();
    if (!questionValue || (!selectedPdfIds.length && !attachedPdfs.length)) {
      setMessage(text("Choose at least one PDF and enter a question.", "Επίλεξε τουλάχιστον ένα PDF και γράψε μια ερώτηση."));
      return;
    }
    setState("working");
    setPdfPassages([]);
    setPdfConsent(false);
    setPdfAnswer("");
    try {
      const selectedFiles = [...selectablePdfs.filter((file) => selectedPdfIds.includes(file.id)), ...attachedPdfs];
      const chunks = await extractPdfChunks(selectedFiles);
      const passages = rankPdfPassages(questionValue, chunks)
        .map((passage, index) => ({ ...passage, sourceId: `S${index + 1}` }));
      setPdfPassages(passages);
      setMessage(passages.length
        ? text("Review the passages below. Nothing has been sent.", "Έλεγξε τα αποσπάσματα παρακάτω. Δεν έχει σταλεί τίποτα.")
        : text("No matching passages were found in the selected PDFs.", "Δεν βρέθηκαν σχετικά αποσπάσματα στα επιλεγμένα PDF."));
      setState("ready");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : text("The selected PDFs could not be read.", "Δεν ήταν δυνατή η ανάγνωση των επιλεγμένων PDF."));
    }
  }

  async function askAboutPdfs() {
    if (!pdfConsent || !pdfQuestion.trim() || !pdfPassages.length) return;
    setState("working");
    setPdfAnswer("");
    setMessage(text("Sending the approved question and passages to ChatGPT…", "Αποστέλλονται στο ChatGPT η εγκεκριμένη ερώτηση και τα αποσπάσματα…"));
    try {
      const response = await askChatGptPlanWithPdfPassages(pdfQuestion.trim(), pdfPassages);
      setPdfAnswer(response.answer);
      setMessage(text("Answer ready. It is shown only in this page until you leave it.", "Η απάντηση εμφανίζεται μόνο σε αυτή τη σελίδα έως ότου φύγεις από αυτήν."));
      setState("ready");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : text("ChatGPT could not answer from the selected passages.", "Το ChatGPT δεν μπόρεσε να απαντήσει από τα επιλεγμένα αποσπάσματα."));
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
          <div className="local-chatgpt-plan-download">
            <StudyAppLocalWindowsZipLink className="local-chatgpt-plan-download-link" compact />
            <span>{text(
              "Windows Local + optional ChatGPT connection",
              "Windows Local + προαιρετική σύνδεση ChatGPT",
            )}</span>
          </div>
          <div className="local-chatgpt-plan-open-local">
            <a className="local-chatgpt-plan-open-local-link" href={STUDYAPP_LOCAL_PROTOCOL_URL}>{text("Open StudyApp Local", "Άνοιγμα StudyApp Local")}</a>
            <span>{text(
              "After one-time launcher setup, this safely restarts and opens your Local app. Your connection stays on this Windows device.",
              "Με μία εγκατάσταση του launcher, επανεκκινεί με ασφάλεια και ανοίγει το Local app. Η σύνδεσή σου παραμένει σε αυτή τη συσκευή Windows.",
            )}</span>
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
              <section className="local-pdf-rag" aria-labelledby="local-pdf-rag-title" id="pdf-rag">
                <h4 id="local-pdf-rag-title">{text("PDF RAG — Available · BETA", "PDF RAG — Διαθέσιμο · BETA")}</h4>
                <p>{text("Choose up to eight PDFs to use. They are read on this device. Nothing is sent until you review and approve the passages.", "Επίλεξε έως οκτώ PDF. Διαβάζονται σε αυτή τη συσκευή. Δεν αποστέλλεται τίποτα πριν ελέγξεις και εγκρίνεις τα αποσπάσματα.")}</p>
                <div className="local-pdf-rag-attach">
                  <input ref={pdfInputRef} accept=".pdf,application/pdf" aria-label={text("Attach PDF files", "Επισύναψη αρχείων PDF")} hidden multiple onChange={(event) => void attachPdfs(event.target.files)} type="file" />
                  <button className="button secondary" disabled={state === "working" || selectedPdfIds.length + attachedPdfs.length >= MAX_RAG_SELECTED_PDFS} onClick={() => pdfInputRef.current?.click()} type="button">
                    {text("+ Attach PDF", "+ Επισύναψη PDF")}
                  </button>
                  <span>{text("Or choose PDFs from your Library below.", "Ή επίλεξε PDF από τη Βιβλιοθήκη παρακάτω.")}</span>
                </div>
                {attachedPdfs.length ? (
                  <fieldset className="local-pdf-rag-files">
                    <legend>{text("Attached PDFs (temporary)", "Συνημμένα PDF (προσωρινά)")}</legend>
                    {attachedPdfs.map((file) => (
                      <div className="local-pdf-rag-attachment" key={file.id}>
                        <span>{file.title}</span>
                        <button className="button secondary" disabled={state === "working"} onClick={() => {
                          setAttachedPdfs((current) => current.filter((item) => item.id !== file.id));
                          setPdfPassages([]);
                          setPdfConsent(false);
                          setPdfAnswer("");
                        }} type="button">{text("Remove", "Αφαίρεση")}</button>
                      </div>
                    ))}
                  </fieldset>
                ) : null}
                {selectablePdfs.length ? (
                  <fieldset className="local-pdf-rag-files">
                    <legend>{text("PDFs in your Library", "PDF στη Βιβλιοθήκη")}</legend>
                    {selectablePdfs.map((file: LocalStudyFile) => (
                      <label key={file.id}>
                        <input checked={selectedPdfIds.includes(file.id)} disabled={state === "working" || (!selectedPdfIds.includes(file.id) && selectedPdfIds.length + attachedPdfs.length >= MAX_RAG_SELECTED_PDFS)} onChange={() => togglePdf(file.id)} type="checkbox" />
                        <span>{file.title}</span>
                      </label>
                    ))}
                  </fieldset>
                ) : <p>{text("No PDFs are available in the Library.", "Δεν υπάρχουν PDF στη Βιβλιοθήκη.")}</p>}
                <label htmlFor="local-pdf-rag-question">{text("Question about these PDFs", "Ερώτηση για αυτά τα PDF")}</label>
                <textarea disabled={state === "working"} id="local-pdf-rag-question" maxLength={12_000} onChange={(event) => { setPdfQuestion(event.target.value); setPdfPassages([]); setPdfConsent(false); setPdfAnswer(""); }} value={pdfQuestion} />
                <button className="button secondary" disabled={state === "working" || (!selectedPdfIds.length && !attachedPdfs.length)} onClick={() => void preparePdfPassages()} type="button">{text("Find passages on this device", "Εύρεση αποσπασμάτων σε αυτή τη συσκευή")}</button>
                {pdfPassages.length ? (
                  <div className="local-pdf-rag-review">
                    <h5>{text("These exact passages will be sent", "Αυτά ακριβώς τα αποσπάσματα θα σταλούν")}</h5>
                    <ol>
                      {pdfPassages.map((passage, index) => (
                        <li key={`${passage.documentId}-${passage.page}-${index}`}>
                          <strong>[{passage.sourceId}] {passage.documentTitle} · {text("page", "σελίδα")} {passage.page}</strong>
                          <p>{passage.text}</p>
                        </li>
                      ))}
                    </ol>
                    <label className="local-pdf-rag-consent">
                      <input checked={pdfConsent} disabled={state === "working"} onChange={(event) => setPdfConsent(event.target.checked)} type="checkbox" />
                      <span>{text("I approve sending the question and the passages shown above to ChatGPT.", "Εγκρίνω την αποστολή της ερώτησης και των παραπάνω αποσπασμάτων στο ChatGPT.")}</span>
                    </label>
                    <button className="button primary" disabled={!pdfConsent || state === "working"} onClick={() => void askAboutPdfs()} type="button">{text("Send approved passages", "Αποστολή εγκεκριμένων αποσπασμάτων")}</button>
                  </div>
                ) : null}
                {pdfAnswer ? <article className="local-chatgpt-plan-answer"><h5>{text("Answer from the selected PDFs", "Απάντηση από τα επιλεγμένα PDF")}</h5><p>{pdfAnswer}</p></article> : null}
              </section>
            </div>
          ) : null}
        </section>
      )}

      {message ? <p className={state === "error" ? "local-chatgpt-plan-message is-error" : "local-chatgpt-plan-message"} role="status">{message}</p> : null}
    </div>
  );
}
