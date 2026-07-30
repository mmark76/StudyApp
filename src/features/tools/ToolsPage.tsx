import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useLanguage } from "../../i18n/LanguageContext";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import {
  StorageNotice,
  storageNoticePlacements,
} from "../../shared/components/StorageNotice";
import { SplitPdfTool } from "../study-materials/SplitPdfTool";

export function ToolsPage() {
  const { text } = useLanguage();
  const localFiles = useLiveQuery(
    () => studyDatabase.studyFiles.orderBy("createdAt").reverse().toArray(),
    [],
  ) ?? [];
  const [message, setMessage] = useState("");

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">{text("Local PDF tool", "Τοπικό εργαλείο PDF")}</p>
        <h2>{text("Split PDF Tool", "Διαχωρισμός PDF")}</h2>
        <p>{text("Split PDF files locally in your browser.", "Διαχώρισε PDF τοπικά στον browser.")}</p>
      </header>

      <StorageNotice kind={storageNoticePlacements.pdfSplitter} />

      <section className="content-panel" id="split-pdf" tabIndex={-1}>
        <p className="eyebrow">{text("Local PDF tool", "Τοπικό εργαλείο PDF")}</p>
        <h3>{text("Split PDF", "Διαχωρισμός PDF")}</h3>
        <p>{text(
          "Create smaller PDF files. Processing stays in this browser.",
          "Δημιούργησε μικρότερα PDF. Η επεξεργασία παραμένει στον browser.",
        )}</p>
        <SplitPdfTool files={localFiles} onMessage={setMessage} />
      </section>

      <p className="inline-message status-banner" role="status" aria-live="polite">{message}</p>
    </div>
  );
}
