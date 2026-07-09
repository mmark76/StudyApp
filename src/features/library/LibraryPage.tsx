import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { LocalStudyFile, SourceMaterialType } from "../../shared/types/models";
import {
  findRelatedSplitPdfFiles,
  getLocalFileDeletionIds,
  type LocalFileDeletionChoice,
} from "./localFileDeletion";
import {
  formatFileKind,
  formatFileSize,
  formatMaterialTypeLabel,
  getSourceMaterialType,
  isSourceMaterialFile,
  isSourceMaterialType,
  sourceMaterialTypeOptions,
} from "../study-materials/localStudyFiles";
import {
  builtInStudyMaterials,
  normalizeStudyMaterialTitle,
  parseStoredStudyMaterials,
  STUDY_MATERIALS_SETTING_KEY,
  type StudyMaterialLink,
} from "../study-materials/studyMaterials";

const libraryCategories = [
  {
    id: "books",
    materialType: "book",
    title: "Books",
    description: "Read textbooks, manuals, chapters and longer reference works from the original source.",
  },
  {
    id: "articles",
    materialType: "article",
    title: "Articles",
    description: "Read web articles, magazine pieces and focused explanatory resources from the source.",
  },
  {
    id: "papers",
    materialType: "paper",
    title: "Papers",
    description: "Read research papers, reports and evidence-based material from the original document.",
  },
  {
    id: "outsource-notes",
    materialType: "outsource-note",
    title: "Outsource Notes",
    description: "Read external lecture notes, uploaded notes, PDFs or source files used as study material.",
  },
  {
    id: "my-notes",
    materialType: "my-note",
    title: "My Notes",
    description: "Read your own important points, observations and study notes from the material you have structured.",
  },
  {
    id: "summaries",
    materialType: "summary",
    title: "Summaries",
    description: "Read condensed chapter summaries, learning objectives and key terms before practice.",
  },
] as const satisfies readonly {
  id: string;
  materialType: SourceMaterialType;
  title: string;
  description: string;
}[];

function getLinkMaterialType(link: StudyMaterialLink): SourceMaterialType | null {
  return link.materialType ?? null;
}

function SourceFilePlacementEditor({ file }: { file: LocalStudyFile }) {
  const [title, setTitle] = useState(file.title);
  const [materialType, setMaterialType] = useState<SourceMaterialType | "">(getSourceMaterialType(file) ?? "");
  const [message, setMessage] = useState("");

  async function savePlacement() {
    if (!isSourceMaterialType(materialType)) {
      setMessage("Choose a source type.");
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
        <select value={materialType} onChange={(event) => setMaterialType(event.target.value as SourceMaterialType | "")}>
          <option value="">Unclassified</option>
          {sourceMaterialTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <button className="button primary compact-square" onClick={() => void savePlacement()} type="button">Save</button>
      {message ? <p className="field-help" role="status">{message}</p> : null}
    </div>
  );
}

function SourceLinkPlacementEditor({
  link,
  savedLinks,
}: {
  link: StudyMaterialLink;
  savedLinks: readonly StudyMaterialLink[];
}) {
  const [title, setTitle] = useState(link.title);
  const [materialType, setMaterialType] = useState<SourceMaterialType | "">(getLinkMaterialType(link) ?? "");
  const [message, setMessage] = useState("");

  async function savePlacement() {
    if (!isSourceMaterialType(materialType)) {
      setMessage("Choose a source type.");
      return;
    }

    try {
      const setting = await studyDatabase.settings.get(STUDY_MATERIALS_SETTING_KEY);
      const currentLinks = parseStoredStudyMaterials(setting?.value);
      const sourceLinks = currentLinks.length > 0 ? currentLinks : savedLinks;
      await studyDatabase.settings.put({
        key: STUDY_MATERIALS_SETTING_KEY,
        value: sourceLinks.map((item) => (
          item.id === link.id ? { ...item, title: normalizeStudyMaterialTitle(title), materialType } : item
        )),
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
        <select value={materialType} onChange={(event) => setMaterialType(event.target.value as SourceMaterialType | "")}>
          <option value="">Unclassified</option>
          {sourceMaterialTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <button className="button primary compact-square" onClick={() => void savePlacement()} type="button">Save</button>
      {message ? <p className="field-help" role="status">{message}</p> : null}
    </div>
  );
}

export function LibraryPage() {
  const allLocalFiles = useLiveQuery(
    () => studyDatabase.studyFiles.orderBy("createdAt").reverse().toArray(),
    [],
  ) ?? [];
  const localFiles = useMemo(
    () => allLocalFiles.filter(isSourceMaterialFile),
    [allLocalFiles],
  );
  const setting = useLiveQuery(
    () => studyDatabase.settings.get(STUDY_MATERIALS_SETTING_KEY),
    [],
  );
  const savedLinks = useMemo(
    () => parseStoredStudyMaterials(setting?.value),
    [setting?.value],
  );
  const [deleteMessage, setDeleteMessage] = useState("");
  const sourceLinks = [...builtInStudyMaterials, ...savedLinks];
  const savedLinkIds = new Set(savedLinks.map((link) => link.id));
  const unclassifiedFiles = localFiles.filter((file) => getSourceMaterialType(file) === null);
  const unclassifiedLinks = sourceLinks.filter((link) => getLinkMaterialType(link) === null);
  const hasSavedSourceMaterial = localFiles.length > 0 || sourceLinks.length > 0;

  function openLocalFile(fileId: string) {
    const file = localFiles.find((item) => item.id === fileId);
    if (!file) return;
    const blob = file.mimeType ? file.data.slice(0, file.data.size, file.mimeType) : file.data;
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function chooseDeletionForRelatedSplitPdfs(file: LocalStudyFile, relatedSplitPdfs: readonly LocalStudyFile[]): LocalFileDeletionChoice {
    const splitList = relatedSplitPdfs.map((item) => `- ${item.title}`).join("\n");
    const response = window.prompt(
      [
        `"${file.title}" has ${relatedSplitPdfs.length} related split PDF${relatedSplitPdfs.length === 1 ? "" : "s"}.`,
        "Type DELETE ALL to delete the source file and the related split PDFs.",
        "Type KEEP SPLITS to delete only the source file and keep the split PDFs in Structured Study without the original source file.",
        "Press Cancel to keep everything.",
        "",
        splitList,
      ].join("\n"),
    );
    if (response === null) return "cancel";

    const normalized = response.trim().toLocaleLowerCase();
    if (normalized === "delete all") return "delete-source-and-splits";
    if (normalized === "keep splits") return "delete-source-only";

    window.alert("Nothing was deleted. Type DELETE ALL, KEEP SPLITS, or press Cancel.");
    return "cancel";
  }

  async function deleteLocalFile(fileId: string) {
    const file = localFiles.find((item) => item.id === fileId);
    if (!file) return;
    const relatedSplitPdfs = findRelatedSplitPdfFiles(fileId, allLocalFiles);

    if (relatedSplitPdfs.length === 0) {
      const shouldDelete = window.confirm(`Delete "${file.title}" from StudyApp? This cannot be undone.`);
      if (!shouldDelete) return;
      await studyDatabase.studyFiles.delete(fileId);
      return;
    }

    const choice = chooseDeletionForRelatedSplitPdfs(file, relatedSplitPdfs);
    const deletionIds = getLocalFileDeletionIds(fileId, relatedSplitPdfs, choice);
    if (deletionIds.length === 0) {
      setDeleteMessage("Nothing was deleted.");
      return;
    }

    await studyDatabase.transaction("rw", studyDatabase.studyFiles, async () => {
      await studyDatabase.studyFiles.bulkDelete(deletionIds);
    });

    setDeleteMessage(
      choice === "delete-source-and-splits"
        ? `Deleted "${file.title}" and ${relatedSplitPdfs.length} related split PDF${relatedSplitPdfs.length === 1 ? "" : "s"}.`
        : `Deleted "${file.title}". ${relatedSplitPdfs.length} split PDF${relatedSplitPdfs.length === 1 ? "" : "s"} kept in Structured Study without the original source file by your choice.`,
    );
  }

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Read from source</p>
        <h2>Library</h2>
        <p>Read primary and source material only: books, articles, papers, outsource notes, personal notes and summaries.</p>
      </header>

      <section className="content-panel" aria-label="All uploaded source material">
        <p className="eyebrow">All source material</p>
        <h3>All uploaded files</h3>
        <p>This is the complete read-only list of original files and source links saved in StudyApp. Split PDFs appear in Structured Study.</p>

        {!hasSavedSourceMaterial ? (
          <p className="inline-message">No uploaded files or saved source links yet.</p>
        ) : null}

        {localFiles.length > 0 ? (
          <div className="stack-md">
            <h4>Files saved in StudyApp</h4>
            {deleteMessage ? <p className="inline-message status-banner" role="status">{deleteMessage}</p> : null}
            <ul className="local-file-list">
              {localFiles.map((file) => (
                <li className="local-file-row" key={file.id}>
                  <div>
                    <strong>{file.title}</strong>
                    <span>{formatMaterialTypeLabel(getSourceMaterialType(file))} · {formatFileKind(file.fileKind)} · {formatFileSize(file.size)} · {file.fileName}</span>
                    <SourceFilePlacementEditor file={file} />
                  </div>
                  <div className="local-file-actions">
                    <button className="button secondary compact-square" onClick={() => openLocalFile(file.id)} type="button">View</button>
                    <button className="button danger compact-square" onClick={() => void deleteLocalFile(file.id)} type="button">Delete</button>
                  </div>
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
                    <span>{formatMaterialTypeLabel(getLinkMaterialType(link))} · {link.url}</span>
                    {savedLinkIds.has(link.id) ? <SourceLinkPlacementEditor link={link} savedLinks={savedLinks} /> : null}
                  </div>
                  <a className="button secondary compact-square" href={link.url} rel="noopener noreferrer" target="_blank">Open</a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {(unclassifiedFiles.length > 0 || unclassifiedLinks.length > 0) ? (
        <section className="content-panel" id="unclassified-source-material" tabIndex={-1}>
          <p className="eyebrow">Needs placement</p>
          <h3>Unclassified source material</h3>
          <p>These items have no type yet. Choose the final Library placement yourself.</p>
          <ul className="local-file-list">
            {unclassifiedFiles.map((file) => (
              <li className="local-file-row" key={file.id}>
                <div>
                  <strong>{file.title}</strong>
                  <span>{formatFileKind(file.fileKind)} · {formatFileSize(file.size)} · {file.fileName}</span>
                  <SourceFilePlacementEditor file={file} />
                </div>
                <button className="button secondary compact-square" onClick={() => openLocalFile(file.id)} type="button">View</button>
              </li>
            ))}
            {unclassifiedLinks.map((link) => (
              <li className="local-file-row" key={link.id}>
                <div>
                  <strong>{link.title}</strong>
                  <span>{link.url}</span>
                  {savedLinkIds.has(link.id) ? <SourceLinkPlacementEditor link={link} savedLinks={savedLinks} /> : null}
                </div>
                <a className="button secondary compact-square" href={link.url} rel="noopener noreferrer" target="_blank">Open</a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="learning-stage-grid" aria-label="Library source reading categories">
        {libraryCategories.map((category, index) => {
          const categoryFiles = localFiles.filter((file) => getSourceMaterialType(file) === category.materialType);
          const categoryLinks = sourceLinks.filter((link) => getLinkMaterialType(link) === category.materialType);
          const hasItems = categoryFiles.length > 0 || categoryLinks.length > 0;

          return (
            <article className="learning-stage-card" id={category.id} key={category.title} tabIndex={-1}>
              <span className="stage-number" aria-hidden="true">{index + 1}</span>
              <h3>{category.title}</h3>
              <p>{category.description}</p>
              <Link className="button secondary" to={`/library#${category.id}`}>Read</Link>
              {hasItems ? (
                <ul className="local-file-list">
                  {categoryFiles.map((file) => (
                    <li className="local-file-row" key={file.id}>
                      <div>
                        <strong>{file.title}</strong>
                        <span>{formatFileKind(file.fileKind)} · {formatFileSize(file.size)}</span>
                        <SourceFilePlacementEditor file={file} />
                      </div>
                      <button className="button secondary compact-square" onClick={() => openLocalFile(file.id)} type="button">View</button>
                    </li>
                  ))}
                  {categoryLinks.map((link) => (
                    <li className="local-file-row" key={link.id}>
                      <div>
                        <strong>{link.title}</strong>
                        <span>{link.url}</span>
                        {savedLinkIds.has(link.id) ? <SourceLinkPlacementEditor link={link} savedLinks={savedLinks} /> : null}
                      </div>
                      <a className="button secondary compact-square" href={link.url} rel="noopener noreferrer" target="_blank">Open</a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="field-help">No {category.title.toLowerCase()} saved yet.</p>
              )}
            </article>
          );
        })}
      </section>

      <section className="content-panel">
        <p className="eyebrow">Boundary</p>
        <h3>What belongs here?</h3>
        <p>This area is for reading and final placement of source material. Adding and removing material is handled separately in Add / Remove Material.</p>
      </section>
    </div>
  );
}
