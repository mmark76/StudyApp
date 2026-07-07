import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import { formatFileKind, formatFileSize } from "../study-materials/localStudyFiles";
import {
  builtInStudyMaterials,
  parseStoredStudyMaterials,
  STUDY_MATERIALS_SETTING_KEY,
} from "../study-materials/studyMaterials";

const libraryCategories = [
  {
    id: "books",
    title: "Books",
    description: "Read textbooks, manuals, chapters and longer reference works from the original source.",
  },
  {
    id: "articles",
    title: "Articles",
    description: "Read web articles, magazine pieces and focused explanatory resources from the source.",
  },
  {
    id: "papers",
    title: "Papers",
    description: "Read research papers, reports and evidence-based material from the original document.",
  },
  {
    id: "outsource-notes",
    title: "Outsource Notes",
    description: "Read external lecture notes, uploaded notes, PDFs or source files used as study material.",
  },
  {
    id: "my-notes",
    title: "My Notes",
    description: "Read your own important points, observations and study notes from the material you have structured.",
  },
  {
    id: "summaries",
    title: "Summaries",
    description: "Read condensed chapter summaries, learning objectives and key terms before practice.",
  },
] as const;

export function LibraryPage() {
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
  const sourceLinks = [...builtInStudyMaterials, ...savedLinks];
  const hasSavedSourceMaterial = localFiles.length > 0 || sourceLinks.length > 0;

  function openLocalFile(fileId: string) {
    const file = localFiles.find((item) => item.id === fileId);
    if (!file) return;
    const blob = file.mimeType ? file.data.slice(0, file.data.size, file.mimeType) : file.data;
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Read from source</p>
        <h2>Library from Source</h2>
        <p>Read primary and source material only: books, articles, papers, outsource notes, personal notes and summaries.</p>
      </header>

      <section className="content-panel" aria-label="All uploaded source material">
        <p className="eyebrow">All source material</p>
        <h3>All uploaded files</h3>
        <p>This is the complete read-only list of files and source links saved in StudyApp. Add and remove actions stay in Add / Remove Material.</p>

        {!hasSavedSourceMaterial ? (
          <p className="inline-message">No uploaded files or saved source links yet.</p>
        ) : null}

        {localFiles.length > 0 ? (
          <div className="stack-md">
            <h4>Files saved in StudyApp</h4>
            <ul className="local-file-list">
              {localFiles.map((file) => (
                <li className="local-file-row" key={file.id}>
                  <div>
                    <strong>{file.title}</strong>
                    <span>{formatFileKind(file.fileKind)} · {formatFileSize(file.size)} · {file.fileName}</span>
                  </div>
                  <button className="button secondary compact-square" onClick={() => openLocalFile(file.id)} type="button">Open</button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {sourceLinks.length > 0 ? (
          <div className="stack-md">
            <h4>Saved cloud links</h4>
            <ul className="local-file-list">
              {sourceLinks.map((link) => (
                <li className="local-file-row" key={link.id}>
                  <div>
                    <strong>{link.title}</strong>
                    <span>{link.url}</span>
                  </div>
                  <a className="button secondary compact-square" href={link.url} rel="noopener noreferrer" target="_blank">Open</a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="learning-stage-grid" aria-label="Library source reading categories">
        {libraryCategories.map((category, index) => (
          <article className="learning-stage-card" id={category.id} key={category.title} tabIndex={-1}>
            <span className="stage-number" aria-hidden="true">{index + 1}</span>
            <h3>{category.title}</h3>
            <p>{category.description}</p>
            <Link className="button secondary" to={`/library#${category.id}`}>Read</Link>
          </article>
        ))}
      </section>

      <section className="content-panel">
        <p className="eyebrow">Boundary</p>
        <h3>What belongs here?</h3>
        <p>This area is only for reading from source. Adding and removing material is handled separately in Add / Remove Material.</p>
      </section>
    </div>
  );
}
