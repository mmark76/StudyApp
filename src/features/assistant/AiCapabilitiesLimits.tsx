import { useLanguage } from "../../i18n/LanguageContext";
import { DEFAULT_SUMMARY_LIMITS, type PreparedSummaryJob, type SummaryProgress } from "../summary/fullDocumentSummary";

export type AiCapabilityMode = "summary" | "questions" | "pdf-questions";

/** A shared, contextual explanation. Counts are derived only from completed extraction records. */
export function coverageReport(job: PreparedSummaryJob | null, progress: SummaryProgress | null) {
  if (!job) return { verified: false, total: 0, readable: 0, failed: 0, chunks: 0, processed: 0 };
  const total = job.coverage.length;
  const readable = job.coverage.filter((entry) => entry.status === "readable").length;
  const failed = total - readable;
  const processed = progress?.phase === "combine" ? job.chunks.length
    : progress?.phase === "summarize" ? Math.min(progress.completed, job.chunks.length) : 0;
  return { verified: job.complete && total > 0 && readable === total, total, readable, failed,
    chunks: job.chunks.length, processed };
}

export function AiCapabilitiesLimits({ mode, job = null, progress = null }: {
  mode: AiCapabilityMode;
  job?: PreparedSummaryJob | null;
  progress?: SummaryProgress | null;
}) {
  const { text } = useLanguage();
  const report = coverageReport(job, progress);
  const summary = mode === "summary";
  return <section aria-label={text("AI capabilities and limits", "Δυνατότητες και όρια AI")} className="ai-capabilities-limits">
    <details>
      <summary>{text("AI capabilities & limits", "Δυνατότητες & όρια AI")}</summary>
      <p>{summary
        ? text("StudyApp reads selected documents on this device, then can create a summary and main points from every readable part.", "Το StudyApp διαβάζει τα επιλεγμένα έγγραφα σε αυτή τη συσκευή και μπορεί να δημιουργήσει περίληψη και βασικά σημεία από κάθε αναγνώσιμο μέρος.")
        : text("AI Studio answers questions using the question and selected excerpts. Its file search does not process every page for a complete summary.", "Το AI Studio απαντά σε ερωτήσεις με την ερώτηση και επιλεγμένα αποσπάσματα. Η αναζήτηση αρχείων δεν επεξεργάζεται κάθε σελίδα για πλήρη περίληψη.")}</p>
      <p>{summary
        ? text(`StudyApp limits: PDF, DOCX, PPTX, TXT, MD and CSV; ${DEFAULT_SUMMARY_LIMITS.maxFileBytes / 1_000_000} MB per file and ${DEFAULT_SUMMARY_LIMITS.maxJobBytes / 1_000_000} MB per job. Files are checked before processing. Scanned images and embedded images are not read.`, `Όρια StudyApp: PDF, DOCX, PPTX, TXT, MD και CSV· ${DEFAULT_SUMMARY_LIMITS.maxFileBytes / 1_000_000} MB ανά αρχείο και ${DEFAULT_SUMMARY_LIMITS.maxJobBytes / 1_000_000} MB ανά εργασία. Τα αρχεία ελέγχονται πριν από την επεξεργασία. Σαρωμένες ή ενσωματωμένες εικόνες δεν διαβάζονται.`)
        : mode === "pdf-questions" ? text("StudyApp limits here: up to 8 PDFs, 50 MB each. Only selected excerpts are sent.", "Όρια StudyApp εδώ: έως 8 PDF, 50 MB το καθένα. Αποστέλλονται μόνο επιλεγμένα αποσπάσματα.")
          : text("StudyApp limits for questions: up to 8 files, 50 MB per file; TXT, MD and CSV up to 2 MB. Supported formats: PDF, DOCX, PPTX, TXT, MD and CSV. Only selected excerpts are sent.", "Όρια StudyApp για ερωτήσεις: έως 8 αρχεία, 50 MB ανά αρχείο· TXT, MD και CSV έως 2 MB. Μορφές: PDF, DOCX, PPTX, TXT, MD και CSV. Αποστέλλονται μόνο επιλεγμένα αποσπάσματα.")}</p>
      <p>{text("OpenAI limits depend on your account and selected model. The model's context window and current usage availability can stop a request. StudyApp cannot see your remaining usage quota.", "Τα όρια OpenAI εξαρτώνται από τον λογαριασμό και το επιλεγμένο μοντέλο. Το όριο κειμένου του μοντέλου και η διαθέσιμη χρήση μπορεί να σταματήσουν ένα αίτημα. Το StudyApp δεν βλέπει πόση χρήση απομένει.")}</p>
      <p>{summary
        ? text("After you approve, all extracted text is sent to OpenAI in multiple requests. Earlier summaries are sent again to combine the final result. Check page coverage before approving.", "Μετά την έγκρισή σου, όλο το εξαγόμενο κείμενο αποστέλλεται στην OpenAI με πολλά αιτήματα. Οι ενδιάμεσες περιλήψεις αποστέλλονται ξανά για τη σύνθεση του τελικού αποτελέσματος. Έλεγξε την κάλυψη σελίδων πριν εγκρίνεις.")
        : text("Review the exact excerpts and explicitly approve sending your question and those excerpts to OpenAI. The original files remain on this device.", "Έλεγξε τα ακριβή αποσπάσματα και ενέκρινε ρητά την αποστολή της ερώτησης και αυτών των αποσπασμάτων στην OpenAI. Τα αρχικά αρχεία παραμένουν στη συσκευή.")}</p>
    </details>
    {summary && job ? <p role="status">{text("Document coverage", "Κάλυψη εγγράφων")}: {report.readable}/{report.total} {text("readable pages or sections", "αναγνώσιμες σελίδες ή ενότητες")}; {report.chunks} {text("chunks extracted", "τμήματα εξήχθησαν")}; {report.processed}/{report.chunks} {text("chunks processed", "τμήματα επεξεργάστηκαν")}. {report.verified && report.processed === report.chunks
      ? text("Complete readable coverage verified.", "Επαληθεύτηκε πλήρης κάλυψη αναγνώσιμου κειμένου.")
      : report.failed ? text(`${report.failed} unreadable or failed pages or sections. Generation is blocked.`, `${report.failed} μη αναγνώσιμες σελίδες ή ενότητες ή αποτυχίες. Η δημιουργία έχει αποκλειστεί.`)
        : text("Processing is incomplete or has not started.", "Η επεξεργασία δεν έχει ολοκληρωθεί ή δεν έχει αρχίσει.")}</p> : null}
  </section>;
}
