import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useLocation, useSearchParams } from "react-router-dom";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import { CloudLinkForm } from "./CloudLinkForm";
import { LocalPdfForm } from "./LocalPdfForm";
import {
  builtInStudyMaterials,
  parseStoredStudyMaterials,
  STUDY_MATERIALS_SETTING_KEY,
} from "./studyMaterials";

const studyMaterialCategories = [
  {
    id: "contents",
    title: "Contents",
    description: "Table of contents and the high-level map of the material.",
  },
  {
    id: "chapters",
    title: "Chapters",
    description: "Major learning blocks inside a book, paper, PDF or course material.",
  },
  {
    id: "sections-paragraphs",
    title: "Sections / Paragraphs",
    description: "Smaller parts inside chapters for focused study and review.",
  },
  {
    id: "key-concepts",
    title: "Key Concepts",
    description: "Important ideas, definitions and principles that need to be understood and remembered.",
  },
  {
    id: "bibliography-references",
    title: "Bibliography / References",
    description: "References and source trails connected to the study material.",
  },
  {
    id: "images-diagrams",
    title: "Images / Diagrams",
    description: "Figures, diagrams, visual evidence, processes and relationships worth remembering.",
  },
] as const;

export function StudyMaterialsPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
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

  useEffect(() => {
    if (!location.hash) return;

    const target = document.getElementById(location.hash.slice(1));
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.focus({ preventScroll: true });
  }, [location.hash]);

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Books, notes and theory</p>
        <h2>Study materials</h2>
        <p>Add local files or cloud links for your course books, notes, articles and papers.</p>
      </header>

      <section className="content-panel">
        <p className="eyebrow">Storage clarification</p>
        <h3>How storage works</h3>
        <ul>
          <li><strong>Files from this device:</strong> stored only in this browser on this device. They are not uploaded and are not synced.</li>
          <li><strong>Cloud links:</strong> only the title and link are saved here. The real file remains in your cloud service.</li>
          <li><strong>Storage is local:</strong> files may be lost if browser/site data is cleared, if private browsing is used, or if the browser removes storage because of low disk space.</li>
          <li><strong>Backups:</strong> local files are not included in study progress backups. Keep the original files in a safe place.</li>
        </ul>
      </section>

      <section className="content-panel">
        <p className="eyebrow">View</p>
        <h3>Study material categories</h3>
        <p>Jump to the part of the material you want to structure.</p>
        <div className="learning-stage-grid">
          {studyMaterialCategories.map((category) => (
            <article
              className="learning-stage-card"
              id={category.id}
              key={category.id}
              tabIndex={-1}
              style={{ minHeight: "220px", gap: "0.5rem" }}
            >
              <h4 style={{ marginBottom: "0.25rem" }}>{category.title}</h4>
              <p style={{ margin: 0 }}>{category.description}</p>
              <div className="tag-row" style={{ marginTop: "auto" }}>
                <span className="tag">Cloud links: {links.length}</span>
                <span className="tag">Files on this device: {localFiles.length}</span>
              </div>
              <p className="field-help" style={{ marginTop: "0.15rem" }}>
                Materials for this category appear here.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-panel material-option-panel" ref={localFileSectionRef} tabIndex={-1}>
        <div>
          <p className="eyebrow">Option 1</p>
          <h3>Add a file from this device</h3>
          <div className="privacy-notice">
            <strong>Stored in this browser on this device</strong>
            <p>The file is private and local. It is not uploaded to a server and it is not synced to another device.</p>
            <p>Supported examples: PDF, Word documents, text files, CSV files and images.</p>
            <p>Maximum size: 50 MB per file.</p>
            <p>Local files are not included when you save a copy of your study progress. Keep the original file somewhere safe.</p>
            <p>The file may be lost if browser/site data is cleared, if you use private browsing, or if the browser removes storage because of low disk space.</p>
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
            <li>Upload the book, notes, paper or source file to your cloud service.</li>
            <li>Choose the sharing access that is appropriate for you.</li>
            <li>Copy the shared link and paste it below.</li>
          </ol>
          <p>Only the title and link are saved in this app. The actual file remains in your cloud service.</p>
        </div>
        <CloudLinkForm savedLinks={savedLinks} existingLinks={links} onMessage={setMessage} />
      </section>

      <p className="inline-message status-banner" role="status" aria-live="polite">{message}</p>
    </div>
  );
}
