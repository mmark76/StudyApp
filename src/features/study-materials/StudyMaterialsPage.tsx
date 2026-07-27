import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useSearchParams } from "react-router-dom";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { LocalStudyFile } from "../../shared/types/models";
import { CloudLinkForm } from "./CloudLinkForm";
import { LocalPdfForm } from "./LocalPdfForm";
import { formatFileKind, formatFileSize, isSplitPdfFile } from "./localStudyFiles";
import {
  builtInStudyMaterials,
  parseStoredStudyMaterials,
  STUDY_MATERIALS_SETTING_KEY,
  type StudyMaterialLink,
} from "./studyMaterials";

export function StudyMaterialsPage() {
  const [searchParams] = useSearchParams();
  const addMode = searchParams.get("add");
  const cloudLinkSectionRef = useRef<HTMLElement>(null);
  const localFileSectionRef = useRef<HTMLElement>(null);
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
  const links = [...builtInStudyMaterials, ...savedLinks];
  const [message, setMessage] = useState("");

  useEffect(() => {
    const target = addMode === "link"
      ? cloudLinkSectionRef.current
      : addMode === "file" || addMode === "pdf"
        ? localFileSectionRef.current
        : null;

    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.focus({ preventScroll: true });
  }, [addMode]);

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
        <p>Add new material or remove any saved local file or cloud link. Reading belongs in Library and Structured Study.</p>
      </header>

      <section className="content-panel">
        <p className="eyebrow">Storage clarification</p>
        <h3>How storage works</h3>
        <ul>
          <li><strong>Files from this device:</strong> stored only in this browser inside StudyApp. They are not uploaded to a server and are not synced.</li>
          <li><strong>Cloud links:</strong> only an automatically generated name, the destination, type and link are saved here. The real file remains in your cloud service.</li>
          <li><strong>Storage is local:</strong> files may be lost if browser/site data is cleared, if private browsing is used, or if the browser removes storage because of low disk space.</li>
          <li><strong>Backups:</strong> local files are not included in study progress backups. Keep the original files in a safe place.</li>
        </ul>
      </section>

      <section className="content-panel">
        <p className="eyebrow">Upload</p>
        <h3>Upload new material</h3>
        <p>Choose whether the material belongs in Library or Structured Study, select its type, then choose a local file or paste a cloud link. Clear resets the form, while Undo upload removes only the item that was just uploaded.</p>

        <div className="library-grid" style={{ alignItems: "stretch" }}>
          <section
            className="template-card"
            ref={localFileSectionRef}
            tabIndex={-1}
            style={{ display: "grid", gap: "1rem", alignContent: "start", height: "100%" }}
          >
            <div style={{ display: "grid", gap: "1rem", minHeight: "26rem", alignContent: "start" }}>
              <div>
                <p className="eyebrow">Option 1</p>
                <h4>Local file</h4>
              </div>
              <div className="privacy-notice">
                <strong>Stored inside StudyApp in this browser</strong>
                <p>The file is private and local. It is not uploaded to a server and it is not synced to another device.</p>
                <p>Supported examples: PDF, Word documents, text files, CSV files and images.</p>
                <p>Maximum size: 50 MB per file.</p>
                <p>Local files are not included when you save a copy of your study progress. Keep the original file somewhere safe.</p>
                <p>The file may be lost if browser/site data is cleared, if you use private browsing, or if the browser removes storage because of low disk space.</p>
              </div>
            </div>
            <LocalPdfForm files={localFiles} onMessage={setMessage} />
          </section>

          <section
            className="template-card"
            ref={cloudLinkSectionRef}
            tabIndex={-1}
            style={{ display: "grid", gap: "1rem", alignContent: "start", height: "100%" }}
          >
            <div style={{ display: "grid", gap: "1rem", minHeight: "26rem", alignContent: "start" }}>
              <div>
                <p className="eyebrow">Option 2</p>
                <h4>Cloud link</h4>
                <p>Use this option for large files or materials you want to access from different devices.</p>
              </div>
              <ol className="friendly-steps">
                <li>Upload the book, notes, paper or source file to your cloud service.</li>
                <li>Choose the sharing access that is appropriate for you.</li>
                <li>Copy the shared link and paste it below.</li>
              </ol>
              <p>Only an automatically generated name, the destination, type and link are saved in this app. The actual file remains in your cloud service.</p>
            </div>
            <CloudLinkForm savedLinks={savedLinks} existingLinks={links} onMessage={setMessage} />
          </section>
        </div>
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
