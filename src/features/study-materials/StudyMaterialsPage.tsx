import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { LocalStudyFile } from "../../shared/types/models";
import { formatFileKind, formatFileSize, isSplitPdfFile } from "./localStudyFiles";
import {
  parseStoredStudyMaterials,
  STUDY_MATERIALS_SETTING_KEY,
  type StudyMaterialLink,
} from "./studyMaterials";

export function StudyMaterialsPage() {
  const setting = useLiveQuery(
    () => studyDatabase.settings.get(STUDY_MATERIALS_SETTING_KEY),
    [],
  );
  const localFiles = useLiveQuery(
    () => studyDatabase.studyFiles.orderBy("createdAt").reverse().toArray(),
    [],
  ) ?? [];
  const savedLinks = useMemo(
    () => parseStoredStudyMaterials(setting?.value),
    [setting?.value],
  );
  const [message, setMessage] = useState("");

  async function removeLocalFile(file: LocalStudyFile) {
    const confirmed = window.confirm(`Remove "${file.title}" from StudyApp? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await studyDatabase.studyFiles.delete(file.id);
      setMessage(`Removed ${file.title}.`);
    } catch {
      setMessage("The saved file could not be removed.");
    }
  }

  async function removeSavedLink(link: StudyMaterialLink) {
    const confirmed = window.confirm(`Remove "${link.title}" from StudyApp? The file in your cloud service will not be deleted.`);
    if (!confirmed) return;

    try {
      const currentSetting = await studyDatabase.settings.get(STUDY_MATERIALS_SETTING_KEY);
      const currentLinks = parseStoredStudyMaterials(currentSetting?.value);
      await studyDatabase.settings.put({
        key: STUDY_MATERIALS_SETTING_KEY,
        value: currentLinks.filter((item) => item.id !== link.id),
      });
      setMessage(`Removed ${link.title}.`);
    } catch {
      setMessage("The saved cloud link could not be removed.");
    }
  }

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Material management</p>
        <h2>Add / Remove Material</h2>
        <p>Add new material directly inside Library or Structured Study. Use this page to review and remove anything saved in StudyApp.</p>
      </header>

      <section className="content-panel">
        <p className="eyebrow">Add</p>
        <h3>Add material in its destination</h3>
        <p>Library has one upload panel for books, articles, papers, notes and summaries. Structured Study has one upload panel for contents, chapters, sections, concepts, references and diagrams.</p>
        <div className="button-row">
          <Link className="button primary" to="/library">Go to Library upload</Link>
          <Link className="button secondary" to="/study/theory">Go to Structured Study upload</Link>
        </div>
      </section>

      <section className="content-panel">
        <p className="eyebrow">Storage clarification</p>
        <h3>How storage works</h3>
        <ul>
          <li><strong>Files from this device:</strong> stored only in this browser inside StudyApp. They are not uploaded to a server and are not synced.</li>
          <li><strong>Cloud links:</strong> only an automatically generated name, the type and link are saved here. The real file remains in your cloud service.</li>
          <li><strong>Storage is local:</strong> files may be lost if browser/site data is cleared, if private browsing is used, or if the browser removes storage because of low disk space.</li>
          <li><strong>Backups:</strong> local files are not included in study progress backups. Keep the original files in a safe place.</li>
        </ul>
      </section>

      <section className="content-panel">
        <p className="eyebrow">Remove</p>
        <h3>Saved material</h3>
        <p>Remove any item already stored in StudyApp. Removing a local file is permanent. Removing a cloud link does not delete the original cloud file.</p>
        {localFiles.length === 0 && savedLinks.length === 0 ? (
          <p className="inline-message">No saved material yet.</p>
        ) : (
          <div className="library-grid" style={{ alignItems: "start" }}>
            <section className="template-card">
              <h4>Local files</h4>
              {localFiles.length === 0 ? (
                <p className="field-help">No local files saved.</p>
              ) : (
                <ul className="local-file-list">
                  {localFiles.map((file) => (
                    <li className="local-file-row" key={file.id}>
                      <div>
                        <strong>{file.title}</strong>
                        <span>{isSplitPdfFile(file) ? "Structured split PDF" : file.fileSource === "structured-material" ? "Structured Study material" : "Library material"} · {formatFileKind(file.fileKind)} · {formatFileSize(file.size)} · {file.fileName}</span>
                      </div>
                      <button className="button danger compact-square" onClick={() => void removeLocalFile(file)} type="button">Remove</button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="template-card">
              <h4>Cloud links</h4>
              {savedLinks.length === 0 ? (
                <p className="field-help">No cloud links saved.</p>
              ) : (
                <ul className="local-file-list">
                  {savedLinks.map((link) => (
                    <li className="local-file-row" key={link.id}>
                      <div>
                        <strong>{link.title}</strong>
                        <span>{link.structuredStudyType ? "Structured Study link" : "Library link"} · {link.url}</span>
                      </div>
                      <button className="button danger compact-square" onClick={() => void removeSavedLink(link)} type="button">Remove</button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </section>

      <p className="inline-message status-banner" role="status" aria-live="polite">{message}</p>
    </div>
  );
}
