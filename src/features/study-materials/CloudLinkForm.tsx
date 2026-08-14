import { type FormEvent, useRef, useState } from "react";
import {
  getSourceMaterialTypeLabel,
  getStructuredStudyTypeLabel,
} from "../../i18n/domainLabels";
import { useLanguage } from "../../i18n/LanguageContext";
import type { SourceMaterialType, StructuredStudyType } from "../../shared/types/models";
import { createId } from "../../shared/utils/id";
import {
  isSourceMaterialType,
  isStructuredStudyType,
  sourceMaterialTypeOptions,
  structuredStudyTypeOptions,
} from "./localStudyFiles";
import type { MaterialDestination } from "./materialDestination";
import {
  normalizeStudyMaterialUrl,
  titleFromStudyMaterialUrl,
  type StudyMaterialLink,
} from "./studyMaterials";
import {
  addSavedStudyMaterialLink,
  removeSavedStudyMaterialLink,
} from "./studyMaterialLinksRepository";

export function CloudLinkForm({
  destination,
  existingLinks,
  linksBlocked = false,
  onMessage,
}: {
  destination: MaterialDestination;
  existingLinks: readonly StudyMaterialLink[];
  linksBlocked?: boolean;
  onMessage: (message: string) => void;
}) {
  const { language, text } = useLanguage();
  const [url, setUrl] = useState("");
  const [materialType, setMaterialType] = useState<SourceMaterialType | "">("");
  const [structuredStudyType, setStructuredStudyType] = useState<StructuredStudyType | "">("");
  const [uploadedLink, setUploadedLink] = useState<StudyMaterialLink | null>(null);
  const lock = useRef(false);
  const canRemove = Boolean(uploadedLink) || url.trim().length > 0 || materialType.length > 0 || structuredStudyType.length > 0;

  function clearDraft() {
    setUrl("");
    setMaterialType("");
    setStructuredStudyType("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;

    if (destination === "library" && !isSourceMaterialType(materialType)) {
      onMessage(text("Choose a Library type.", "Επίλεξε τύπο Βιβλιοθήκης."));
      return;
    }
    if (destination === "structured-study" && !isStructuredStudyType(structuredStudyType)) {
      onMessage(text("Choose a Structured Study type.", "Επίλεξε τύπο Δομημένης Μελέτης."));
      return;
    }

    lock.current = true;
    try {
      const normalizedUrl = normalizeStudyMaterialUrl(url);
      const item: StudyMaterialLink = {
        id: createId("material"),
        title: titleFromStudyMaterialUrl(normalizedUrl),
        url: normalizedUrl,
        ...(isSourceMaterialType(materialType) ? { materialType } : {}),
        ...(isStructuredStudyType(structuredStudyType) ? { structuredStudyType } : {}),
      };
      if (existingLinks.some((link) => link.url === item.url)) {
        onMessage(text("This link is already saved.", "Ο σύνδεσμος είναι ήδη αποθηκευμένος."));
        return;
      }

      await addSavedStudyMaterialLink(item);
      setUploadedLink(item);
      clearDraft();
      onMessage(text("Link added.", "Ο σύνδεσμος προστέθηκε."));
    } catch {
      onMessage(text("Enter a valid web link.", "Γράψε έγκυρο σύνδεσμο."));
    } finally {
      lock.current = false;
    }
  }

  async function removeSelectionOrUpload() {
    if (lock.current) return;

    if (!uploadedLink) {
      clearDraft();
      onMessage(text("Fields cleared.", "Τα πεδία καθαρίστηκαν."));
      return;
    }

    lock.current = true;
    try {
      await removeSavedStudyMaterialLink(uploadedLink.id);
      onMessage(text(`Removed ${uploadedLink.title}.`, `Διαγράφηκε το ${uploadedLink.title}.`));
      setUploadedLink(null);
      clearDraft();
    } catch {
      onMessage(text("The link could not be removed.", "Ο σύνδεσμος δεν μπορεί να διαγραφεί."));
    } finally {
      lock.current = false;
    }
  }

  const destinationLabel = destination === "structured-study"
    ? text("Structured Study", "Δομημένη Μελέτη")
    : text("Library", "Βιβλιοθήκη");

  if (linksBlocked) {
    return (
      <p className="inline-message" role="alert">
        {text(
          "Saved links are damaged or incompatible. Nothing was changed. Restore a valid backup before changing links.",
          "Οι αποθηκευμένοι σύνδεσμοι είναι κατεστραμμένοι ή ασύμβατοι. Δεν άλλαξε τίποτα. Επαναφέρετε έγκυρο backup πριν αλλάξετε συνδέσμους.",
        )}
      </p>
    );
  }

  return (
    <form className="material-form" onSubmit={(event) => void submit(event)}>
      {destination === "library" ? (
        <label className="field-label">
          {text("Library type", "Τύπος Βιβλιοθήκης")}
          <select
            required={!uploadedLink}
            value={materialType}
            onChange={(event) => {
              setMaterialType(event.target.value as SourceMaterialType | "");
              setUploadedLink(null);
            }}
          >
            <option value="">{text("Choose type", "Επίλεξε τύπο")}</option>
            {sourceMaterialTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{getSourceMaterialTypeLabel(option.value, language)}</option>
            ))}
          </select>
        </label>
      ) : (
        <label className="field-label">
          {text("Structured type", "Τύπος Δομημένης Μελέτης")}
          <select
            required={!uploadedLink}
            value={structuredStudyType}
            onChange={(event) => {
              setStructuredStudyType(event.target.value as StructuredStudyType | "");
              setUploadedLink(null);
            }}
          >
            <option value="">{text("Choose type", "Επίλεξε τύπο")}</option>
            {structuredStudyTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{getStructuredStudyTypeLabel(option.value, language)}</option>
            ))}
          </select>
        </label>
      )}

      <label className="field-label">
        {text("Web link", "Σύνδεσμος")}
        <input
          required={!uploadedLink}
          type="url"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            setUploadedLink(null);
          }}
          placeholder="https://..."
        />
      </label>
      <p className="field-help">{text(
        `Only the name, type and link are saved in ${destinationLabel}.`,
        `Αποθηκεύονται μόνο το όνομα, ο τύπος και ο σύνδεσμος στη ${destinationLabel}.`,
      )}</p>
      <div className="button-row">
        <button className={uploadedLink ? "button success compact-square" : "button primary compact-square"} type={uploadedLink ? "button" : "submit"}>
          {uploadedLink ? text("Link added", "Προστέθηκε") : text("Add link", "Προσθήκη συνδέσμου")}
        </button>
        <button
          className={uploadedLink ? "button danger compact-square" : "button secondary compact-square"}
          disabled={!canRemove}
          onClick={() => void removeSelectionOrUpload()}
          type="button"
        >
          {uploadedLink ? text("Undo", "Αναίρεση") : text("Clear", "Καθαρισμός")}
        </button>
      </div>
    </form>
  );
}
