import { type ChangeEvent, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { exportBackup, importBackup } from "../../infrastructure/backup/backup";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";

export function ProgressPage() {
  const progress = useLiveQuery(() => studyDatabase.cardProgress.toArray(), []) ?? [];
  const sessions = useLiveQuery(() => studyDatabase.studySessions.orderBy("startedAt").reverse().toArray(), []) ?? [];
  const [message, setMessage] = useState("");

  async function downloadProgressCopy() {
    const backup = await exportBackup();
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `study-progress-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("A copy of your progress was saved to your device. Local file blobs are not included.");
  }

  async function restoreProgress(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await importBackup(JSON.parse(await file.text()));
      setMessage("Your saved progress was restored.");
    } catch {
      setMessage("We could not restore progress from that file.");
    } finally {
      event.target.value = "";
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
        <p>Save a copy to your device so you can restore it later or move it to another device.</p>
        <p className="muted">This backup includes progress, sessions and settings. It does not include local files stored in the Library.</p>
        <div className="button-row">
          <button className="button primary" onClick={() => void downloadProgressCopy()}>Save a copy of my progress</button>
          <label className="button secondary file-button">Restore saved progress<input accept="application/json" type="file" onChange={(event) => void restoreProgress(event)} /></label>
          <button className="button danger" onClick={() => void resetProgress()}>Clear my progress</button>
        </div>
        <p className="inline-message" role="status">{message}</p>
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
