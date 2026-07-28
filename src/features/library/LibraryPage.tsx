import { useMemo, useState } from "react";
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
  getSourceMaterialType,
  isSourceMaterialFile,
} from "../study-materials/localStudyFiles";
import {
  LocalFilePolicyError,
  openLocalStudyFile,
} from "../study-materials/localFilePolicy";
import { MaterialUploadPanel } from "../study-materials/MaterialUploadPanel";
import {
  builtInStudyMaterials,
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

export function LibraryPage() {
  const allLocalFiles = useLiveQuery(
    () => studyDatabase.studyFiles.orderBy("createdAt").toArray(),
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
  const [message, setMessage] = useState("");
  const allLinks = [...builtInStudyMaterials, ...savedLinks];
  const sourceLinks = allLinks.filter(
    (link) => getLinkMaterialType(link) !== null || !link.structuredStudyType,
  );
  const savedLinkIds = new Set(savedLinks.map((link) => link.id));
  const unclassifiedFiles = localFiles.filter((file) => getSourceMaterialType(file) === null);
  const unclassifiedLinks = sourceLinks.filter((link) => getLinkMaterialType(link) === null);

  async function openLocalFile(fileId: string) {
    const file = localFiles.find((item) => item.id === fileId);
    if (!file) return;
    try {
      const openMode = await openLocalStudyFile(file);
      if (openMode === "download") {
        setMessage("This file was downloaded because it cannot be safely previewed in the browser.");
      }
    } catch (error) {
      setMessage(
        error instanceof LocalFilePolicyError
          ? error.message
          : "The file could not be opened.",
      );
    }
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

      try {
        await studyDatabase.studyFiles.delete(fileId);
        setMessage(`Deleted "${file.title}".`);
      } catch {
        setMessage(`Could not delete "${file.title}".`);
      }
      return;
    }

    const choice = chooseDeletionForRelatedSplitPdfs(file, relatedSplitPdfs);
    const deletionIds = getLocalFileDeletionIds(fileId, relatedSplitPdfs, choice);
    if (deletionIds.length === 0) {
      setMessage("Nothing was deleted.");
      return;
    }

    try {
      await studyDatabase.transaction("rw", studyDatabase.studyFiles, async () => {
        await studyDatabase.studyFiles.bulkDelete(deletionIds);
      });

      setMessage(
        choice === "delete-source-and-splits"
          ? `Deleted "${file.title}" and ${relatedSplitPdfs.length} related split PDF${relatedSplitPdfs.length === 1 ? "" : "s"}.`
          : `Deleted "${file.title}". ${relatedSplitPdfs.length} split PDF${relatedSplitPdfs.length === 1 ? "" : "s"} kept in Structured Study without the original source file by your choice.`,
      );
    } catch {
      setMessage(`Could not delete "${file.title}".`);
    }
  }

  async function deleteSavedLink(link: StudyMaterialLink) {
    if (!savedLinkIds.has(link.id)) return;

    const shouldDelete = window.confirm(
      `Delete "${link.title}" from StudyApp? The original cloud file will not be deleted.`,
    );
    if (!shouldDelete) return;

    try {
      const currentSetting = await studyDatabase.settings.get(STUDY_MATERIALS_SETTING_KEY);
      const currentLinks = parseStoredStudyMaterials(currentSetting?.value);
      await studyDatabase.settings.put({
        key: STUDY_MATERIALS_SETTING_KEY,
        value: currentLinks.filter((item) => item.id !== link.id),
      });
      setMessage(`Deleted "${link.title}" from StudyApp.`);
    } catch {
      setMessage(`Could not delete "${link.title}".`);
    }
  }

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">Read from source</p>
        <h2>Library</h2>
        <p>Read primary and source material only: books, articles, papers, outsource notes, personal notes and summaries.</p>
      </header>

      <MaterialUploadPanel
        destination="library"
        files={allLocalFiles}
        savedLinks={savedLinks}
        existingLinks={allLinks}
        onMessage={setMessage}
      />

      {message ? <p className="inline-message status-banner" role="status" aria-live="polite">{message}</p> : null}

      {(unclassifiedFiles.length > 0 || unclassifiedLinks.length > 0) ? (
        <section className="content-panel" id="unclassified-source-material" tabIndex={-1}>
          <p className="eyebrow">Needs placement</p>
          <h3>Unclassified source material</h3>
          <p>These legacy items have no Library type yet. You can open or delete them here.</p>
          <ul className="local-file-list">
            {unclassifiedFiles.map((file) => (
              <li className="local-file-row" key={file.id}>
                <div>
                  <strong>{file.title}</strong>
                  <span>{formatFileKind(file.fileKind)} · {formatFileSize(file.size)}</span>
                </div>
                <div className="local-file-actions">
                  <button className="button secondary compact-square" onClick={() => void openLocalFile(file.id)} type="button">View</button>
                  <button className="button danger compact-square" onClick={() => void deleteLocalFile(file.id)} type="button">Delete</button>
                </div>
              </li>
            ))}
            {unclassifiedLinks.map((link) => (
              <li className="local-file-row" key={link.id}>
                <div>
                  <strong>{link.title}</strong>
                  <span>{link.url}</span>
                </div>
                <div className="local-file-actions">
                  <a className="button secondary compact-square" href={link.url} rel="noopener noreferrer" target="_blank">Open</a>
                  {savedLinkIds.has(link.id) ? (
                    <button className="button danger compact-square" onClick={() => void deleteSavedLink(link)} type="button">Delete</button>
                  ) : null}
                </div>
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
              {hasItems ? (
                <ul className="local-file-list">
                  {categoryFiles.map((file) => (
                    <li className="local-file-row" key={file.id}>
                      <div>
                        <strong>{file.title}</strong>
                        <span>{formatFileKind(file.fileKind)} · {formatFileSize(file.size)}</span>
                      </div>
                      <div className="local-file-actions">
                        <button className="button secondary compact-square" onClick={() => void openLocalFile(file.id)} type="button">View</button>
                        <button className="button danger compact-square" onClick={() => void deleteLocalFile(file.id)} type="button">Delete</button>
                      </div>
                    </li>
                  ))}
                  {categoryLinks.map((link) => (
                    <li className="local-file-row" key={link.id}>
                      <div>
                        <strong>{link.title}</strong>
                        <span>{link.url}</span>
                      </div>
                      <div className="local-file-actions">
                        <a className="button secondary compact-square" href={link.url} rel="noopener noreferrer" target="_blank">Open</a>
                        {savedLinkIds.has(link.id) ? (
                          <button className="button danger compact-square" onClick={() => void deleteSavedLink(link)} type="button">Delete</button>
                        ) : null}
                      </div>
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
        <p>Add material once in the upload panel above, then open or delete it from its Library category.</p>
      </section>
    </div>
  );
}
