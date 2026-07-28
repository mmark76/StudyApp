import { type FormEvent, useRef, useState } from "react";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
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
  parseStoredStudyMaterials,
  STUDY_MATERIALS_SETTING_KEY,
  titleFromStudyMaterialUrl,
  type StudyMaterialLink,
} from "./studyMaterials";

export function CloudLinkForm({
  destination,
  savedLinks,
  existingLinks,
  onMessage,
}: {
  destination: MaterialDestination;
  savedLinks: readonly StudyMaterialLink[];
  existingLinks: readonly StudyMaterialLink[];
  onMessage: (message: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [materialType, setMaterialType] = useState<SourceMaterialType | "">("");
  const [structuredStudyType, setStructuredStudyType] = useState<StructuredStudyType | "">("");
  const [uploadedLink, setUploadedLink] = useState<StudyMaterialLink | null>(null);
  const lock = useRef(false);
  const canRemove = Boolean(uploadedLink)
    || url.trim().length > 0
    || materialType.length > 0
    || structuredStudyType.length > 0;

  function clearDraft() {
    setUrl("");
    setMaterialType("");
    setStructuredStudyType("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;

    if (destination === "library" && !isSourceMaterialType(materialType)) {
      onMessage("Choose a Library type before saving the link in this browser.");
      return;
    }
    if (destination === "structured-study" && !isStructuredStudyType(structuredStudyType)) {
      onMessage("Choose a Structured Study part before saving the link in this browser.");
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
        onMessage("This link has already been saved in this browser.");
        return;
      }

      await studyDatabase.settings.put({
        key: STUDY_MATERIALS_SETTING_KEY,
        value: [...savedLinks, item],
      });
      setUploadedLink(item);
      clearDraft();
      onMessage(
        destination === "structured-study"
          ? "The link was saved locally in Structured Study. The linked file remains in its external service."
          : "The link was saved locally in Library. The linked file remains in its external service.",
      );
    } catch {
      onMessage(
        destination === "structured-study"
          ? "Choose a Structured Study part, then use a valid web link."
          : "Choose a Library type, then use a valid web link.",
      );
    } finally {
      lock.current = false;
    }
  }

  async function removeSelectionOrUpload() {
    if (lock.current) return;

    if (!uploadedLink) {
      clearDraft();
      onMessage("The cloud link fields were cleared.");
      return;
    }

    lock.current = true;

    try {
      const currentSetting = await studyDatabase.settings.get(STUDY_MATERIALS_SETTING_KEY);
      const currentLinks = parseStoredStudyMaterials(currentSetting?.value);

      await studyDatabase.settings.put({
        key: STUDY_MATERIALS_SETTING_KEY,
        value: currentLinks.filter((link) => link.id !== uploadedLink.id),
      });
      onMessage(`Removed the saved link: ${uploadedLink.title}.`);
      setUploadedLink(null);
      clearDraft();
    } catch {
      onMessage("The saved link could not be removed.");
    } finally {
      lock.current = false;
    }
  }

  const destinationLabel = destination === "structured-study" ? "Structured Study" : "Library";

  return (
    <form className="material-form" onSubmit={(event) => void submit(event)}>
      {destination === "library" ? (
        <label className="field-label">
          Library type
          <select
            required={!uploadedLink}
            value={materialType}
            onChange={(event) => {
              setMaterialType(event.target.value as SourceMaterialType | "");
              setUploadedLink(null);
            }}
          >
            <option value="">Choose Library type</option>
            {sourceMaterialTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      ) : (
        <label className="field-label">
          Structured part
          <select
            required={!uploadedLink}
            value={structuredStudyType}
            onChange={(event) => {
              setStructuredStudyType(event.target.value as StructuredStudyType | "");
              setUploadedLink(null);
            }}
          >
            <option value="">Choose Structured part</option>
            {structuredStudyTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      )}

      <label className="field-label">
        Shared link
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
      <p className="field-help">The display name is created automatically from the URL. Only the generated name, type and link are saved in {destinationLabel}; the actual file remains in your cloud service.</p>
      <div className="button-row">
        <button
          className={uploadedLink ? "button success compact-square" : "button primary compact-square"}
          type={uploadedLink ? "button" : "submit"}
        >
          {uploadedLink ? "Link Added" : "Add link"}
        </button>
        <button
          className={uploadedLink ? "button danger compact-square" : "button secondary compact-square"}
          disabled={!canRemove}
          onClick={() => void removeSelectionOrUpload()}
          type="button"
        >
          {uploadedLink ? "Undo add" : "Clear"}
        </button>
      </div>
    </form>
  );
}
