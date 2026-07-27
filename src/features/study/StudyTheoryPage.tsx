import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { LocalStudyFile, StructuredStudyType } from "../../shared/types/models";
import {
  formatFileKind,
  formatFileSize,
  getStructuredStudyType,
  isSplitPdfFile,
  isStructuredStudyFile,
  isStructuredStudyType,
  structuredStudyTypeOptions,
} from "../study-materials/localStudyFiles";
import { MaterialUploadPanel } from "../study-materials/MaterialUploadPanel";
import {
  builtInStudyMaterials,
  normalizeStudyMaterialTitle,
  parseStoredStudyMaterials,
  STUDY_MATERIALS_SETTING_KEY,
  type StudyMaterialLink,
} from "../study-materials/studyMaterials";

const sourceStructure = [
  {
    id: "contents",
    materialType: "contents",
    title: "Contents",
    description: "Read the table of contents and the high-level map of the material.",
  },
  {
    id: "chapters",
    materialType: "chapter",
    title: "Chapters",
    description: "Read the material as major learning blocks inside a book, paper or PDF.",
  },
  {
    id: "sections-paragraphs",
    materialType: "section",
    title: "Sections / Paragraphs",
    description: "Read smaller parts inside chapters for focused study and review.",
  },
  {
    id: "key-concepts",
    materialType: "key-concept",
    title: "Key Concepts",
    description: "Read the important ideas, definitions and principles that need to be understood.",
  },
  {
    id: "bibliography-references",
    materialType: "bibliography-reference",
    title: "Bibliography / References",
    description: "Read references and source trails connected to the material they support.",
  },
  {
    id: "images-diagrams",
    materialType: "image-diagram",
    title: "Images / Diagrams",
    description: "Read visual evidence, figures, diagrams, processes and relationships.",
  },
] as const satisfies readonly {
  id: string;
  materialType: StructuredStudyType;
  title: string;
  description: string;
}[];

function getLinkStructuredStudyType(link: StudyMaterialLink): StructuredStudyType | null {
  return isStructuredStudyType(link.structuredStudyType) ? link.structuredStudyType : null;
}

function StructuredFilePlacementEditor({ file }: { file: LocalStudyFile }) {
  const [title, setTitle] = useState(file.title);
  const [materialType, setMaterialType] = useState<StructuredStudyType | "">(getStructuredStudyType(file) ?? "");
  const [message, setMessage] = useState("");

  async function savePlacement() {
    if (!isStructuredStudyType(materialType)) {
      setMessage("Choose a structured type.");
      return;
    }

    try {
      await studyDatabase.studyFiles.update(file.id, {
        title: normalizeStudyMaterialTitle(title),
        ...(isSplitPdfFile(file) ? { materialType } : { structuredStudyType: materialType }),
      });
      setMessage("Saved.");
    } catch {
      setMessage("Could not save placement.");
    }
  }

  return (
    <div className="library-grid" style={{ alignItems: "end" }}>
      <label className="field-label">
        Name
        <input maxLength={160} type="text" value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label className="field-label">
        Type
        <select value={materialType} onChange={(event) => setMaterialType(event.target.value as StructuredStudyType | "")}>
          <option value="">Unclassified</option>
          {structuredStudyTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <button className="button primary compact-square" onClick={() => void savePlacement()} type="button">Change name or type</button>
      {message ? <p className="field-help" role="status">{message}</p> : null}
    </div>
  );
}

export function StudyTheoryPage() {
  const localFiles = useLiveQuery(
    () => studyDatabase.studyFiles.orderBy("createdAt").reverse().toArray(),
    [],
  ) ?? [];
  const setting = useLiveQuery(
    () => studyDatabase.settings.get(STUDY_MATERIALS_SETTING_KEY),
    [],
  );
  const savedLinks = useMemo(
    () => parseStoredStudyMaterials(setting?.value),
    [setting?.value],
  );
  const allLinks = [...builtInStudyMaterials, ...savedLinks];
  const structuredFiles = useMemo(
    () => localFiles.filter(isStructuredStudyFile),
    [localFiles],
  );
  const structuredLinks = allLinks.filter((link) => getLinkStructuredStudyType(link) !== null);
  const unclassifiedFiles = structuredFiles.filter(
    (file) => isSplitPdfFile(file) && getStructuredStudyType(file) === null,
  );
  const [message, setMessage] = useState("");

  function openStructuredFile(fileId: string) {
    const file = structuredFiles.find((item) => item.id === fileId);
    if (!file) return;
    const blob = file.mimeType ? file.data.slice(0, file.data.size, file.mimeType) : file.data;
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function removeStructuredFile(file: LocalStudyFile) {
    const splitPdf = isSplitPdfFile(file);
    const structuredOnly = file.fileSource === "structured-material";
    const deleteWholeFile = splitPdf || structuredOnly;
    const confirmed = window.confirm(
      deleteWholeFile
        ? `Remove "${file.title}" from StudyApp? This cannot be undone.`
        : `Remove "${file.title}" from Structured Study? The original file will remain in Library.`,
    );
    if (!confirmed) return;

    try {
      if (deleteWholeFile) {
        await studyDatabase.studyFiles.delete(file.id);
        setMessage(`Removed ${file.title}.`);
      } else {
        await studyDatabase.studyFiles.update(file.id, { structuredStudyType: null });
        setMessage(`Removed ${file.title} from Structured Study. The original remains in Library.`);
      }
    } catch {
      setMessage("The file could not be removed from Structured Study.");
    }
  }

  async function removeStructuredLink(link: StudyMaterialLink) {
    const confirmed = window.confirm(
      `Remove "${link.title}" from StudyApp? The original cloud file will not be deleted.`,
    );
    if (!confirmed) return;

    try {
      const currentSetting = await studyDatabase.settings.get(STUDY_MATERIALS_SETTING_KEY);
      const currentLinks = parseStoredStudyMaterials(currentSetting?.value);
      await studyDatabase.settings.put({
        key: STUDY_MATERIALS_SETTING_KEY,
        value: currentLinks.filter((item) => item.id !== link.id),
      });
      setMessage(`Removed ${link.title} from Structured Study.`);
    } catch {
      setMessage("The cloud link could not be removed from Structured Study.");
    }
  }

  const hasStructuredMaterial = structuredFiles.length > 0 || structuredLinks.length > 0;

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Structured reading</p>
        <h2>Structured Study</h2>
        <p>Read and understand the same material through contents, chapters, sections, concepts, references and diagrams.</p>
      </header>

      <MaterialUploadPanel
        destination="structured-study"
        files={localFiles}
        savedLinks={savedLinks}
        existingLinks={allLinks}
        onMessage={setMessage}
      />

      {message ? <p className="inline-message status-banner" role="status" aria-live="polite">{message}</p> : null}

      <section className="content-panel" aria-label="Structured study material">
        <p className="eyebrow">Structured source material</p>
        <h3>Files and links by structured type</h3>
        <p>Upload material once above. Local files, cloud links and PDF chunks then appear in the matching Structured Study card below.</p>
        {!hasStructuredMaterial ? (
          <p className="inline-message">No structured material yet. Upload a file or link above, or use Split PDF Tool to create chapter or section PDFs.</p>
        ) : null}
      </section>

      {unclassifiedFiles.length > 0 ? (
        <section className="content-panel" id="unclassified-structured-study" tabIndex={-1}>
          <p className="eyebrow">Needs placement</p>
          <h3>Unclassified split PDFs</h3>
          <p>These split PDFs have no structured type yet. Choose the final Structured Study placement yourself.</p>
          <ul className="local-file-list">
            {unclassifiedFiles.map((file) => (
              <li className="local-file-row" key={file.id}>
                <div>
                  <strong>{file.title}</strong>
                  <span>{formatFileKind(file.fileKind)} · {formatFileSize(file.size)} · {file.fileName}</span>
                  <StructuredFilePlacementEditor file={file} />
                </div>
                <div className="local-file-actions">
                  <button className="button secondary compact-square" onClick={() => openStructuredFile(file.id)} type="button">View</button>
                  <button className="button danger compact-square" onClick={() => void removeStructuredFile(file)} type="button">Remove</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section
        className="learning-stage-grid"
        style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
        aria-label="Structured Study reading levels"
      >
        {sourceStructure.map((item, index) => {
          const filesForType = structuredFiles.filter((file) => getStructuredStudyType(file) === item.materialType);
          const linksForType = structuredLinks.filter((link) => getLinkStructuredStudyType(link) === item.materialType);
          const hasItems = filesForType.length > 0 || linksForType.length > 0;

          return (
            <article className="learning-stage-card" id={item.id} key={item.title} tabIndex={-1}>
              <span className="stage-number" aria-hidden="true">{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              {hasItems ? (
                <ul className="local-file-list">
                  {filesForType.map((file) => (
                    <li className="local-file-row" key={file.id}>
                      <div>
                        <strong>{file.title}</strong>
                        <span>{formatFileKind(file.fileKind)} · {formatFileSize(file.size)} · {file.fileName}</span>
                        <StructuredFilePlacementEditor file={file} />
                      </div>
                      <div className="local-file-actions">
                        <button className="button secondary compact-square" onClick={() => openStructuredFile(file.id)} type="button">View</button>
                        <button className="button danger compact-square" onClick={() => void removeStructuredFile(file)} type="button">Remove</button>
                      </div>
                    </li>
                  ))}
                  {linksForType.map((link) => (
                    <li className="local-file-row" key={link.id}>
                      <div>
                        <strong>{link.title}</strong>
                        <span>{link.url}</span>
                      </div>
                      <div className="local-file-actions">
                        <a className="button secondary compact-square" href={link.url} rel="noopener noreferrer" target="_blank">Open</a>
                        <button className="button danger compact-square" onClick={() => void removeStructuredLink(link)} type="button">Remove</button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="field-help">No {item.title.toLowerCase()} saved yet.</p>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
