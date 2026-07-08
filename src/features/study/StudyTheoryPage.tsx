import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { StructuredStudyType } from "../../shared/types/models";
import {
  formatFileKind,
  formatFileSize,
  getStructuredStudyType,
  isSplitPdfFile,
} from "../study-materials/localStudyFiles";

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

export function StudyTheoryPage() {
  const localFiles = useLiveQuery(
    () => studyDatabase.studyFiles.orderBy("createdAt").reverse().toArray(),
    [],
  ) ?? [];
  const splitPdfFiles = useMemo(
    () => localFiles.filter(isSplitPdfFile),
    [localFiles],
  );

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
        <p>PDF chunks created by Split PDF Tool appear in the matching Structured Study card below. Original source files remain in Library from Source.</p>
        {splitPdfFiles.length === 0 ? (
          <p className="inline-message">No split PDFs yet. Use Split PDF Tool to create chapter or section PDFs from a source file.</p>
        ) : null}
      </section>

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
