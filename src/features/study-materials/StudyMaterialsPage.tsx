import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useSearchParams } from "react-router-dom";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import { CloudLinkForm } from "./CloudLinkForm";
import {
  formatFileKind,
  formatFileSize,
  openLocalFile,
} from "./localStudyFiles";
import { LocalPdfForm } from "./LocalPdfForm";
import {
  builtInStudyMaterials,
  parseStoredStudyMaterials,
  STUDY_MATERIALS_SETTING_KEY,
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

  async function removeLink(id: string) {
    await studyDatabase.settings.put({
      key: STUDY_MATERIALS_SETTING_KEY,
      value: savedLinks.filter((item) => item.id !== id),
    });
    setMessage("The cloud link was removed.");
  }

  async function removeFile(id: string) {
    await studyDatabase.studyFiles.delete(id);
    setMessage("The file was removed from this device.");
  }

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Books, notes and theory</p>
        <h2>Study materials</h2>
        <p>Keep your course books, notes, articles, papers and files together with your study content.</p>
      </header>

      <section className="content-panel">
        <h3>Your cloud links</h3>
        {links.length === 0 ? (
          <p>No cloud links have been added yet.</p>
        ) : (
          <ul className="material-link-list">
            {links.map((material) => (
              <li className="material-link-row" key={material.id}>
                <a className="text-link" href={material.url} target="_blank" rel="noopener noreferrer">
                  {material.title} - open
                </a>
                {savedLinks.some((item) => item.id === material.id) ? (
                  <button className="button danger compact" onClick={() => void removeLink(material.id)}>
                    Remove
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="content-panel">
        <h3>Files on this device</h3>
        {localFiles.length === 0 ? (
          <p>No local files have been added to this device yet.</p>
        ) : (
          <ul className="local-file-list">
            {localFiles.map((file) => (
              <li className="local-file-row" key={file.id}>
                <div>
                  <strong>{file.title}</strong>
                  <span>{formatFileKind(file.fileKind)} · {file.fileName} - {formatFileSize(file.size)}</span>
                </div>
                <div className="button-row">
                  <button className="button secondary compact" onClick={() => openLocalFile(file)}>Open file</button>
                  <button className="button danger compact" onClick={() => void removeFile(file.id)}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="content-panel material-option-panel" ref={localFileSectionRef} tabIndex={-1}>
        <div>
          <p className="eyebrow">Option 1</p>
          <h3>Add a file from this device</h3>
          <div className="privacy-notice">
            <strong>Private and local</strong>
            <p>The file stays only inside this browser on this device.</p>
            <p>Supported examples: PDF, Word documents, text files, CSV files and images.</p>
            <p>Maximum size: 50 MB per file. Local files are not included when you save a copy of your study progress.</p>
          </div>
        </div>
        <LocalPdfForm files={localFiles} onMessage={setMessage} />
      </section>

      <section className="content-panel material-option-panel" ref={cloudLinkSectionRef} tabIndex={-1}>
        <div>
          <p className="eyebrow">Option 2</p>
          <h3>Add a cloud link</h3>
          <p>Use this option for large files or materials you want to access from different devices.</p>
          <ol className="friendly-steps">
            <li>Upload the book, notes, paper or source file to a cloud service.</li>
            <li>Choose the sharing access that is appropriate for you.</li>
            <li>Copy the shared link and paste it below.</li>
          </ol>
        </div>
        <CloudLinkForm savedLinks={savedLinks} existingLinks={links} onMessage={setMessage} />
      </section>

      <p className="inline-message status-banner" role="status" aria-live="polite">{message}</p>
    </div>
  );
}
