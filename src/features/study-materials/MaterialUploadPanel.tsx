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
