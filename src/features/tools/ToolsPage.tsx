import { useLiveQuery } from "dexie-react-hooks";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import { SplitPdfTool } from "../study-materials/SplitPdfTool";

export function ToolsPage() {
  const localFiles = useLiveQuery(
    () => studyDatabase.studyFiles.orderBy("createdAt").reverse().toArray(),
    [],
  ) ?? [];

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Utilities</p>
        <h2>Tools</h2>
        <p>Use local study utilities that work inside this browser without uploading your files.</p>
      </header>

      <section className="content-panel">
        <p className="eyebrow">Local PDF tool</p>
        <h3>Split PDF</h3>
        <p>
          Split a locally saved PDF into smaller PDF files. Processing happens only in this browser,
          and the generated PDFs are saved as local study materials on this device.
        </p>
        <SplitPdfTool files={localFiles} onMessage={() => undefined} />
      </section>
    </div>
  );
}
