import { type ChangeEvent, type FormEvent, useRef, useState } from "react";
import {
  getSourceMaterialTypeLabel,
  getStructuredStudyTypeLabel,
} from "../../i18n/domainLabels";
import { useLanguage } from "../../i18n/LanguageContext";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { LocalStudyFile, SourceMaterialType, StructuredStudyType } from "../../shared/types/models";
import { createId } from "../../shared/utils/id";
import {
  LOCAL_STUDY_FILE_ACCEPT,
  LocalFilePolicyError,
  validateLocalStudyFile,
} from "./localFilePolicy";
import {
  computeBlobSha256,
  findDuplicateLocalStudyFile,
  isSourceMaterialType,
  isStructuredStudyType,
  MAX_LOCAL_FILE_SIZE,
  sourceMaterialTypeOptions,
  structuredStudyTypeOptions,
  titleFromFileName,
} from "./localStudyFiles";
import type { MaterialDestination } from "./materialDestination";

interface UploadedLocalFile {
  id: string;
  title: string;
  fileName: string;
}

export function LocalPdfForm({
  destination,
  files,
  onMessage,
}: {
  destination: MaterialDestination;
  files: readonly LocalStudyFile[];
  onMessage: (message: string) => void;
}) {
  const { language, text } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [materialType, setMaterialType] = useState<SourceMaterialType | "">("");
  const [structuredStudyType, setStructuredStudyType] = useState<StructuredStudyType | "">("");
  const [uploadedFile, setUploadedFile] = useState<UploadedLocalFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  const canRemove = Boolean(uploadedFile) || Boolean(file) || materialType.length > 0 || structuredStudyType.length > 0;

  function clearDraft() {
    setFile(null);
    setMaterialType("");
    setStructuredStudyType("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setUploadedFile(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || lock.current) return;

    if (file.size > MAX_LOCAL_FILE_SIZE) {
      onMessage(text("The file is larger than 50 MB.", "Το αρχείο είναι μεγαλύτερο από 50 MB."));
      return;
    }
    if (destination === "library" && !isSourceMaterialType(materialType)) {
      onMessage(text("Choose a Library type.", "Επίλεξε τύπο Βιβλιοθήκης."));
      return;
    }
    if (destination === "structured-study" && !isStructuredStudyType(structuredStudyType)) {
      onMessage(text("Choose a Structured Study type.", "Επίλεξε τύπο Δομημένης Μελέτης."));
      return;
    }

    lock.current = true;
    try {
      const validatedFile = await validateLocalStudyFile(file);
      const contentHash = await computeBlobSha256(file);
      const existingFile = findDuplicateLocalStudyFile(files, {
        fileName: file.name,
        size: file.size,
        contentHash,
      });
      if (existingFile) {
        setUploadedFile(null);
        clearDraft();
        onMessage(text("This file is already saved.", "Το αρχείο είναι ήδη αποθηκευμένο."));
        return;
      }

      const item: LocalStudyFile = {
        id: createId("file"),
        title: titleFromFileName(file.name),
        fileName: file.name,
        size: file.size,
        createdAt: new Date().toISOString(),
        data: file.slice(0, file.size, validatedFile.canonicalMimeType),
        mimeType: validatedFile.canonicalMimeType,
        fileKind: validatedFile.fileKind,
        fileSource: destination === "structured-study" ? "structured-material" : "source-material",
        ...(isSourceMaterialType(materialType) ? { materialType } : {}),
        ...(isStructuredStudyType(structuredStudyType) ? { structuredStudyType } : {}),
        ...(contentHash ? { contentHash } : {}),
      };
      await studyDatabase.studyFiles.add(item);
      setUploadedFile({ id: item.id, title: item.title, fileName: item.fileName });
      clearDraft();
      onMessage(text("File added.", "Το αρχείο προστέθηκε."));
    } catch (error) {
      onMessage(
        language === "en" && error instanceof LocalFilePolicyError
          ? error.message
          : text("The file could not be added.", "Το αρχείο δεν μπορεί να προστεθεί."),
      );
    } finally {
      lock.current = false;
    }
  }

  async function removeSelectionOrUpload() {
    if (lock.current) return;

    if (!uploadedFile) {
      clearDraft();
      onMessage(text("Selection cleared.", "Η επιλογή καθαρίστηκε."));
      return;
    }

    lock.current = true;
    try {
      await studyDatabase.studyFiles.delete(uploadedFile.id);
      onMessage(text(`Removed ${uploadedFile.title}.`, `Διαγράφηκε το ${uploadedFile.title}.`));
      setUploadedFile(null);
      clearDraft();
    } catch {
      onMessage(text("The file could not be removed.", "Το αρχείο δεν μπορεί να διαγραφεί."));
    } finally {
      lock.current = false;
    }
  }

  const destinationLabel = destination === "structured-study"
    ? text("Structured Study", "Δομημένη Μελέτη")
    : text("Library", "Βιβλιοθήκη");

  return (
    <form className="material-form" onSubmit={(event) => void submit(event)}>
      {destination === "library" ? (
        <label className="field-label">
          {text("Library type", "Τύπος Βιβλιοθήκης")}
          <select
            required={!uploadedFile}
            value={materialType}
            onChange={(event) => {
              setMaterialType(event.target.value as SourceMaterialType | "");
              setUploadedFile(null);
            }}
          >
            <option value="">{text("Choose type", "Επίλεξε τύπο")}</option>
            {sourceMaterialTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{getSourceMaterialTypeLabel(option.value, language)}</option>
            ))}
          </select>
        </label>
      ) : (
        <label className="field-label">
          {text("Structured type", "Τύπος Δομημένης Μελέτης")}
          <select
            required={!uploadedFile}
            value={structuredStudyType}
            onChange={(event) => {
              setStructuredStudyType(event.target.value as StructuredStudyType | "");
              setUploadedFile(null);
            }}
          >
            <option value="">{text("Choose type", "Επίλεξε τύπο")}</option>
            {structuredStudyTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{getStructuredStudyTypeLabel(option.value, language)}</option>
            ))}
          </select>
        </label>
      )}

      <label className="field-label">
        {text("Choose local file", "Επιλογή τοπικού αρχείου")}
        <input
          ref={inputRef}
          required={!uploadedFile}
          accept={LOCAL_STUDY_FILE_ACCEPT}
          name="study-file"
          type="file"
          onChange={chooseFile}
        />
      </label>
      <p className="field-help">{text(
        `A private browser copy will be stored in ${destinationLabel}.`,
        `Ένα τοπικό αντίγραφο θα αποθηκευτεί στη ${destinationLabel}.`,
      )}</p>
      <div className="button-row">
        <button className={uploadedFile ? "button success compact-square" : "button primary compact-square"} type={uploadedFile ? "button" : "submit"}>
          {uploadedFile ? text("File added", "Προστέθηκε") : text("Add file", "Προσθήκη αρχείου")}
        </button>
        <button
          className={uploadedFile ? "button danger compact-square" : "button secondary compact-square"}
          disabled={!canRemove}
          onClick={() => void removeSelectionOrUpload()}
          type="button"
        >
          {uploadedFile ? text("Undo", "Αναίρεση") : text("Clear", "Καθαρισμός")}
        </button>
      </div>
      {uploadedFile ? <p className="field-help uploaded-file-name">{uploadedFile.fileName}</p> : null}
    </form>
  );
}
