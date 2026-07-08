import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { LocalStudyFile, StructuredStudyType } from "../../shared/types/models";
import {
  formatFileKind,
  formatFileSize,
  getStructuredStudyType,
  isSplitPdfFile,
  isStructuredStudyType,
  structuredStudyTypeOptions,
} from "../study-materials/localStudyFiles";
import { normalizeStudyMaterialTitle } from "../study-materials/studyMaterials";

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
        materialType,
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
      <button className="button primary compact-square" onClick={() => void savePlacement()} type="button">Save</button>
      {message ? <p className="field-help" role="status">{message}</p> : null}
    </div>
  );
}

export function StudyTheoryPage() {
  const localFiles = useLiveQuery(
    () => studyDatabase.studyFiles.orderBy("createdAt").reverse().toArray(),
    [],
  ) ?? [];
  const splitPdfFiles = useMemo(
    () => localFiles.filter(isSplitPdfFile),
    [localFiles],
  );
  const unclassifiedFiles = splitPdfFiles.filter((file) => getStructuredStudyType(file) === null);

  function openSplitPdf(fileId: string) {
    const file = splitPdfFiles.find((item) => item.id === fileId);
    if (!file) return;
    const blob = file.mimeType ? file.data.slice(0, file.data.size, file.mimeType) : file.data;
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Structured reading</p>
        <h2>Structured Study</h2>
        <p>Read and understand the same material through contents, chapters, sections, concepts, references and diagrams.</p>
      </header>

      <section className="content-panel" aria-label="Structured split PDF files">
        <p className="eyebrow">Structured source extracts</p>
        <h3>Split PDFs by type</h3>
        <p>PDF chunks created by Split PDF Tool appear in the matching Structured Study card below. You can correct the final name and type here.</p>
        {splitPdfFiles.length === 0 ? (
          <p className="inline-message">No split PDFs yet. Use Split PDF Tool to create chapter or section PDFs from a source file.</p>
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
                <button className="button secondary compact-square" onClick={() => openSplitPdf(file.id)} type="button">View</button>
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
          const filesForType = splitPdfFiles.filter((file) => getStructuredStudyType(file) === item.materialType);

          return (
            <article className="learning-stage-card" id={item.id} key={item.title} tabIndex={-1}>
              <span className="stage-number" aria-hidden="true">{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <Link className="button secondary" to={`/study/theory#${item.id}`}>Read</Link>
              {filesForType.length > 0 ? (
                <ul className="local-file-list">
                  {filesForType.map((file) => (
                    <li className="local-file-row" key={file.id}>
                      <div>
                        <strong>{file.title}</strong>
                        <span>{formatFileKind(file.fileKind)} · {formatFileSize(file.size)} · {file.fileName}</span>
                        <StructuredFilePlacementEditor file={file} />
                      </div>
                      <button className="button secondary compact-square" onClick={() => openSplitPdf(file.id)} type="button">View</button>
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
