import { type FormEvent, useRef, useState } from "react";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { SourceMaterialType } from "../../shared/types/models";
import { createId } from "../../shared/utils/id";
import { sourceMaterialTypeOptions } from "./localStudyFiles";
import {
  normalizeStudyMaterialTitle,
  normalizeStudyMaterialUrl,
  parseStoredStudyMaterials,
  STUDY_MATERIALS_SETTING_KEY,
  type StudyMaterialLink,
} from "./studyMaterials";

export function CloudLinkForm({
  savedLinks,
  existingLinks,
  onMessage,
}: {
  savedLinks: readonly StudyMaterialLink[];
  existingLinks: readonly StudyMaterialLink[];
  onMessage: (message: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [materialType, setMaterialType] = useState<SourceMaterialType>("book");
  const [uploadedLink, setUploadedLink] = useState<StudyMaterialLink | null>(null);
  const lock = useRef(false);
  const canRemove = Boolean(uploadedLink) || title.trim().length > 0 || url.trim().length > 0;

  function clearDraft() {
    setTitle("");
    setUrl("");
    setMaterialType("book");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;

    try {
      const item: StudyMaterialLink = {
        id: createId("material"),
        title: normalizeStudyMaterialTitle(title),
        url: normalizeStudyMaterialUrl(url),
        materialType,
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
      onMessage("The cloud link was uploaded to the app.");
    } catch {
      onMessage("Enter a name and a valid web link.");
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
      <label className="field-label">
        Display name
        <input
          required={!uploadedLink}
          maxLength={160}
          type="text"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setUploadedLink(null);
          }}
          placeholder="Example: Cognitive Psychology textbook"
        />
      </label>
      <label className="field-label">
        Type
        <select
          value={materialType}
          onChange={(event) => {
            setMaterialType(event.target.value as SourceMaterialType);
            setUploadedLink(null);
          }}
        >
          {sourceMaterialTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <p className="field-help">Upload saves only the title, type and link. The actual file stays in your cloud service.</p>
      <div className="button-row">
        <button
          className={uploadedLink ? "button success compact-square" : "button primary compact-square"}
          type={uploadedLink ? "button" : "submit"}
        >
          {uploadedLink ? "Uploaded" : "Upload"}
        </button>
        <button className="button danger compact-square" disabled={!canRemove} onClick={() => void removeSelectionOrUpload()} type="button">
          Remove
        </button>
      </div>
    </form>
  );
}
