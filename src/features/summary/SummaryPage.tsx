import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link, useSearchParams } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import { getChatGptPlanModels, isStudyAppLocalEdition, summarizeCompleteDocumentParts, type ChatGptPlanModel } from "../../infrastructure/local-companion/localCompanionClient";
import type { LocalStudyFile } from "../../shared/types/models";
import { useStudyContent } from "../content-import/useStudyContent";
import { validateStoredLocalStudyFile } from "../study-materials/localFilePolicy";
import { AiCapabilitiesLimits } from "../assistant/AiCapabilitiesLimits";
import { formatSummary, saveSummary, validateSummaryDraft, type SummaryDraft } from "./summaryService";
import { DEFAULT_SUMMARY_LIMITS, generateCompleteSummary, prepareCompleteSummary, type PreparedSummaryJob, type SummaryInput, type SummaryProgress } from "./fullDocumentSummary";
import "./SummaryPage.css";

function downloadText(content: string, fileName: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function SummaryPage() {
  const { language, text } = useLanguage();
  const [searchParams] = useSearchParams();
  const workspaceBeta = searchParams.get("workspace") === "beta";
  const { importedUnits, hasStoredContentError } = useStudyContent();
  const files = useLiveQuery(() => studyDatabase.studyFiles.orderBy("createdAt").toArray(), []);
  const sourceFiles = (files ?? []).filter((file) => file.generatedSummary !== true);
  const saved = (files ?? []).filter((file) => file.generatedSummary === true).reverse();
  const [sourceKeys, setSourceKeys] = useState<string[]>([]);
  const [sourceSearch, setSourceSearch] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [points, setPoints] = useState("");
  const [prepared, setPrepared] = useState<PreparedSummaryJob | null>(null);
  const [progress, setProgress] = useState<SummaryProgress | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [models, setModels] = useState<ChatGptPlanModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelError, setModelError] = useState(false);
  const [modelRefresh, setModelRefresh] = useState(0);
  const [savedPage, setSavedPage] = useState(1);
  const busyRef = useRef(false);
  const activeControllerRef = useRef<AbortController | null>(null);
  const lastSavedRef = useRef("");
  const localEdition = isStudyAppLocalEdition();
  useEffect(() => {
    if (!localEdition) return;
    let active = true;
    setModelsLoading(true);
    setModelError(false);
    void getChatGptPlanModels().then((available) => {
      if (!active) return;
      setModels(available);
      setSelectedModel((current) => available.some((item) => item.slug === current) ? current : available[0]?.slug ?? "");
      setModelError(!available.length);
    }).catch(() => {
      if (!active) return;
      setModels([]);
      setSelectedModel("");
      setModelError(true);
    }).finally(() => { if (active) setModelsLoading(false); });
    return () => { active = false; };
  }, [localEdition, modelRefresh]);
  const totalSavedPages = Math.max(1, Math.ceil(saved.length / 25));
  const currentSavedPage = Math.min(savedPage, totalSavedPages);
  const query = sourceSearch.trim().toLocaleLowerCase();
  const visibleFiles = [
    ...sourceFiles.filter((file) => sourceKeys.includes(`file:${file.id}`)),
    ...sourceFiles.filter((file) => !sourceKeys.includes(`file:${file.id}`) && (!query || file.title.toLocaleLowerCase().includes(query))).slice(0, 100),
  ];
  const visibleUnits = [
    ...importedUnits.filter((unit) => sourceKeys.includes(`unit:${unit.id}`)),
    ...importedUnits.filter((unit) => !sourceKeys.includes(`unit:${unit.id}`) && (!query || unit.title.toLocaleLowerCase().includes(query))).slice(0, 100),
  ];
  const coverageGaps = prepared?.coverage.filter((entry) => entry.status !== "readable") ?? [];

  function sourceReferences(): SummaryDraft["sources"] {
    if (prepared) return prepared.sources;
    return sourceKeys.flatMap((key, index) => {
      const source = key.startsWith("unit:")
        ? importedUnits.find((item) => item.id === key.slice(5))
        : sourceFiles.find((item) => item.id === key.slice(5));
      return source ? [{ id: `S${index + 1}`, title: source.title,
        location: key.startsWith("unit:") ? text("chapter summary", "σύνοψη κεφαλαίου") : text("selected file", "επιλεγμένο αρχείο") }] : [];
    });
  }

  function draft(): SummaryDraft {
    return { title, summary, mainPoints: points.split(/\r?\n/u), sources: sourceReferences() };
  }

  function changeSource(values: string[]) {
    if ((summary.trim() || points.trim()) && !window.confirm(text(
      "Changing the sources will clear this draft. Continue?",
      "Η αλλαγή πηγών θα αδειάσει αυτό το πρόχειρο. Συνέχεια;",
    ))) return;
    setSourceKeys(values);
    setPrepared(null);
    setProgress(null);
    setConsent(false);
    setError("");
    setStatus("");
    setTitle("");
    setSummary("");
    setPoints("");
    if (values.length === 1 && values[0].startsWith("unit:")) {
      const unit = importedUnits.find((item) => item.id === values[0].slice(5));
      if (unit) {
        setTitle(unit.title);
        setPoints(unit.summary.join("\n"));
      }
    } else if (values.length === 1 && values[0].startsWith("file:")) {
      const file = sourceFiles.find((item) => item.id === values[0].slice(5));
      if (file) setTitle(file.title);
    } else if (values.length > 1) {
      setTitle(text("Combined study summary", "Συνδυασμένη περίληψη μελέτης"));
    }
  }

  async function prepareAi() {
    if (!localEdition || !sourceKeys.length || busyRef.current) return;
    busyRef.current = true;
    const controller = new AbortController();
    activeControllerRef.current = controller;
    setBusy(true);
    setError("");
    setStatus("");
    setConsent(false);
    try {
      const inputs: SummaryInput[] = sourceKeys.map((key) => {
        if (key.startsWith("unit:")) {
          const unit = importedUnits.find((item) => item.id === key.slice(5));
          if (!unit) throw new Error("A selected chapter is unavailable.");
          return { kind: "unit", unit };
        }
        const file = sourceFiles.find((item) => item.id === key.slice(5));
        if (!file) throw new Error("A selected file is unavailable.");
        return { kind: "file", file };
      });
      const next = await prepareCompleteSummary(inputs, setProgress, DEFAULT_SUMMARY_LIMITS, controller.signal);
      setPrepared(next);
      setStatus(next.complete
        ? text("All readable chunks are ready. Review coverage before approving all requests to ChatGPT.", "Όλα τα αναγνώσιμα τμήματα είναι έτοιμα. Έλεγξε την κάλυψη πριν εγκρίνεις όλα τα αιτήματα προς το ChatGPT.")
        : text("Incomplete coverage: some pages or sections had no readable text or failed extraction. AI generation is blocked.", "Ελλιπής κάλυψη: ορισμένες σελίδες ή ενότητες δεν είχαν αναγνώσιμο κείμενο ή απέτυχαν. Η δημιουργία AI έχει αποκλειστεί."));
    } catch (cause) {
      setPrepared(null);
      if (controller.signal.aborted) setStatus(text("Processing cancelled.", "Η επεξεργασία ακυρώθηκε."));
      else setError(language === "en" && cause instanceof Error ? cause.message : text("The source could not be read.", "Δεν ήταν δυνατή η ανάγνωση της πηγής."));
    } finally {
      activeControllerRef.current = null;
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function generateAi() {
    if (!localEdition || !prepared?.complete || !consent || !selectedModel || modelsLoading || busyRef.current) return;
    busyRef.current = true;
    const controller = new AbortController();
    activeControllerRef.current = controller;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const generated = await generateCompleteSummary(prepared, async (phase, parts) =>
        (await summarizeCompleteDocumentParts(phase, parts, selectedModel, controller.signal)).answer,
      setProgress, DEFAULT_SUMMARY_LIMITS, controller.signal);
      setSummary(generated.summary);
      setPoints(generated.mainPoints.join("\n"));
      setStatus(text("AI draft ready. Review and save it locally when satisfied.", "Το πρόχειρο AI είναι έτοιμο. Έλεγξέ το και αποθήκευσέ το τοπικά."));
      setConsent(false);
    } catch (cause) {
      if (controller.signal.aborted) setStatus(text("Generation cancelled. Earlier sent chunks cannot be recalled; no partial draft was saved.", "Η δημιουργία ακυρώθηκε. Τα τμήματα που είχαν σταλεί δεν ανακαλούνται· δεν αποθηκεύτηκε ελλιπές πρόχειρο."));
      else setError(language === "en" && cause instanceof Error ? cause.message : text("Summary generation stopped. The draft is incomplete and was not saved.", "Η δημιουργία περίληψης σταμάτησε. Το πρόχειρο είναι ελλιπές και δεν αποθηκεύτηκε."));
    } finally {
      activeControllerRef.current = null;
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function save() {
    if (busyRef.current) return;
    const currentDraft = draft();
    const signature = JSON.stringify(currentDraft);
    if (signature === lastSavedRef.current) {
      setStatus(text("This version is already saved.", "Αυτή η έκδοση έχει ήδη αποθηκευτεί."));
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      await saveSummary(currentDraft);
      lastSavedRef.current = signature;
      setStatus(text("Saved locally in Library → Summaries.", "Αποθηκεύτηκε τοπικά στη Βιβλιοθήκη → Περιλήψεις."));
    } catch (cause) {
      setError(language === "en" && cause instanceof Error ? cause.message : text("The summary could not be saved.", "Η περίληψη δεν αποθηκεύτηκε. Έλεγξε τα πεδία και τον διαθέσιμο χώρο."));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  function downloadDraft() {
    try {
      const valid = validateSummaryDraft(draft());
      downloadText(formatSummary(valid), "StudyApp_Summary.txt");
      setError("");
    } catch (cause) {
      setError(language === "en" && cause instanceof Error ? cause.message : text("The summary is incomplete.", "Επίλεξε πηγή και συμπλήρωσε τίτλο, περίληψη και βασικά σημεία."));
    }
  }

  async function downloadSaved(file: LocalStudyFile) {
    try {
      const validated = await validateStoredLocalStudyFile(file);
      if (validated.format !== "txt") throw new Error("Invalid saved summary");
      downloadText(await file.data.text(), file.fileName);
    } catch {
      setError(text("The saved summary could not be downloaded.", "Δεν ήταν δυνατή η λήψη της αποθηκευμένης περίληψης."));
    }
  }

  const savedSummaries = <section className="content-panel stack-md" aria-label={text("Saved summaries", "Αποθηκευμένες περιλήψεις")}><h3>{text("Saved summaries", "Αποθηκευμένες περιλήψεις")}</h3>
    {!saved.length ? <p>{text("No saved summaries yet.", "Δεν υπάρχουν αποθηκευμένες περιλήψεις.")}</p> : saved.slice((currentSavedPage - 1) * 25, currentSavedPage * 25).map((file) =>
      <div className="summary-saved" key={file.id}><span>{file.title}</span><button className="button secondary" aria-label={text(`Download ${file.title}`, `Λήψη ${file.title}`)} type="button" onClick={() => void downloadSaved(file)}>{text("Download", "Λήψη")}</button></div>)}
    {totalSavedPages > 1 ? <nav className="summary-actions" aria-label={text("Saved summary pages", "Σελίδες αποθηκευμένων περιλήψεων")}>
      <button className="button secondary" type="button" disabled={currentSavedPage === 1} onClick={() => setSavedPage(currentSavedPage - 1)}>{text("Previous", "Προηγούμενη")}</button>
      <span aria-current="page">{currentSavedPage} / {totalSavedPages}</span>
      <button className="button secondary" type="button" disabled={currentSavedPage === totalSavedPages} onClick={() => setSavedPage(currentSavedPage + 1)}>{text("Next", "Επόμενη")}</button>
    </nav> : null}
  </section>;

  if (workspaceBeta) return <main className="summary-page summary-page--workspace-results">
    <header className="summary-workspace-results-heading"><h2>{text("Summary of Uploaded Material", "Περίληψη ανεβασμένου υλικού")}</h2></header>
    {!saved.length ? <p className="summary-workspace-empty">{text("No summary created yet.", "Δεν έχει δημιουργηθεί ακόμη περίληψη.")}</p> : savedSummaries}
    <Link className="summary-workspace-modal-action" to="/summary">{text("Open summary setup", "Άνοιγμα ρύθμισης περίληψης")}</Link>
  </main>;

  return <main className="summary-page stack-lg">
    <header className="page-heading"><p className="eyebrow">{workspaceBeta ? text("SOURCES & MATERIALS", "ΠΗΓΕΣ & ΥΛΙΚΟ") : text("PRACTICE & MASTERY", "ΕΞΑΣΚΗΣΗ & ΕΜΠΕΔΩΣΗ")}</p>
      <h2>{workspaceBeta ? text("Summary of Uploaded Material", "Περίληψη ανεβασμένου υλικού") : text("Summary and Main Points", "Περίληψη και βασικά σημεία")}</h2>
      <p>{workspaceBeta ? text("Choose Library files or practice chapters yourself. Nothing is selected automatically.", "Επίλεξε εσύ αρχεία Βιβλιοθήκης ή κεφάλαια εξάσκησης. Δεν επιλέγεται υλικό αυτόματα.") : text("Create a study summary from your local materials. Review AI drafts before saving.", "Δημιούργησε περίληψη από το τοπικό υλικό σου. Έλεγξε τα πρόχειρα AI πριν τα αποθηκεύσεις.")}</p>
    </header>
    <section className="content-panel stack-md" aria-label={text("Create summary", "Δημιουργία περίληψης")}>
      <label>{text("Find a source", "Εύρεση πηγής")}<input value={sourceSearch} onChange={(event) => setSourceSearch(event.target.value)} /></label>
      <label>{text("Source material (select one or more)", "Πηγές υλικού (επίλεξε μία ή περισσότερες)")}
        <select multiple size={6} value={sourceKeys} onChange={(event) => changeSource(Array.from(event.target.selectedOptions, (option) => option.value))} disabled={busy}>
          <optgroup label={text("Local study files", "Τοπικά αρχεία μελέτης")}>
            {visibleFiles.map((file) => <option value={`file:${file.id}`} key={file.id}>{file.title}</option>)}
          </optgroup>
          <optgroup label={text("Practice chapters", "Κεφάλαια εξάσκησης")}>
            {visibleUnits.map((unit) => <option value={`unit:${unit.id}`} key={unit.id}>{unit.title}</option>)}
          </optgroup>
        </select>
      </label>
      <p>{text("Hold Ctrl to select several sources. Selected sources stay visible while you search.", "Κράτησε πατημένο το Ctrl για πολλές πηγές. Οι επιλεγμένες πηγές παραμένουν ορατές κατά την αναζήτηση.")}</p>
      {(sourceFiles.length > 100 || importedUnits.length > 100) ? <p>{text("Showing up to 100 matching files and 100 chapters. Search by title to find more.", "Εμφανίζονται έως 100 αρχεία και 100 κεφάλαια που ταιριάζουν. Αναζήτησε τίτλο για περισσότερα.")}</p> : null}
      {hasStoredContentError ? <p role="alert">{text("Some stored chapter data could not be read.", "Ορισμένα αποθηκευμένα κεφάλαια δεν διαβάστηκαν.")}</p> : null}
      {localEdition ? <div className="stack-md">
        <p>{text("AI draft generation requires Sign in with ChatGPT in AI Studio.", "Για πρόχειρο AI απαιτείται σύνδεση με ChatGPT στο AI Studio.")}</p>
        <AiCapabilitiesLimits mode="summary" job={prepared} progress={progress} />
        <label>{text("Model", "Μοντέλο")}
          <select disabled={busy || modelsLoading || !models.length} value={selectedModel} onChange={(event) => { setSelectedModel(event.target.value); setConsent(false); }}>
            {modelsLoading || !models.length ? <option value="">{modelsLoading ? text("Loading models…", "Φόρτωση μοντέλων…") : text("No models available", "Δεν υπάρχουν μοντέλα")}</option> : null}
            {models.map((model) => <option key={model.slug} value={model.slug}>{model.displayName}</option>)}
          </select>
        </label>
        <button className="button secondary" type="button" disabled={busy || modelsLoading} onClick={() => { setConsent(false); setModelRefresh((current) => current + 1); }}>{text("Refresh models", "Ανανέωση μοντέλων")}</button>
        {modelError ? <p role="alert">{text("Could not load account models. Connect in AI Studio or refresh the list.", "Δεν φορτώθηκαν τα μοντέλα του λογαριασμού. Συνδέσου στο AI Studio ή ανανέωσε τη λίστα.")}</p> : null}
        <p>{text(`Up to ${DEFAULT_SUMMARY_LIMITS.maxFileBytes / 1_000_000} MB per file and ${DEFAULT_SUMMARY_LIMITS.maxJobBytes / 1_000_000} MB per job. All readable content is processed.`, `Έως ${DEFAULT_SUMMARY_LIMITS.maxFileBytes / 1_000_000} MB ανά αρχείο και ${DEFAULT_SUMMARY_LIMITS.maxJobBytes / 1_000_000} MB ανά εργασία. Επεξεργάζεται όλο το αναγνώσιμο περιεχόμενο.`)}</p>
        <button className="button secondary" type="button" disabled={!sourceKeys.length || busy} onClick={() => void prepareAi()}>{text("Check full-document coverage", "Έλεγχος κάλυψης ολόκληρων εγγράφων")}</button>
        {busy && activeControllerRef.current ? <button className="button secondary" type="button" onClick={() => activeControllerRef.current?.abort()}>{text("Cancel processing", "Ακύρωση επεξεργασίας")}</button> : null}
        {prepared ? <section className="summary-excerpts" aria-label={text("Document coverage", "Κάλυψη εγγράφων")}>
          <p>{text(`${prepared.sources.length} sources, ${prepared.coverage.length} pages or sections, ${prepared.chunks.length} extracted chunks. ${prepared.complete ? "Complete readable coverage." : "Incomplete coverage; generation is blocked."}`,
            `${prepared.sources.length} πηγές, ${prepared.coverage.length} σελίδες ή ενότητες, ${prepared.chunks.length} τμήματα κειμένου. ${prepared.complete ? "Πλήρης κάλυψη αναγνώσιμου κειμένου." : "Ελλιπής κάλυψη· η δημιουργία έχει αποκλειστεί."}`)}</p>
          {coverageGaps.slice(0, 100).map((entry, index) => <p role="alert" key={`${entry.sourceId}-${entry.section}-${index}`}>[{entry.sourceId}] {entry.documentTitle}, {entry.section}: {entry.reason}</p>)}
          {coverageGaps.length > 100 ? <p role="alert">{text(`${coverageGaps.length} coverage gaps. Showing the first 100; download the complete report below.`, `${coverageGaps.length} κενά κάλυψης. Εμφανίζονται τα πρώτα 100· κατέβασε την πλήρη αναφορά παρακάτω.`)}</p> : null}
          <details><summary>{text("Pages, sections and chunks", "Σελίδες, ενότητες και τμήματα")}</summary>
            <ol>{prepared.coverage.slice(0, 100).map((entry, index) => <li key={`${entry.sourceId}-${entry.section}-${index}`}>[{entry.sourceId}] {entry.documentTitle}, {entry.section}: {entry.chunks} {text("chunks", "τμήματα")} ({entry.status === "readable" ? text("readable", "αναγνώσιμο") : entry.status === "no-text" ? text("no text", "χωρίς κείμενο") : text("failed", "αποτυχία")})</li>)}</ol>
            {prepared.coverage.length > 100 ? <p>{text(`Showing 100 of ${prepared.coverage.length} entries. Download the complete report below.`, `Εμφανίζονται 100 από ${prepared.coverage.length} εγγραφές. Κατέβασε την πλήρη αναφορά παρακάτω.`)}</p> : null}
          </details>
          <button className="button secondary" type="button" onClick={() => downloadText(JSON.stringify(prepared.coverage, null, 2), "StudyApp_Summary_Coverage.json")}>{text("Download complete coverage report", "Λήψη πλήρους αναφοράς κάλυψης")}</button>
          <label className="summary-consent"><input type="checkbox" checked={consent} disabled={!prepared.complete || busy} onChange={(event) => setConsent(event.target.checked)} />{text("I approve sending all selected document text to ChatGPT across multiple requests to create this draft.", "Εγκρίνω την αποστολή όλου του κειμένου των επιλεγμένων εγγράφων στο ChatGPT με πολλαπλά αιτήματα για αυτό το πρόχειρο.")}</label>
          <button className="button primary" disabled={!consent || !prepared.complete || !selectedModel || modelsLoading || busy} onClick={() => void generateAi()} type="button">{busy ? text("Generating…", "Δημιουργία…") : text("Generate AI draft", "Δημιουργία προχείρου AI")}</button>
        </section> : null}
      </div> : <p>{text("AI generation is available in StudyApp Local after Sign in with ChatGPT. You can write and save a summary here.", "Η δημιουργία AI είναι διαθέσιμη στο StudyApp Local μετά τη σύνδεση με ChatGPT. Μπορείς να γράψεις και να αποθηκεύσεις περίληψη εδώ.")}</p>}
      <label>{text("Title", "Τίτλος")}<input value={title} maxLength={200} disabled={busy} onChange={(event) => setTitle(event.target.value)} /></label>
      <label>{text("Summary", "Περίληψη")}<textarea value={summary} maxLength={20_000} rows={7} disabled={busy} onChange={(event) => setSummary(event.target.value)} /></label>
      <label>{text("Main points (one per line)", "Βασικά σημεία (ένα ανά γραμμή)")}<textarea value={points} rows={7} disabled={busy} onChange={(event) => setPoints(event.target.value)} /></label>
      {sourceReferences().length ? <div><strong>{text("Source references", "Παραπομπές πηγής")}</strong><ul>{sourceReferences().map((source) => <li key={source.id}>[{source.id}] {source.title} — {source.location}</li>)}</ul></div> : null}
      <div className="summary-actions"><button className="button primary" type="button" disabled={busy} onClick={() => void save()}>{text("Save locally", "Τοπική αποθήκευση")}</button>
        <button className="button secondary" type="button" disabled={busy} onClick={downloadDraft}>{text("Download draft (.txt)", "Λήψη προχείρου (.txt)")}</button></div>
      {progress ? <p role="status">{progress.phase === "extract" ? text("Reading", "Ανάγνωση") : progress.phase === "summarize" ? text("Summarizing", "Σύνοψη") : text("Combining", "Σύνθεση")}: {progress.completed} / {progress.total}</p> : null}
      {status ? <p role="status">{status}</p> : null}{error ? <p role="alert">{error}</p> : null}
    </section>
    {savedSummaries}
  </main>;
}
