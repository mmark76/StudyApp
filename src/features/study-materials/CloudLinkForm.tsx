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
import {
  normalizeStudyMaterialUrl,
  parseStoredStudyMaterials,
  STUDY_MATERIALS_SETTING_KEY,
  titleFromStudyMaterialUrl,
  type StudyMaterialLink,
} from "./studyMaterials";

type UploadDestination = "" | "library" | "structured-study";

export function CloudLinkForm({
  savedLinks,
  existingLinks,
  onMessage,
}: {
  savedLinks: readonly StudyMaterialLink[];
  existingLinks: readonly StudyMaterialLink[];
  onMessage: (message: string) => void;
}) {
  const [destination, setDestination] = useState<UploadDestination>("");
  const [url, setUrl] = useState("");
  const [materialType, setMaterialType] = useState<SourceMaterialType | "">("");
  const [structuredStudyType, setStructuredStudyType] = useState<StructuredStudyType | "">("");
  const [uploadedLink, setUploadedLink] = useState<StudyMaterialLink | null>(null);
  const lock = useRef(false);
  const canRemove = Boolean(uploadedLink)
    || url.trim().length > 0
    || destination.length > 0
    || materialType.length > 0
    || structuredStudyType.length > 0;

  function clearDraft() {
    setDestination("");
    setUrl("");
    setMaterialType("");
    setStructuredStudyType("");
  }

  function chooseDestination(value: UploadDestination) {
    setDestination(value);
    setMaterialType("");
    setStructuredStudyType("");
    setUploadedLink(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;

    if (destination === "library" && !isSourceMaterialType(materialType)) {
      onMessage("Choose a Library type before uploading the link.");
      return;
    }
    if (destination === "structured-study" && !isStructuredStudyType(structuredStudyType)) {
      onMessage("Choose a Structured Study part before uploading the link.");
      return;
    }
    if (!destination) {
      onMessage("Choose whether the link belongs in Library or Structured Study.");
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
        onMessage("This link has already been uploaded.");
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
          ? "The cloud link was uploaded to Structured Study."
          : "The cloud link was uploaded to Library.",
      );
    } catch {
      onMessage("Choose a destination and type, then use a valid web link.");
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
      onMessage(`Removed uploaded link: ${uploadedLink.title}.`);
      setUploadedLink(null);
      clearDraft();
    } catch {
      onMessage("The uploaded link could not be removed.");
    } finally {
      lock.current = false;
    }
  }

  return (
    <form className="material-form" onSubmit={(event) => void submit(event)}>
      <label className="field-label">
        Where should this material be saved?
        <select
          required={!uploadedLink}
          value={destination}
          onChange={(event) => chooseDestination(event.target.value as UploadDestination)}
        >
          <option value="">Choose destination</option>
          <option value="library">Library</option>
          <option value="structured-study">Structured Study</option>
        </select>
      </label>

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
      ) : null}

      {destination === "structured-study" ? (
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
      ) : null}

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
      <p className="field-help">The display name is created automatically from the URL. Only the generated name, destination, type and link are saved; the actual file remains in your cloud service.</p>
      <div className="button-row">
        <button
          className={uploadedLink ? "button success compact-square" : "button primary compact-square"}
          type={uploadedLink ? "button" : "submit"}
        >
          {uploadedLink ? "Uploaded" : "Upload"}
        </button>
        <button
          className={uploadedLink ? "button danger compact-square" : "button secondary compact-square"}
          disabled={!canRemove}
          onClick={() => void removeSelectionOrUpload()}
          type="button"
        >
          {uploadedLink ? "Undo upload" : "Clear"}
        </button>
      </div>
    </form>
  );
}
