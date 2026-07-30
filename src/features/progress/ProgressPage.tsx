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
  const [isRestoring, setIsRestoring] = useState(false);
  const restoreLock = useRef(false);

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

  async function downloadProgressCopy() {
    const backup = await exportBackup();
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `study-progress-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage(text("Backup saved. Files are not included.", "Το backup αποθηκεύτηκε. Τα αρχεία δεν περιλαμβάνονται."));
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
      setMessage(
        error instanceof BackupValidationError && language === "en"
          ? error.message
          : text("The backup could not be read.", "Το backup δεν μπορεί να διαβαστεί."),
      );
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
    if (!window.confirm(text("Remove all study progress from this device?", "Να διαγραφεί όλη η πρόοδος από αυτή τη συσκευή;"))) return;
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
          <button className="button primary" disabled={isRestoring} onClick={() => void downloadProgressCopy()}>
            {text("Save backup", "Αποθήκευση backup")}
          </button>
          <label className="button secondary file-button">
            {text("Restore backup", "Επαναφορά backup")}
            <input accept=".json,application/json" disabled={isRestoring} type="file" onChange={(event) => void restoreProgress(event)} />
          </label>
          <button className="button danger" disabled={isRestoring} onClick={() => void resetProgress()}>
            {text("Clear progress", "Διαγραφή προόδου")}
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
