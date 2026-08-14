import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getFileKindLabel } from "../../i18n/domainLabels";
import { useLanguage } from "../../i18n/LanguageContext";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { LocalStudyFile, SourceMaterialType } from "../../shared/types/models";
import {
  findRelatedSplitPdfFiles,
  getLocalFileDeletionIds,
  type LocalFileDeletionChoice,
} from "./localFileDeletion";
import {
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
import { removeSavedStudyMaterialLink } from "../study-materials/studyMaterialLinksRepository";

function getLinkMaterialType(link: StudyMaterialLink): SourceMaterialType | null {
  return link.materialType ?? null;
}

export function LibraryPage() {
  const { language, text } = useLanguage();
  const allLocalFiles = useLiveQuery(
    () => studyDatabase.studyFiles.orderBy("createdAt").toArray(),
    [],
  ) ?? [];
  const localFiles = useMemo(() => allLocalFiles.filter(isSourceMaterialFile), [allLocalFiles]);
  const setting = useLiveQuery(() => studyDatabase.settings.get(STUDY_MATERIALS_SETTING_KEY), []);
  const storedLinksResult = useMemo(() => {
    try {
      return { links: parseStoredStudyMaterials(setting?.value), error: false };
    } catch {
      return { links: [], error: true };
    }
  }, [setting?.value]);
  const savedLinks = storedLinksResult.links;
  const [message, setMessage] = useState("");
  const allLinks = [...builtInStudyMaterials, ...savedLinks];
  const sourceLinks = allLinks.filter((link) => getLinkMaterialType(link) !== null || !link.structuredStudyType);
  const savedLinkIds = new Set(savedLinks.map((link) => link.id));
  const unclassifiedFiles = localFiles.filter((file) => getSourceMaterialType(file) === null);
  const unclassifiedLinks = sourceLinks.filter((link) => getLinkMaterialType(link) === null);

  const libraryCategories: readonly {
    id: string;
    materialType: SourceMaterialType;
    title: string;
    description: string;
  }[] = [
    { id: "books", materialType: "book", title: text("Books", "Βιβλία"), description: text("Textbooks and longer references.", "Συγγράμματα και μεγαλύτερες πηγές.") },
    { id: "articles", materialType: "article", title: text("Articles", "Άρθρα"), description: text("Articles and focused resources.", "Άρθρα και στοχευμένες πηγές.") },
    { id: "papers", materialType: "paper", title: text("Papers", "Εργασίες"), description: text("Research papers and reports.", "Ερευνητικές εργασίες και αναφορές.") },
    { id: "outsource-notes", materialType: "outsource-note", title: text("External Notes", "Εξωτερικές σημειώσεις"), description: text("Shared or external notes.", "Κοινόχρηστες ή εξωτερικές σημειώσεις.") },
    { id: "my-notes", materialType: "my-note", title: text("My Notes", "Οι σημειώσεις μου"), description: text("Your personal notes.", "Οι προσωπικές σου σημειώσεις.") },
    { id: "summaries", materialType: "summary", title: text("Summaries", "Περιλήψεις"), description: text("Short study summaries.", "Σύντομες περιλήψεις μελέτης.") },
  ];

  async function openLocalFile(fileId: string) {
    const file = localFiles.find((item) => item.id === fileId);
    if (!file) return;
    try {
      const openMode = await openLocalStudyFile(file);
      if (openMode === "download") setMessage(text("The file was downloaded.", "Το αρχείο κατέβηκε."));
    } catch (error) {
      setMessage(
        language === "en" && error instanceof LocalFilePolicyError
          ? error.message
          : text("The file could not be opened.", "Το αρχείο δεν μπορεί να ανοίξει."),
      );
    }
  }

  function chooseDeletionForRelatedSplitPdfs(
    file: LocalStudyFile,
    relatedSplitPdfs: readonly LocalStudyFile[],
  ): LocalFileDeletionChoice {
    const response = window.prompt(text(
      `"${file.title}" has ${relatedSplitPdfs.length} related PDF files. Type DELETE ALL to remove all, or KEEP SPLITS to keep the split PDFs.`,
      `Το «${file.title}» έχει ${relatedSplitPdfs.length} σχετικά PDF. Γράψε DELETE ALL για διαγραφή όλων ή KEEP SPLITS για διατήρηση των χωρισμένων PDF.`,
    ));
    if (response === null) return "cancel";

    const normalized = response.trim().toLocaleLowerCase();
    if (normalized === "delete all") return "delete-source-and-splits";
    if (normalized === "keep splits") return "delete-source-only";

    window.alert(text("Nothing was deleted.", "Δεν διαγράφηκε τίποτα."));
    return "cancel";
  }

  async function deleteLocalFile(fileId: string) {
    const file = localFiles.find((item) => item.id === fileId);
    if (!file) return;
    const relatedSplitPdfs = findRelatedSplitPdfFiles(fileId, allLocalFiles);

    if (relatedSplitPdfs.length === 0) {
      if (!window.confirm(text(`Delete "${file.title}"?`, `Να διαγραφεί το «${file.title}»;`))) return;
      try {
        await studyDatabase.studyFiles.delete(fileId);
        setMessage(text(`Deleted "${file.title}".`, `Διαγράφηκε το «${file.title}».`));
      } catch {
        setMessage(text("The file could not be deleted.", "Το αρχείο δεν μπορεί να διαγραφεί."));
      }
      return;
    }

    const choice = chooseDeletionForRelatedSplitPdfs(file, relatedSplitPdfs);
    const deletionIds = getLocalFileDeletionIds(fileId, relatedSplitPdfs, choice);
    if (deletionIds.length === 0) {
      setMessage(text("Nothing was deleted.", "Δεν διαγράφηκε τίποτα."));
      return;
    }

    try {
      await studyDatabase.transaction("rw", studyDatabase.studyFiles, async () => {
        await studyDatabase.studyFiles.bulkDelete(deletionIds);
      });
      setMessage(text("Files deleted.", "Τα αρχεία διαγράφηκαν."));
    } catch {
      setMessage(text("The files could not be deleted.", "Τα αρχεία δεν μπορούν να διαγραφούν."));
    }
  }

  async function deleteSavedLink(link: StudyMaterialLink) {
    if (!savedLinkIds.has(link.id)) return;
    if (!window.confirm(text(`Delete "${link.title}" from StudyApp?`, `Να διαγραφεί το «${link.title}» από το StudyApp;`))) return;

    try {
      await removeSavedStudyMaterialLink(link.id);
      setMessage(text("Link deleted.", "Ο σύνδεσμος διαγράφηκε."));
    } catch {
      setMessage(text("The link could not be deleted.", "Ο σύνδεσμος δεν μπορεί να διαγραφεί."));
    }
  }

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">{text("Read from source", "Μελέτη από την πηγή")}</p>
        <h2>{text("Library", "Βιβλιοθήκη")}</h2>
        <p>{text("Books, articles, papers, notes and summaries.", "Βιβλία, άρθρα, εργασίες, σημειώσεις και περιλήψεις.")}</p>
      </header>

      <MaterialUploadPanel
        destination="library"
        files={allLocalFiles}
        existingLinks={allLinks}
        linksBlocked={storedLinksResult.error}
        onMessage={setMessage}
      />

      {message ? <p className="inline-message status-banner" role="status" aria-live="polite">{message}</p> : null}

      {(unclassifiedFiles.length > 0 || unclassifiedLinks.length > 0) ? (
        <section className="content-panel" id="unclassified-source-material" tabIndex={-1}>
          <p className="eyebrow">{text("Needs placement", "Χρειάζεται ταξινόμηση")}</p>
          <h3>{text("Unclassified material", "Αταξινόμητο υλικό")}</h3>
          <ul className="local-file-list">
            {unclassifiedFiles.map((file) => (
              <li className="local-file-row" key={file.id}>
                <div><strong>{file.title}</strong><span>{getFileKindLabel(file.fileKind, language)} · {formatFileSize(file.size)}</span></div>
                <div className="local-file-actions">
                  <button className="button secondary compact-square" onClick={() => void openLocalFile(file.id)} type="button">{text("View", "Προβολή")}</button>
                  <button className="button danger compact-square" onClick={() => void deleteLocalFile(file.id)} type="button">{text("Delete", "Διαγραφή")}</button>
                </div>
              </li>
            ))}
            {unclassifiedLinks.map((link) => (
              <li className="local-file-row" key={link.id}>
                <div><strong>{link.title}</strong><span>{link.url}</span></div>
                <div className="local-file-actions">
                  <a className="button secondary compact-square" href={link.url} rel="noopener noreferrer" target="_blank">{text("Open", "Άνοιγμα")}</a>
                  {savedLinkIds.has(link.id) ? (
                    <button className="button danger compact-square" onClick={() => void deleteSavedLink(link)} type="button">{text("Delete", "Διαγραφή")}</button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="learning-stage-grid" aria-label={text("Library categories", "Κατηγορίες Βιβλιοθήκης")}>
        {libraryCategories.map((category, index) => {
          const categoryFiles = localFiles.filter((file) => getSourceMaterialType(file) === category.materialType);
          const categoryLinks = sourceLinks.filter((link) => getLinkMaterialType(link) === category.materialType);
          const hasItems = categoryFiles.length > 0 || categoryLinks.length > 0;

          return (
            <article className="learning-stage-card" id={category.id} key={category.id} tabIndex={-1}>
              <span className="stage-number" aria-hidden="true">{index + 1}</span>
              <h3>{category.title}</h3>
              <p>{category.description}</p>
              {hasItems ? (
                <ul className="local-file-list">
                  {categoryFiles.map((file) => (
                    <li className="local-file-row" key={file.id}>
                      <div><strong>{file.title}</strong><span>{getFileKindLabel(file.fileKind, language)} · {formatFileSize(file.size)}</span></div>
                      <div className="local-file-actions">
                        <button className="button secondary compact-square" onClick={() => void openLocalFile(file.id)} type="button">{text("View", "Προβολή")}</button>
                        <button className="button danger compact-square" onClick={() => void deleteLocalFile(file.id)} type="button">{text("Delete", "Διαγραφή")}</button>
                      </div>
                    </li>
                  ))}
                  {categoryLinks.map((link) => (
                    <li className="local-file-row" key={link.id}>
                      <div><strong>{link.title}</strong><span>{link.url}</span></div>
                      <div className="local-file-actions">
                        <a className="button secondary compact-square" href={link.url} rel="noopener noreferrer" target="_blank">{text("Open", "Άνοιγμα")}</a>
                        {savedLinkIds.has(link.id) ? (
                          <button className="button danger compact-square" onClick={() => void deleteSavedLink(link)} type="button">{text("Delete", "Διαγραφή")}</button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="field-help">{text("No items yet.", "Δεν υπάρχουν στοιχεία.")}</p>}
            </article>
          );
        })}
      </section>
    </div>
  );
}
