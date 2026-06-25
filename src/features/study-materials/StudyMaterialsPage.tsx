import { type FormEvent, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import { createId } from "../../shared/utils/id";
import { builtInStudyMaterials, normalizeStudyMaterialTitle, normalizeStudyMaterialUrl, parseStoredStudyMaterials, STUDY_MATERIALS_SETTING_KEY } from "./studyMaterials";

export function StudyMaterialsPage() {
  const setting = useLiveQuery(() => studyDatabase.settings.get(STUDY_MATERIALS_SETTING_KEY), []);
  const customMaterials = useMemo(() => parseStoredStudyMaterials(setting?.value), [setting?.value]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const lock = useRef(false);

  async function addMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setMessage("");
    try {
      const item = { id: createId("material"), title: normalizeStudyMaterialTitle(title), url: normalizeStudyMaterialUrl(url) };
      const existing = [...builtInStudyMaterials, ...customMaterials];
      if (existing.some((material) => material.url === item.url)) throw new Error("Duplicate");
      await studyDatabase.settings.put({ key: STUDY_MATERIALS_SETTING_KEY, value: [...customMaterials, item] });
      setTitle(""); setUrl(""); setMessage("The study material was added.");
    } catch {
      setMessage("Enter a unique name and a valid HTTP or HTTPS link.");
    } finally {
      lock.current = false;
    }
  }

  async function removeMaterial(id: string) {
    await studyDatabase.settings.put({ key: STUDY_MATERIALS_SETTING_KEY, value: customMaterials.filter((item) => item.id !== id) });
    setMessage("The study material was deleted.");
  }

  const materials = [...builtInStudyMaterials, ...customMaterials];
  return (
    <div className="stack-lg">
      <header className="page-heading"><p className="eyebrow">External resources</p><h2>Study materials</h2><p>Add links to books, notes, or other resources.</p></header>
      <section className="content-panel">
        <h3>Links</h3>
        {materials.length === 0 ? <p>There are no links yet.</p> : <ul className="material-link-list">{materials.map((material) => <li className="material-link-row" key={material.id}><a className="text-link" href={material.url} target="_blank" rel="noopener noreferrer">{material.title} ↗</a>{customMaterials.some((item) => item.id === material.id) ? <button className="button danger compact" onClick={() => void removeMaterial(material.id)}>Delete</button> : null}</li>)}</ul>}
      </section>
      <section className="content-panel">
        <h3>Add new material</h3>
        <form className="material-form" onSubmit={(event) => void addMaterial(event)}>
          <label className="field-label">Name<input required maxLength={160} type="text" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <label className="field-label">Link<input required type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." /></label>
          <button className="button primary" type="submit">Add link</button>
        </form>
        <p className="inline-message" role="status">{message}</p>
      </section>
    </div>
  );
}
