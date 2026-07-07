import { useState } from "react";
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
        <p className="eyebrow">Local PDF tool</p>
        <h2>Split PDF Tool</h2>
        <p>Split local PDF files inside this browser without uploading your files.</p>
      </header>

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
