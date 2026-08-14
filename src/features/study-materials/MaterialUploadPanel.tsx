import { useLanguage } from "../../i18n/LanguageContext";
import type { LocalStudyFile } from "../../shared/types/models";
import {
  StorageNotice,
  storageNoticePlacements,
} from "../../shared/components/StorageNotice";
import { CloudLinkForm } from "./CloudLinkForm";
import { LocalPdfForm } from "./LocalPdfForm";
import type { MaterialDestination } from "./materialDestination";
import type { StudyMaterialLink } from "./studyMaterials";

export function MaterialUploadPanel({
  destination,
  files,
  existingLinks,
  linksBlocked = false,
  onMessage,
}: {
  destination: MaterialDestination;
  files: readonly LocalStudyFile[];
  existingLinks: readonly StudyMaterialLink[];
  linksBlocked?: boolean;
  onMessage: (message: string) => void;
}) {
  const { text } = useLanguage();
  const destinationLabel = destination === "structured-study"
    ? text("Structured Study", "Δομημένη Μελέτη")
    : text("Library", "Βιβλιοθήκη");

  return (
    <section className="content-panel" aria-label={text(`Add material to ${destinationLabel}`, `Προσθήκη υλικού στη ${destinationLabel}`)}>
      <p className="eyebrow">{text("Local import", "Τοπική εισαγωγή")}</p>
      <h3>{text("Add material", "Προσθήκη υλικού")}</h3>
      <p>{text("Add a local file or save a link.", "Πρόσθεσε τοπικό αρχείο ή αποθήκευσε σύνδεσμο.")}</p>

      <StorageNotice kind={storageNoticePlacements.materialUpload} />

      <div className="library-grid" style={{ alignItems: "stretch" }}>
        <section className="template-card" style={{ display: "grid", gap: "1rem", alignContent: "start", height: "100%" }}>
          <div>
            <p className="eyebrow">{text("Option 1", "Επιλογή 1")}</p>
            <h4>{text("Local file", "Τοπικό αρχείο")}</h4>
            <p>{text("PDF, Word, text, CSV and images up to 50 MB.", "PDF, Word, κείμενο, CSV και εικόνες έως 50 MB.")}</p>
          </div>
          <LocalPdfForm destination={destination} files={files} onMessage={onMessage} />
        </section>

        <section className="template-card" style={{ display: "grid", gap: "1rem", alignContent: "start", height: "100%" }}>
          <div>
            <p className="eyebrow">{text("Option 2", "Επιλογή 2")}</p>
            <h4>{text("Cloud link", "Σύνδεσμος")}</h4>
            <p>{text("Save a link to material stored elsewhere.", "Αποθήκευσε σύνδεσμο προς υλικό που βρίσκεται αλλού.")}</p>
          </div>
          <CloudLinkForm
            destination={destination}
            existingLinks={existingLinks}
            linksBlocked={linksBlocked}
            onMessage={onMessage}
          />
        </section>
      </div>
    </section>
  );
}
