import { type ChangeEvent, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { exportBackup, importBackup } from "../../infrastructure/backup/backup";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";

export function ProgressPage() {
  const progress = useLiveQuery(() => studyDatabase.cardProgress.toArray(), []) ?? [];
  const sessions = useLiveQuery(() => studyDatabase.studySessions.orderBy("startedAt").reverse().toArray(), []) ?? [];
  const [message, setMessage] = useState("");

  async function downloadBackup() {
    const backup = await exportBackup();
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `study-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("The backup was created.");
  }

  async function restoreBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await importBackup(JSON.parse(await file.text()));
      setMessage("The backup was imported.");
    } catch {
      setMessage("The backup file is invalid.");
    } finally {
      event.target.value = "";
    }
  }

  async function resetProgress() {
    if (!window.confirm("Delete all local progress?")) return;
    await studyDatabase.transaction("rw", studyDatabase.cardProgress, studyDatabase.studySessions, async () => {
      await studyDatabase.cardProgress.clear();
      await studyDatabase.studySessions.clear();
    });
    setMessage("Progress was deleted.");
  }

  return (
    <div className="stack-lg">
      <header className="page-heading"><p className="eyebrow">Local progress</p><h2>Progress and backup</h2></header>
      <section className="stats-grid">
        <article className="stat-card"><strong>{progress.length}</strong><span>Studied cards</span></article>
        <article className="stat-card"><strong>{sessions.length}</strong><span>Sessions</span></article>
        <article className="stat-card"><strong>{progress.reduce((sum, item) => sum + item.lapses, 0)}</strong><span>Rating-zero reviews</span></article>
      </section>
      <section className="content-panel">
        <h3>Data management</h3>
        <div className="button-row">
          <button className="button primary" onClick={() => void downloadBackup()}>Export backup</button>
          <label className="button secondary file-button">Import backup<input accept="application/json" type="file" onChange={(event) => void restoreBackup(event)} /></label>
          <button className="button danger" onClick={() => void resetProgress()}>Delete progress</button>
        </div>
        <p className="inline-message" role="status">{message}</p>
      </section>
      <section className="content-panel">
        <h3>Recent sessions</h3>
        {sessions.length === 0 ? <p>There are no sessions yet.</p> : (
          <div className="table-scroll"><table><thead><tr><th>Type</th><th>Date</th><th>Cards</th><th>Correct</th></tr></thead><tbody>{sessions.slice(0, 20).map((session) => <tr key={session.id}><td>{session.mode}</td><td>{new Date(session.startedAt).toLocaleString("en-GB")}</td><td>{session.reviewedCards}</td><td>{session.correctAnswers}</td></tr>)}</tbody></table></div>
        )}
      </section>
    </div>
  );
}
