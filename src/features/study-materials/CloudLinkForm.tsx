import { type FormEvent, useRef, useState } from "react";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import { createId } from "../../shared/utils/id";
import {
  normalizeStudyMaterialTitle,
  normalizeStudyMaterialUrl,
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
  const lock = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;

    try {
      const item = {
        id: createId("material"),
        title: normalizeStudyMaterialTitle(title),
        url: normalizeStudyMaterialUrl(url),
      };
      if (existingLinks.some((link) => link.url === item.url)) {
        onMessage("This link has already been saved.");
        return;
      }

      await studyDatabase.settings.put({
        key: STUDY_MATERIALS_SETTING_KEY,
        value: [...savedLinks, item],
      });
      setTitle("");
      setUrl("");
      onMessage("The cloud link was saved.");
    } catch {
      onMessage("Enter a name and a valid web link.");
    } finally {
      lock.current = false;
    }
  }

  return (
    <form className="material-form" onSubmit={(event) => void submit(event)}>
      <label className="field-label">
        Shared link
        <input
          required
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://..."
        />
      </label>
      <label className="field-label">
        Display name
        <input
          required
          maxLength={160}
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Example: Cognitive Psychology textbook"
        />
      </label>
      <p className="field-help">This button saves only the title and link. The actual file stays in your cloud service.</p>
      <button className="button primary" type="submit">Save cloud link</button>
    </form>
  );
}
