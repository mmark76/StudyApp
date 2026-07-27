import type { LocalStudyFile } from "../../shared/types/models";
import { CloudLinkForm } from "./CloudLinkForm";
import { LocalPdfForm } from "./LocalPdfForm";
import type { MaterialDestination } from "./materialDestination";
import type { StudyMaterialLink } from "./studyMaterials";

export function MaterialUploadPanel({
  destination,
  files,
  savedLinks,
  existingLinks,
  onMessage,
}: {
  destination: MaterialDestination;
  files: readonly LocalStudyFile[];
  savedLinks: readonly StudyMaterialLink[];
  existingLinks: readonly StudyMaterialLink[];
  onMessage: (message: string) => void;
}) {
  const destinationLabel = destination === "structured-study" ? "Structured Study" : "Library";
  const typeLabel = destination === "structured-study" ? "structured part" : "Library type";

  return (
    <section className="content-panel" aria-label={`Upload new ${destinationLabel} material`}>
      <p className="eyebrow">Upload</p>
      <h3>Upload new material</h3>
      <p>Choose a {typeLabel}, then add either one local file or one cloud link. The material will be stored directly in {destinationLabel}.</p>

      <details className="privacy-notice">
        <summary><strong>How storage works</strong></summary>
        <ul>
          <li><strong>Files from this device:</strong> stored only in this browser inside StudyApp. They are not uploaded to a server and are not synced.</li>
          <li><strong>Cloud links:</strong> only an automatically generated name, the type and link are saved. The real file remains in your cloud service.</li>
          <li><strong>Storage is local:</strong> files may be lost if browser or site data is cleared, private browsing is used, or the browser removes storage because of low disk space.</li>
          <li><strong>Backups:</strong> local files are not included in study progress backups. Keep the original files in a safe place.</li>
        </ul>
      </details>

      <div className="library-grid" style={{ alignItems: "stretch" }}>
        <section className="template-card" style={{ display: "grid", gap: "1rem", alignContent: "start", height: "100%" }}>
          <div>
            <p className="eyebrow">Option 1</p>
            <h4>Local file</h4>
            <p>PDF, Word, text, CSV and image files up to 50 MB are stored privately in this browser.</p>
          </div>
          <LocalPdfForm destination={destination} files={files} onMessage={onMessage} />
        </section>

        <section className="template-card" style={{ display: "grid", gap: "1rem", alignContent: "start", height: "100%" }}>
          <div>
            <p className="eyebrow">Option 2</p>
            <h4>Cloud link</h4>
            <p>Use a shared link for large files or material that should remain in your cloud service.</p>
          </div>
          <CloudLinkForm
            destination={destination}
            savedLinks={savedLinks}
            existingLinks={existingLinks}
            onMessage={onMessage}
          />
        </section>
      </div>
    </section>
  );
}
