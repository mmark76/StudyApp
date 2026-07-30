import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  getFileKindLabel,
  getStructuredStudyTypeLabel,
} from "../../i18n/domainLabels";
import { useLanguage } from "../../i18n/LanguageContext";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { LocalStudyFile, StructuredStudyType } from "../../shared/types/models";
import {
  formatFileSize,
  getStructuredStudyType,
  isSplitPdfFile,
  isStructuredStudyFile,
  isStructuredStudyType,
  structuredStudyTypeOptions,
} from "../study-materials/localStudyFiles";
import {
  LocalFilePolicyError,
  openLocalStudyFile,
} from "../study-materials/localFilePolicy";
import { MaterialUploadPanel } from "../study-materials/MaterialUploadPanel";
import { downloadSplitPdfFile } from "../study-materials/splitPdfDownloads";
import {
  builtInStudyMaterials,
  normalizeStudyMaterialTitle,
  parseStoredStudyMaterials,
  STUDY_MATERIALS_SETTING_KEY,
  type StudyMaterialLink,
} from "../study-materials/studyMaterials";
import "./StructuredFileActions.css";

function getLinkStructuredStudyType(link: StudyMaterialLink): StructuredStudyType | null {
  return isStructuredStudyType(link.structuredStudyType) ? link.structuredStudyType : null;
}

function StructuredFilePlacementEditor({ file }: { file: LocalStudyFile }) {
  const { language, text } = useLanguage();
  const [title, setTitle] = useState(file.title);
  const [materialType, setMaterialType] = useState<StructuredStudyType | "">(getStructuredStudyType(file) ?? "");
  const [message, setMessage] = useState("");

  async function savePlacement() {
    if (!isStructuredStudyType(materialType)) {
      setMessage(text("Choose a type.", "Επίλεξε τύπο."));
      return;
    }

    try {
      await studyDatabase.studyFiles.update(file.id, {
        title: normalizeStudyMaterialTitle(title),
        ...(isSplitPdfFile(file) ? { materialType } : { structuredStudyType: materialType }),
      });
      setMessage(text("Saved.", "Αποθηκεύτηκε."));
    } catch {
      setMessage(text("Could not save.", "Δεν αποθηκεύτηκε."));
    }
  }

  return (
    <div className="library-grid" style={{ alignItems: "end" }}>
      <label className="field-label">
        {text("Name", "Όνομα")}
        <input maxLength={160} type="text" value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label className="field-label">
        {text("Type", "Τύπος")}
        <select value={materialType} onChange={(event) => setMaterialType(event.target.value as StructuredStudyType | "")}>
          <option value="">{text("Unclassified", "Αταξινόμητο")}</option>
          {structuredStudyTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>{getStructuredStudyTypeLabel(option.value, language)}</option>
          ))}
        </select>
      </label>
      <button className="button primary compact-square" onClick={() => void savePlacement()} type="button">
        {text("Save", "Αποθήκευση")}
      </button>
      {message ? <p className="field-help" role="status">{message}</p> : null}
    </div>
  );
}

export function StudyTheoryPage() {
  const { language, text } = useLanguage();
  const localFiles = useLiveQuery(
    () => studyDatabase.studyFiles.orderBy("createdAt").toArray(),
    [],
  ) ?? [];
  const setting = useLiveQuery(() => studyDatabase.settings.get(STUDY_MATERIALS_SETTING_KEY), []);
  const savedLinks = useMemo(() => parseStoredStudyMaterials(setting?.value), [setting?.value]);
  const allLinks = [...builtInStudyMaterials, ...savedLinks];
  const structuredFiles = useMemo(() => localFiles.filter(isStructuredStudyFile), [localFiles]);
  const structuredLinks = allLinks.filter((link) => getLinkStructuredStudyType(link) !== null);
  const unclassifiedFiles = structuredFiles.filter((file) => isSplitPdfFile(file) && getStructuredStudyType(file) === null);
  const [message, setMessage] = useState("");

  const sourceStructure: readonly {
    id: string;
    materialType: StructuredStudyType;
    title: string;
    description: string;
  }[] = [
    { id: "contents", materialType: "contents", title: text("Contents", "Περιεχόμενα"), description: text("The map of the material.", "Ο χάρτης του υλικού.") },
    { id: "chapters", materialType: "chapter", title: text("Chapters", "Κεφάλαια"), description: text("Major learning blocks.", "Μεγάλες ενότητες μάθησης.") },
    { id: "sections-paragraphs", materialType: "section", title: text("Sections / Paragraphs", "Ενότητες / Παράγραφοι"), description: text("Smaller focused parts.", "Μικρότερα στοχευμένα μέρη.") },
    { id: "key-concepts", materialType: "key-concept", title: text("Key Concepts", "Βασικές έννοιες"), description: text("Important ideas and definitions.", "Σημαντικές ιδέες και ορισμοί.") },
    { id: "bibliography-references", materialType: "bibliography-reference", title: text("Bibliography / References", "Βιβλιογραφία / Αναφορές"), description: text("Sources and references.", "Πηγές και αναφορές.") },
    { id: "images-diagrams", materialType: "image-diagram", title: text("Images / Diagrams", "Εικόνες / Διαγράμματα"), description: text("Figures and visual material.", "Σχήματα και οπτικό υλικό.") },
  ];

  async function openStructuredFile(fileId: string) {
    const file = structuredFiles.find((item) => item.id === fileId);
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

  async function renameStructuredFile(file: LocalStudyFile) {
    const nextTitle = window.prompt(text("Rename this file:", "Νέο όνομα αρχείου:"), file.title);
    if (nextTitle === null) return;

    try {
      const normalizedTitle = normalizeStudyMaterialTitle(nextTitle);
      if (normalizedTitle === file.title) {
        setMessage(text("The name was not changed.", "Το όνομα δεν άλλαξε."));
        return;
      }
      await studyDatabase.studyFiles.update(file.id, { title: normalizedTitle });
      setMessage(text("File renamed.", "Το αρχείο μετονομάστηκε."));
    } catch {
      setMessage(text("Enter a valid name.", "Γράψε έγκυρο όνομα."));
    }
  }

  async function downloadStructuredFile(file: LocalStudyFile) {
    try {
      await downloadSplitPdfFile(file);
      setMessage(text("Download started.", "Η λήψη ξεκίνησε."));
    } catch {
      setMessage(text("The PDF could not be downloaded.", "Το PDF δεν μπορεί να κατέβει."));
    }
  }

  async function removeStructuredFile(file: LocalStudyFile) {
    const deleteWholeFile = isSplitPdfFile(file) || file.fileSource === "structured-material";
    if (!window.confirm(text(
      deleteWholeFile ? `Remove "${file.title}"?` : `Remove "${file.title}" from Structured Study?`,
      deleteWholeFile ? `Να διαγραφεί το «${file.title}»;` : `Να αφαιρεθεί το «${file.title}» από τη Δομημένη Μελέτη;`,
    ))) return;

    try {
      if (deleteWholeFile) {
        await studyDatabase.studyFiles.delete(file.id);
      } else {
        await studyDatabase.studyFiles.update(file.id, { structuredStudyType: null });
      }
      setMessage(text("Material removed.", "Το υλικό αφαιρέθηκε."));
    } catch {
      setMessage(text("The material could not be removed.", "Το υλικό δεν μπορεί να αφαιρεθεί."));
    }
  }

  async function removeStructuredLink(link: StudyMaterialLink) {
    if (!window.confirm(text(`Remove "${link.title}"?`, `Να αφαιρεθεί το «${link.title}»;`))) return;

    try {
      const currentSetting = await studyDatabase.settings.get(STUDY_MATERIALS_SETTING_KEY);
      const currentLinks = parseStoredStudyMaterials(currentSetting?.value);
      await studyDatabase.settings.put({
        key: STUDY_MATERIALS_SETTING_KEY,
        value: currentLinks.filter((item) => item.id !== link.id),
      });
      setMessage(text("Link removed.", "Ο σύνδεσμος αφαιρέθηκε."));
    } catch {
      setMessage(text("The link could not be removed.", "Ο σύνδεσμος δεν μπορεί να αφαιρεθεί."));
    }
  }

  const hasStructuredMaterial = structuredFiles.length > 0 || structuredLinks.length > 0;

  return (
    <div className="stack-lg">
      <header className="page-heading">
        <p className="eyebrow">{text("Structured reading", "Δομημένη ανάγνωση")}</p>
        <h2>{text("Structured Study", "Δομημένη Μελέτη")}</h2>
        <p>{text("Study material by structure and level.", "Μελέτησε το υλικό ανά δομή και επίπεδο.")}</p>
      </header>

      <MaterialUploadPanel
        destination="structured-study"
        files={localFiles}
        savedLinks={savedLinks}
        existingLinks={allLinks}
        onMessage={setMessage}
      />

      {message ? <p className="inline-message status-banner" role="status" aria-live="polite">{message}</p> : null}

      <section className="content-panel" aria-label={text("Structured material", "Δομημένο υλικό")}>
        <p className="eyebrow">{text("Structured material", "Δομημένο υλικό")}</p>
        <h3>{text("Files and links by type", "Αρχεία και σύνδεσμοι ανά τύπο")}</h3>
        {!hasStructuredMaterial ? <p className="inline-message">{text("No structured material yet.", "Δεν υπάρχει ακόμη δομημένο υλικό.")}</p> : null}
      </section>

      {unclassifiedFiles.length > 0 ? (
        <section className="content-panel" id="unclassified-structured-study" tabIndex={-1}>
          <p className="eyebrow">{text("Needs placement", "Χρειάζεται ταξινόμηση")}</p>
          <h3>{text("Unclassified split PDFs", "Αταξινόμητα χωρισμένα PDF")}</h3>
          <ul className="local-file-list">
            {unclassifiedFiles.map((file) => (
              <li className="local-file-row" key={file.id}>
                <div>
                  <strong>{file.title}</strong>
                  <span>{getFileKindLabel(file.fileKind, language)} · {formatFileSize(file.size)}</span>
                  <StructuredFilePlacementEditor file={file} />
                </div>
                <div className="local-file-actions">
                  <button className="button structured-view-action compact-square" onClick={() => void openStructuredFile(file.id)} type="button">{text("View", "Προβολή")}</button>
                  <button className="button secondary compact-square" onClick={() => void downloadStructuredFile(file)} type="button">{text("Download", "Λήψη")}</button>
                  <button className="button structured-rename-action compact-square" onClick={() => void renameStructuredFile(file)} type="button">{text("Rename", "Μετονομασία")}</button>
                  <button className="button danger compact-square" onClick={() => void removeStructuredFile(file)} type="button">{text("Remove", "Αφαίρεση")}</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="learning-stage-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }} aria-label={text("Structured Study levels", "Επίπεδα Δομημένης Μελέτης")}>
        {sourceStructure.map((item, index) => {
          const filesForType = structuredFiles.filter((file) => getStructuredStudyType(file) === item.materialType);
          const linksForType = structuredLinks.filter((link) => getLinkStructuredStudyType(link) === item.materialType);
          const hasItems = filesForType.length > 0 || linksForType.length > 0;

          return (
            <article className="learning-stage-card" id={item.id} key={item.id} tabIndex={-1}>
              <span className="stage-number" aria-hidden="true">{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              {hasItems ? (
                <ul className="local-file-list">
                  {filesForType.map((file) => (
                    <li className="local-file-row" key={file.id}>
                      <div><strong>{file.title}</strong><span>{getFileKindLabel(file.fileKind, language)} · {formatFileSize(file.size)}</span></div>
                      <div className="local-file-actions">
                        <button className="button structured-view-action compact-square" onClick={() => void openStructuredFile(file.id)} type="button">{text("View", "Προβολή")}</button>
                        {isSplitPdfFile(file) ? <button className="button secondary compact-square" onClick={() => void downloadStructuredFile(file)} type="button">{text("Download", "Λήψη")}</button> : null}
                        <button className="button structured-rename-action compact-square" onClick={() => void renameStructuredFile(file)} type="button">{text("Rename", "Μετονομασία")}</button>
                        <button className="button danger compact-square" onClick={() => void removeStructuredFile(file)} type="button">{text("Remove", "Αφαίρεση")}</button>
                      </div>
                    </li>
                  ))}
                  {linksForType.map((link) => (
                    <li className="local-file-row" key={link.id}>
                      <div><strong>{link.title}</strong><span>{link.url}</span></div>
                      <div className="local-file-actions">
                        <a className="button secondary compact-square" href={link.url} rel="noopener noreferrer" target="_blank">{text("Open", "Άνοιγμα")}</a>
                        <button className="button danger compact-square" onClick={() => void removeStructuredLink(link)} type="button">{text("Remove", "Αφαίρεση")}</button>
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
