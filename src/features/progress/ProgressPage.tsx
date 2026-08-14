import { type ChangeEvent, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getStudyModeLabel } from "../../i18n/domainLabels";
import { useLanguage } from "../../i18n/LanguageContext";
import {
  BackupValidationError,
  createBackupPreview,
  exportBackup,
  importBackup,
  MAX_BACKUP_FILE_SIZE,
  parseBackupJson,
  serializeBackup,
  type BackupPreview,
} from "../../infrastructure/backup/backup";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import {
  StorageNotice,
  storageNoticePlacements,
} from "../../shared/components/StorageNotice";
import type { StudyBackup } from "../../shared/types/models";

interface PendingRestore {
  fileName: string;
  backup: StudyBackup;
  preview: BackupPreview;
}

export function ProgressPage() {
  const { language, locale, text } = useLanguage();
  const progress = useLiveQuery(() => studyDatabase.cardProgress.toArray(), []) ?? [];
  const sessions = useLiveQuery(() => studyDatabase.studySessions.orderBy("startedAt").reverse().toArray(), []) ?? [];
  const [message, setMessage] = useState("");
  const [pendingRestore, setPendingRestore] = useState<PendingRestore | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const exportLock = useRef(false);
  const restoreLock = useRef(false);
  const resetLock = useRef(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  function settingLabel(label: string): string {
    if (language === "en") return label;
    const labels: Record<string, string> = {
      Appearance: "Εμφάνιση",
      "Imported chapters": "Εισαγόμενα κεφάλαια",
      "Imported flashcards": "Εισαγόμενες κάρτες",
      "Saved cloud links": "Αποθηκευμένοι σύνδεσμοι",
    };
    return labels[label] ?? label;
  }

  function backupReadError(error: unknown): string {
    if (!(error instanceof BackupValidationError)) {
      return text("The backup could not be read.", "Το backup δεν μπορεί να διαβαστεί.");
    }
    if (language === "en") return error.message;
    if (error.message.includes("larger than") || error.message.includes("too large")) {
      return "Το backup είναι μεγαλύτερο από το όριο των 10 MB.";
    }
    if (error.message.includes("version")) return "Η έκδοση αυτού του backup δεν υποστηρίζεται.";
    if (error.message.includes("valid JSON")) return "Το επιλεγμένο αρχείο δεν είναι έγκυρο backup JSON.";
    return "Το backup είναι κατεστραμμένο, ελλιπές ή ασύμβατο. Δεν άλλαξε τίποτα.";
  }

  async function downloadProgressCopy() {
    if (exportLock.current) return;
    exportLock.current = true;
    setIsExporting(true);
    setMessage("");
    try {
      const serialized = serializeBackup(await exportBackup());
      const url = URL.createObjectURL(new Blob([serialized], { type: "application/json" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `study-progress-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage(text("Backup saved. Files are not included.", "Το backup αποθηκεύτηκε. Τα αρχεία δεν περιλαμβάνονται."));
    } catch {
      setMessage(text(
        "Backup could not be saved because the stored data is invalid or too large. Nothing was changed.",
        "Το backup δεν αποθηκεύτηκε επειδή τα δεδομένα δεν είναι έγκυρα ή είναι πολύ μεγάλα. Δεν άλλαξε τίποτα.",
      ));
    } finally {
      exportLock.current = false;
      setIsExporting(false);
    }
  }

  async function restoreProgress(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPendingRestore(null);
    try {
      if (file.size > MAX_BACKUP_FILE_SIZE) throw new BackupValidationError("The backup file is too large.");
      const backup = parseBackupJson(await file.text(), file.size);
      setPendingRestore({ fileName: file.name, backup, preview: createBackupPreview(backup) });
      setMessage(text("Backup checked. Review it before restoring.", "Το backup ελέγχθηκε. Δες την προεπισκόπηση πριν την επαναφορά."));
    } catch (error) {
      setMessage(backupReadError(error));
    } finally {
      event.target.value = "";
    }
  }

  async function confirmRestore() {
    if (!pendingRestore || restoreLock.current) return;
    if (!window.confirm(text(
      "Replace current progress and settings with this backup?",
      "Να αντικατασταθούν η πρόοδος και οι ρυθμίσεις με αυτό το backup;",
    ))) return;

    restoreLock.current = true;
    setIsRestoring(true);
    try {
      await importBackup(pendingRestore.backup);
      setPendingRestore(null);
      setMessage(text("Progress and settings restored.", "Η πρόοδος και οι ρυθμίσεις επαναφέρθηκαν."));
    } catch {
      setMessage(text("Restore failed. Existing data was not changed.", "Η επαναφορά απέτυχε. Τα υπάρχοντα δεδομένα δεν άλλαξαν."));
    } finally {
      restoreLock.current = false;
      setIsRestoring(false);
    }
  }

  async function resetProgress() {
    if (resetLock.current) return;
    if (!window.confirm(text("Remove all study progress from this device?", "Να διαγραφεί όλη η πρόοδος από αυτή τη συσκευή;"))) return;
    resetLock.current = true;
    setIsResetting(true);
    try {
      await studyDatabase.transaction(
        "rw",
        studyDatabase.cardProgress,
        studyDatabase.studyOperations,
        studyDatabase.studySessions,
        async () => {
          await studyDatabase.cardProgress.clear();
          await studyDatabase.studyOperations.clear();
          await studyDatabase.studySessions.clear();
        },
      );
      setMessage(text("Study progress removed.", "Η πρόοδος διαγράφηκε."));
    } catch {
      setMessage(text(
        "Progress could not be removed. Existing data was not changed.",
        "Η πρόοδος δεν μπόρεσε να διαγραφεί. Τα υπάρχοντα δεδομένα δεν άλλαξαν.",
      ));
    } finally {
      resetLock.current = false;
      setIsResetting(false);
    }
  }

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">{text("Your learning", "Η μάθησή σου")}</p>
        <h2>{text("Your progress", "Η πρόοδός σου")}</h2>
        <p>{text("View your activity and save a backup.", "Δες τη δραστηριότητά σου και αποθήκευσε backup.")}</p>
      </header>
      <section className="stats-grid">
        <article className="stat-card"><strong>{progress.length}</strong><span>{text("Cards studied", "Κάρτες που μελετήθηκαν")}</span></article>
        <article className="stat-card"><strong>{sessions.length}</strong><span>{text("Study sessions", "Συνεδρίες μελέτης")}</span></article>
        <article className="stat-card"><strong>{progress.reduce((sum, item) => sum + item.lapses, 0)}</strong><span>{text("Marked Again", "Επιλογές Ξανά")}</span></article>
      </section>

      <section className="content-panel">
        <h3>{text("Backup", "Αντίγραφο ασφαλείας")}</h3>
        <StorageNotice kind={storageNoticePlacements.progressBackup} />
        <div className="button-row">
          <button className="button primary" disabled={isExporting || isRestoring || isResetting} onClick={() => void downloadProgressCopy()}>
            {isExporting ? text("Saving…", "Αποθήκευση…") : text("Save backup", "Αποθήκευση backup")}
          </button>
          <button className="button secondary" disabled={isExporting || isRestoring || isResetting} onClick={() => restoreInputRef.current?.click()} type="button">
            {text("Restore backup", "Επαναφορά backup")}
          </button>
          <input accept=".json,application/json" aria-hidden="true" disabled={isExporting || isRestoring || isResetting} hidden ref={restoreInputRef} tabIndex={-1} type="file" onChange={(event) => void restoreProgress(event)} />
          <button className="button danger" disabled={isExporting || isRestoring || isResetting} onClick={() => void resetProgress()}>
            {isResetting ? text("Clearing…", "Διαγραφή…") : text("Clear progress", "Διαγραφή προόδου")}
          </button>
        </div>

        {pendingRestore ? (
          <div className="template-card stack-md" aria-labelledby="restore-preview-title">
            <div>
              <p className="eyebrow">{text("Checked backup", "Ελεγμένο backup")}</p>
              <h4 id="restore-preview-title">{text("Restore preview", "Προεπισκόπηση επαναφοράς")}</h4>
              <p><strong>{text("File", "Αρχείο")}:</strong> {pendingRestore.fileName}</p>
            </div>
            <ul>
              <li><strong>{pendingRestore.preview.progressRecords}</strong> {text("progress records", "εγγραφές προόδου")}</li>
              <li><strong>{pendingRestore.preview.studySessions}</strong> {text("study sessions", "συνεδρίες μελέτης")}</li>
              <li>
                <strong>{text("Settings", "Ρυθμίσεις")}:</strong>{" "}
                {pendingRestore.preview.settingLabels.length > 0
                  ? pendingRestore.preview.settingLabels.map(settingLabel).join(", ")
                  : text("None", "Καμία")}
              </li>
              <li>
                <strong>{text("Created", "Δημιουργήθηκε")}:</strong>{" "}
                <time dateTime={pendingRestore.preview.exportedAt}>
                  {new Date(pendingRestore.preview.exportedAt).toLocaleString(locale)}
                </time>
              </li>
            </ul>
            <div className="button-row">
              <button className="button danger" disabled={isRestoring} onClick={() => void confirmRestore()} type="button">
                {isRestoring ? text("Restoring...", "Επαναφορά...") : text("Restore", "Επαναφορά")}
              </button>
              <button className="button secondary" disabled={isRestoring} onClick={() => {
                setPendingRestore(null);
                setMessage(text("Restore cancelled.", "Η επαναφορά ακυρώθηκε."));
              }} type="button">
                {text("Cancel", "Ακύρωση")}
              </button>
            </div>
          </div>
        ) : null}
        <p className="inline-message" role="status" aria-live="polite">{message}</p>
      </section>

      <section className="content-panel">
        <h3>{text("Recent study sessions", "Πρόσφατες συνεδρίες")}</h3>
        {sessions.length === 0 ? <p>{text("No completed sessions yet.", "Δεν υπάρχουν ολοκληρωμένες συνεδρίες.")}</p> : (
          <div className="table-scroll">
            <table>
              <thead><tr><th>{text("Activity", "Δραστηριότητα")}</th><th>{text("Date", "Ημερομηνία")}</th><th>{text("Cards", "Κάρτες")}</th><th>{text("Correct", "Σωστές")}</th></tr></thead>
              <tbody>{sessions.slice(0, 20).map((session) => (
                <tr key={session.id}>
                  <td>{getStudyModeLabel(session.mode, language)}</td>
                  <td>{new Date(session.startedAt).toLocaleString(locale)}</td>
                  <td>{session.reviewedCards}</td>
                  <td>{session.correctAnswers}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
