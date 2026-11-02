import { useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useLanguage } from "../../i18n/LanguageContext";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import { askChatGptPlanWithPdfPassages, isStudyAppLocalEdition } from "../../infrastructure/local-companion/localCompanionClient";
import type { LocalStudyFile } from "../../shared/types/models";
import { useStudyContent } from "../content-import/useStudyContent";
import { validateStoredLocalStudyFile } from "../study-materials/localFilePolicy";
import { formatSummary, parseGeneratedSummary, saveSummary, summaryPassagesFromFile, summaryPassagesFromUnit, validateSummaryDraft, type SummaryDraft } from "./summaryService";
import type { PdfPassage } from "../assistant/localPdfRag";
import "./SummaryPage.css";

function locationFor(fileName: string, page: number, english: boolean): string {
  const extension = fileName.toLowerCase().split(".").pop();
  if (extension === "pdf") return english ? `page ${page}` : `σελ. ${page}`;
  if (extension === "pptx") return english ? `slide ${page}` : `διαφάνεια ${page}`;
  return english ? "document text" : "κείμενο εγγράφου";
}

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
  const { importedUnits, hasStoredContentError } = useStudyContent();
  const files = useLiveQuery(() => studyDatabase.studyFiles.orderBy("createdAt").toArray(), []);
  const sourceFiles = (files ?? []).filter((file) => file.generatedSummary !== true);
  const saved = (files ?? []).filter((file) => file.generatedSummary === true).reverse();
  const [sourceKey, setSourceKey] = useState("");
  const [sourceSearch, setSourceSearch] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [points, setPoints] = useState("");
  const [passages, setPassages] = useState<PdfPassage[]>([]);
  const [references, setReferences] = useState<SummaryDraft["sources"]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [savedPage, setSavedPage] = useState(1);
  const busyRef = useRef(false);
  const lastSavedRef = useRef("");
  const localEdition = isStudyAppLocalEdition();
  const totalSavedPages = Math.max(1, Math.ceil(saved.length / 25));
  const currentSavedPage = Math.min(savedPage, totalSavedPages);
  const query = sourceSearch.trim().toLocaleLowerCase();
  const visibleFiles = sourceFiles.filter((file) => !query || file.title.toLocaleLowerCase().includes(query)).slice(0, 100);
  const visibleUnits = importedUnits.filter((unit) => !query || unit.title.toLocaleLowerCase().includes(query)).slice(0, 100);

  function sourceReferences(selected = passages): SummaryDraft["sources"] {
    if (selected.length) return selected.map((passage) => ({
      id: passage.sourceId,
      title: passage.documentTitle,
      location: sourceKey.startsWith("unit:")
        ? text("chapter summary", "σύνοψη κεφαλαίου")
        : locationFor(sourceFiles.find((file) => file.id === passage.documentId)?.fileName ?? "", passage.page, language === "en"),
    }));
    if (references.length) return references;
    if (sourceKey.startsWith("unit:")) {
      const unit = importedUnits.find((item) => item.id === sourceKey.slice(5));
      return unit ? [{ id: "S1", title: unit.title, location: text("chapter summary", "σύνοψη κεφαλαίου") }] : [];
    }
    const file = sourceFiles.find((item) => item.id === sourceKey.slice(5));
    return file ? [{ id: "S1", title: file.title, location: text("selected file", "επιλεγμένο αρχείο") }] : [];
  }

  function draft(): SummaryDraft {
    return { title, summary, mainPoints: points.split(/\r?\n/u), sources: sourceReferences() };
  }

  function changeSource(value: string) {
    if (value !== sourceKey && (summary.trim() || points.trim()) && !window.confirm(text(
      "Changing the source will clear this draft. Continue?",
      "Η αλλαγή πηγής θα αδειάσει αυτό το πρόχειρο. Συνέχεια;",
    ))) return;
    setSourceKey(value);
    setPassages([]);
    setReferences([]);
    setConsent(false);
    setError("");
    setStatus("");
    setTitle("");
    setSummary("");
    setPoints("");
    if (value.startsWith("unit:")) {
      const unit = importedUnits.find((item) => item.id === value.slice(5));
      if (unit) {
        setTitle(unit.title);
        setPoints(unit.summary.join("\n"));
      }
    } else if (value.startsWith("file:")) {
      const file = sourceFiles.find((item) => item.id === value.slice(5));
      if (file) setTitle(file.title);
    }
  }

  async function prepareAi() {
    if (!localEdition || !sourceKey || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setStatus("");
    setConsent(false);
    try {
      const next = sourceKey.startsWith("unit:")
        ? summaryPassagesFromUnit(importedUnits.find((unit) => unit.id === sourceKey.slice(5))!)
        : await summaryPassagesFromFile(sourceFiles.find((file) => file.id === sourceKey.slice(5))!);
      setPassages(next);
      setReferences(sourceReferences(next));
      setStatus(text("Review these excerpts before sending them to ChatGPT.", "Έλεγξε αυτά τα αποσπάσματα πριν σταλούν στο ChatGPT."));
    } catch (cause) {
      setPassages([]);
      setError(language === "en" && cause instanceof Error ? cause.message : text("The source could not be read.", "Δεν ήταν δυνατή η ανάγνωση της πηγής."));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function generateAi() {
    if (!localEdition || !passages.length || !consent || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const response = await askChatGptPlanWithPdfPassages(
        `Using only the selected excerpts, write a concise study summary and 3–8 main points in ${language === "el" ? "Greek" : "English"}. Return only a JSON object with string field "summary" and string array field "mainPoints". Cite each summary paragraph and each main point with its supporting [S1] source marker (include page or slide where applicable). If evidence is insufficient, say so; do not invent facts.`,
        passages,
      );
      const generated = parseGeneratedSummary(response.answer, sourceReferences());
      setSummary(generated.summary);
      setPoints(generated.mainPoints.join("\n"));
      setStatus(text("AI draft ready. Review and save it locally when satisfied.", "Το πρόχειρο AI είναι έτοιμο. Έλεγξέ το και αποθήκευσέ το τοπικά."));
      setPassages([]);
      setConsent(false);
    } catch (cause) {
      setError(language === "en" && cause instanceof Error ? cause.message : text("Summary generation failed. Check the connection and excerpts.", "Η δημιουργία περίληψης απέτυχε. Έλεγξε τη σύνδεση και τα αποσπάσματα."));
    } finally {
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

  return <main className="summary-page stack-lg">
    <header className="page-heading"><p className="eyebrow">{text("PRACTICE & MASTERY", "ΕΞΑΣΚΗΣΗ & ΕΜΠΕΔΩΣΗ")}</p>
      <h2>{text("Summary and Main Points", "Περίληψη και βασικά σημεία")}</h2>
      <p>{text("Create a study summary from your local materials. Review AI drafts before saving.", "Δημιούργησε περίληψη από το τοπικό υλικό σου. Έλεγξε τα πρόχειρα AI πριν τα αποθηκεύσεις.")}</p>
    </header>
    <section className="content-panel stack-md" aria-label={text("Create summary", "Δημιουργία περίληψης")}>
      <label>{text("Find a source", "Εύρεση πηγής")}<input value={sourceSearch} onChange={(event) => setSourceSearch(event.target.value)} /></label>
      <label>{text("Source material", "Πηγή υλικού")}
        <select value={sourceKey} onChange={(event) => changeSource(event.target.value)} disabled={busy}>
          <option value="">{text("Choose a local source", "Επίλεξε τοπική πηγή")}</option>
          <optgroup label={text("Local study files", "Τοπικά αρχεία μελέτης")}>
            {visibleFiles.map((file) => <option value={`file:${file.id}`} key={file.id}>{file.title}</option>)}
          </optgroup>
          <optgroup label={text("Practice chapters", "Κεφάλαια εξάσκησης")}>
            {visibleUnits.map((unit) => <option value={`unit:${unit.id}`} key={unit.id}>{unit.title}</option>)}
          </optgroup>
        </select>
      </label>
      {(sourceFiles.length > 100 || importedUnits.length > 100) ? <p>{text("Showing up to 100 matching files and 100 chapters. Search by title to find more.", "Εμφανίζονται έως 100 αρχεία και 100 κεφάλαια που ταιριάζουν. Αναζήτησε τίτλο για περισσότερα.")}</p> : null}
      {hasStoredContentError ? <p role="alert">{text("Some stored chapter data could not be read.", "Ορισμένα αποθηκευμένα κεφάλαια δεν διαβάστηκαν.")}</p> : null}
      {localEdition ? <div className="stack-md">
        <p>{text("AI draft generation requires Sign in with ChatGPT in AI Studio.", "Για πρόχειρο AI απαιτείται σύνδεση με ChatGPT στο AI Studio.")}</p>
        <button className="button secondary" type="button" disabled={!sourceKey || busy} onClick={() => void prepareAi()}>{text("Review excerpts for AI", "Έλεγχος αποσπασμάτων για AI")}</button>
        {passages.length ? <section className="summary-excerpts" aria-label={text("Excerpts for review", "Αποσπάσματα προς έλεγχο")}>
          <p>{text("Only these excerpts will be sent. Long sources may not be fully represented.", "Θα σταλούν μόνο αυτά τα αποσπάσματα. Οι μεγάλες πηγές ίσως δεν καλύπτονται πλήρως.")}</p>
          {passages.map((passage) => <details key={passage.sourceId}><summary>[{passage.sourceId}] {passage.documentTitle}, {sourceKey.startsWith("unit:") ? text("chapter summary", "σύνοψη κεφαλαίου") : locationFor(sourceFiles.find((file) => file.id === passage.documentId)?.fileName ?? "", passage.page, language === "en")}</summary><p>{passage.text}</p></details>)}
          <label className="summary-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />{text("I approve sending these excerpts to ChatGPT to create a draft.", "Εγκρίνω να σταλούν αυτά τα αποσπάσματα στο ChatGPT για δημιουργία προχείρου.")}</label>
          <button className="button primary" disabled={!consent || busy} onClick={() => void generateAi()} type="button">{busy ? text("Generating…", "Δημιουργία…") : text("Generate AI draft", "Δημιουργία προχείρου AI")}</button>
        </section> : null}
      </div> : <p>{text("AI generation is available in StudyApp Local after Sign in with ChatGPT. You can write and save a summary here.", "Η δημιουργία AI είναι διαθέσιμη στο StudyApp Local μετά τη σύνδεση με ChatGPT. Μπορείς να γράψεις και να αποθηκεύσεις περίληψη εδώ.")}</p>}
      <label>{text("Title", "Τίτλος")}<input value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} /></label>
      <label>{text("Summary", "Περίληψη")}<textarea value={summary} maxLength={20_000} rows={7} onChange={(event) => setSummary(event.target.value)} /></label>
      <label>{text("Main points (one per line)", "Βασικά σημεία (ένα ανά γραμμή)")}<textarea value={points} rows={7} onChange={(event) => setPoints(event.target.value)} /></label>
      {sourceReferences().length ? <div><strong>{text("Source references", "Παραπομπές πηγής")}</strong><ul>{sourceReferences().map((source) => <li key={source.id}>[{source.id}] {source.title} — {source.location}</li>)}</ul></div> : null}
      <div className="summary-actions"><button className="button primary" type="button" disabled={busy} onClick={() => void save()}>{text("Save locally", "Τοπική αποθήκευση")}</button>
        <button className="button secondary" type="button" disabled={busy} onClick={downloadDraft}>{text("Download draft (.txt)", "Λήψη προχείρου (.txt)")}</button></div>
      {status ? <p role="status">{status}</p> : null}{error ? <p role="alert">{error}</p> : null}
    </section>
    <section className="content-panel stack-md" aria-label={text("Saved summaries", "Αποθηκευμένες περιλήψεις")}><h3>{text("Saved summaries", "Αποθηκευμένες περιλήψεις")}</h3>
      {!saved.length ? <p>{text("No saved summaries yet.", "Δεν υπάρχουν αποθηκευμένες περιλήψεις.")}</p> : saved.slice((currentSavedPage - 1) * 25, currentSavedPage * 25).map((file) =>
        <div className="summary-saved" key={file.id}><span>{file.title}</span><button className="button secondary" aria-label={text(`Download ${file.title}`, `Λήψη ${file.title}`)} type="button" onClick={() => void downloadSaved(file)}>{text("Download", "Λήψη")}</button></div>)}
      {totalSavedPages > 1 ? <nav className="summary-actions" aria-label={text("Saved summary pages", "Σελίδες αποθηκευμένων περιλήψεων")}>
        <button className="button secondary" type="button" disabled={currentSavedPage === 1} onClick={() => setSavedPage(currentSavedPage - 1)}>{text("Previous", "Προηγούμενη")}</button>
        <span aria-current="page">{currentSavedPage} / {totalSavedPages}</span>
        <button className="button secondary" type="button" disabled={currentSavedPage === totalSavedPages} onClick={() => setSavedPage(currentSavedPage + 1)}>{text("Next", "Επόμενη")}</button>
      </nav> : null}
    </section>
  </main>;
}
