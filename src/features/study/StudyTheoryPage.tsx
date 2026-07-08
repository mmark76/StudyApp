import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import { formatFileKind, formatFileSize, isSplitPdfFile } from "../study-materials/localStudyFiles";

const sourceStructure = [
  {
    id: "contents",
    title: "Contents",
    description: "Read the table of contents and the high-level map of the material.",
  },
  {
    id: "chapters",
    title: "Chapters",
    description: "Read the material as major learning blocks inside a book, paper or PDF.",
  },
  {
    id: "sections-paragraphs",
    title: "Sections / Paragraphs",
    description: "Read smaller parts inside chapters for focused study and review.",
  },
  {
    id: "key-concepts",
    title: "Key Concepts",
    description: "Read the important ideas, definitions and principles that need to be understood.",
  },
  {
    id: "bibliography-references",
    title: "Bibliography / References",
    description: "Read references and source trails connected to the material they support.",
  },
  {
    id: "images-diagrams",
    title: "Images / Diagrams",
    description: "Read visual evidence, figures, diagrams, processes and relationships.",
  },
] as const;

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
        <h3>Split PDFs</h3>
        <p>PDF chunks created by Split PDF Tool appear here as structured chapters, sections or source extracts. Original source files remain in Library from Source.</p>

        {splitPdfFiles.length === 0 ? (
          <p className="inline-message">No split PDFs yet. Use Split PDF Tool to create chapter or section PDFs from a source file.</p>
        ) : (
          <ul className="local-file-list">
            {splitPdfFiles.map((file) => (
              <li className="local-file-row" key={file.id}>
                <div>
                  <strong>{file.title}</strong>
                  <span>{formatFileKind(file.fileKind)} · {formatFileSize(file.size)} · {file.fileName}</span>
                </div>
                <button className="button secondary compact-square" onClick={() => openSplitPdf(file.id)} type="button">View</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        className="learning-stage-grid"
        style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
        aria-label="Structured Study reading levels"
      >
        {sourceStructure.map((item, index) => (
          <article className="learning-stage-card" id={item.id} key={item.title} tabIndex={-1}>
            <span className="stage-number" aria-hidden="true">{index + 1}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <Link className="button secondary" to={`/study/theory#${item.id}`}>Read</Link>
          </article>
        ))}
      </section>
    </div>
  );
}
