import { type ChangeEvent, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
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
  const progress = useLiveQuery(() => studyDatabase.cardProgress.toArray(), []) ?? [];
  const sessions = useLiveQuery(() => studyDatabase.studySessions.orderBy("startedAt").reverse().toArray(), []) ?? [];
  const [message, setMessage] = useState("");
  const [pendingRestore, setPendingRestore] = useState<PendingRestore | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const restoreLock = useRef(false);

  async function downloadProgressCopy() {
    const backup = await exportBackup();
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `study-progress-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("A progress and settings backup was saved to your device. Local PDFs and other file copies are not included.");
  }

  async function restoreProgress(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPendingRestore(null);
    try {
      if (file.size > MAX_BACKUP_FILE_SIZE) {
        throw new BackupValidationError("The backup file is larger than the 10 MB limit.");
      }
      const backup = parseBackupJson(await file.text(), file.size);
      setPendingRestore({
        fileName: file.name,
        backup,
        preview: createBackupPreview(backup),
      });
      setMessage("The backup is valid. Review the summary before replacing current data.");
    } catch (error) {
      setMessage(
        error instanceof BackupValidationError
          ? error.message
          : "We could not read that backup file.",
      );
    } finally {
      event.target.value = "";
    }
  }

  async function confirmRestore() {
    if (!pendingRestore || restoreLock.current) return;
    if (!window.confirm(
      "Replace the current progress, study sessions and supported settings with this backup? Local file copies are not changed.",
    )) return;

    restoreLock.current = true;
    setIsRestoring(true);
    try {
      await importBackup(pendingRestore.backup);
      setPendingRestore(null);
      setMessage("Your saved progress and settings were restored.");
    } catch {
      setMessage("The restore failed. Your existing progress and settings were not changed.");
    } finally {
      restoreLock.current = false;
      setIsRestoring(false);
    }
  }

  async function resetProgress() {
    if (!window.confirm("Remove all study progress from this device?")) return;
    await studyDatabase.transaction("rw", studyDatabase.cardProgress, studyDatabase.studySessions, async () => {
      await studyDatabase.cardProgress.clear();
      await studyDatabase.studySessions.clear();
    });
    setMessage("Your study progress was removed.");
  }

  return (
    <div className="stack-lg">
      <header className="page-heading"><p className="eyebrow">Your learning</p><h2>Your progress</h2><p>See what you have studied and keep a personal copy of your progress.</p></header>
      <section className="stats-grid">
        <article className="stat-card"><strong>{progress.length}</strong><span>Cards studied</span></article>
        <article className="stat-card"><strong>{sessions.length}</strong><span>Study sessions</span></article>
        <article className="stat-card"><strong>{progress.reduce((sum, item) => sum + item.lapses, 0)}</strong><span>Cards marked “Again”</span></article>
      </section>
      <section className="content-panel">
        <h3>Keep your progress safe</h3>
        <p>Save a JSON backup of your progress, study sessions and app settings so you can restore them later.</p>
        <StorageNotice kind={storageNoticePlacements.progressBackup} />
        <div className="button-row">
          <button className="button primary" disabled={isRestoring} onClick={() => void downloadProgressCopy()}>Save progress and settings backup</button>
          <label className="button secondary file-button">Restore progress and settings<input accept=".json,application/json" disabled={isRestoring} type="file" onChange={(event) => void restoreProgress(event)} /></label>
          <button className="button danger" disabled={isRestoring} onClick={() => void resetProgress()}>Clear my progress</button>
        </div>
        {pendingRestore ? (
          <div className="template-card stack-md" aria-labelledby="restore-preview-title">
            <div>
              <p className="eyebrow">Checked backup</p>
              <h4 id="restore-preview-title">Restore preview</h4>
              <p><strong>File:</strong> {pendingRestore.fileName}</p>
            </div>
            <ul>
              <li><strong>{pendingRestore.preview.progressRecords}</strong> progress records</li>
              <li><strong>{pendingRestore.preview.studySessions}</strong> study sessions</li>
              <li>
                <strong>Settings included:</strong>{" "}
                {pendingRestore.preview.settingLabels.length > 0
                  ? pendingRestore.preview.settingLabels.join(", ")
                  : "None"}
              </li>
              <li>
                <strong>Backup created:</strong>{" "}
                <time dateTime={pendingRestore.preview.exportedAt}>
                  {new Date(pendingRestore.preview.exportedAt).toLocaleString("en-GB")}
                </time>
              </li>
            </ul>
            <p className="muted">
              Restoring replaces current progress, study sessions and supported settings in one operation.
              Local PDFs, documents, images and split PDF copies are not included or changed.
            </p>
            <div className="button-row">
              <button className="button danger" disabled={isRestoring} onClick={() => void confirmRestore()} type="button">
                {isRestoring ? "Restoring..." : "Replace current progress and settings"}
              </button>
              <button className="button secondary" disabled={isRestoring} onClick={() => {
                setPendingRestore(null);
                setMessage("Restore cancelled. No data was changed.");
              }} type="button">
                Cancel
              </button>
            </div>
          </div>
        ) : null}
        <p className="inline-message" role="status" aria-live="polite">{message}</p>
      </section>
      <section className="content-panel">
        <h3>Recent study sessions</h3>
        {sessions.length === 0 ? <p>You have not completed a study session yet.</p> : (
          <div className="table-scroll"><table><thead><tr><th>Activity</th><th>Date</th><th>Cards</th><th>Correct answers</th></tr></thead><tbody>{sessions.slice(0, 20).map((session) => <tr key={session.id}><td>{session.mode}</td><td>{new Date(session.startedAt).toLocaleString("en-GB")}</td><td>{session.reviewedCards}</td><td>{session.correctAnswers}</td></tr>)}</tbody></table></div>
        )}
      </section>
    </div>
  );
}
