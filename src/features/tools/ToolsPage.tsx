import { useState } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import { SplitPdfTool } from "../study-materials/SplitPdfTool";

export function ToolsPage() {
  const localFiles = useLiveQuery(
    () => studyDatabase.studyFiles.orderBy("createdAt").reverse().toArray(),
    [],
  ) ?? [];
  const [message, setMessage] = useState("");

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Utilities</p>
        <h2>Tools</h2>
        <p>Use local study utilities that work inside this browser without uploading your files.</p>
      </header>

      <section className="content-panel">
        <p className="eyebrow">Materials</p>
        <h3>Add / remove material</h3>
        <p>Add local files or cloud links from the Study Materials add area, or return there to manage your saved materials.</p>
        <div className="button-row">
          <Link className="button primary" to="/study-materials?add=file">Add material from this device</Link>
          <Link className="button secondary" to="/study-materials?add=link">Add material from a cloud link</Link>
          <Link className="button secondary" to="/study-materials#manage-materials">View / remove saved materials</Link>
        </div>
      </section>

      <section className="content-panel" id="split-pdf" tabIndex={-1}>
        <p className="eyebrow">Local PDF tool</p>
        <h3>Split PDF</h3>
        <p>
          Split a locally saved PDF into smaller PDF files. Processing happens only in this browser,
          and the generated PDFs are saved as local study materials on this device.
        </p>
        <SplitPdfTool files={localFiles} onMessage={setMessage} />
      </section>

      <p className="inline-message status-banner" role="status" aria-live="polite">{message}</p>
    </div>
  );
}
