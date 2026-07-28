import { type ChangeEvent, type FormEvent, useRef, useState } from "react";
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
  const [file, setFile] = useState<File | null>(null);
  const [materialType, setMaterialType] = useState<SourceMaterialType | "">("");
  const [structuredStudyType, setStructuredStudyType] = useState<StructuredStudyType | "">("");
  const [uploadedFile, setUploadedFile] = useState<UploadedLocalFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  const canRemove = Boolean(uploadedFile)
    || Boolean(file)
    || materialType.length > 0
    || structuredStudyType.length > 0;

  function clearDraft() {
    setFile(null);
    setMaterialType("");
    setStructuredStudyType("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setUploadedFile(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || lock.current) return;

    if (file.size > MAX_LOCAL_FILE_SIZE) {
      onMessage("The file is larger than 50 MB. Use a cloud link for larger files.");
      return;
    }
    if (destination === "library" && !isSourceMaterialType(materialType)) {
      onMessage("Choose a Library type before adding the file to this browser.");
      return;
    }
    if (destination === "structured-study" && !isStructuredStudyType(structuredStudyType)) {
      onMessage("Choose a Structured Study part before adding the file to this browser.");
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
        onMessage("This file has already been added to this browser.");
        return;
      }

      const title = titleFromFileName(file.name);
      const item: LocalStudyFile = {
        id: createId("file"),
        title,
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
      onMessage(
        destination === "structured-study"
          ? "A local copy was added to Structured Study in this browser."
          : "A local copy was added to Library in this browser.",
      );
    } catch (error) {
      if (error instanceof LocalFilePolicyError) {
        onMessage(error.message);
      } else {
        onMessage(
          destination === "structured-study"
            ? "Choose a Structured Study part. The file also needs enough browser storage space."
            : "Choose a Library type. The file also needs enough browser storage space.",
        );
      }
    } finally {
      lock.current = false;
    }
  }

  async function removeSelectionOrUpload() {
    if (lock.current) return;

    if (!uploadedFile) {
      clearDraft();
      onMessage("The selected file was cleared.");
      return;
    }

    lock.current = true;
    try {
      await studyDatabase.studyFiles.delete(uploadedFile.id);
      onMessage(`Removed the local StudyApp copy: ${uploadedFile.title}.`);
      setUploadedFile(null);
      clearDraft();
    } catch {
      onMessage("The local StudyApp copy could not be removed.");
    } finally {
      lock.current = false;
    }
  }

  const destinationLabel = destination === "structured-study" ? "Structured Study" : "Library";

  return (
    <form className="material-form" onSubmit={(event) => void submit(event)}>
      {destination === "library" ? (
        <label className="field-label">
          Library type
          <select
            required={!uploadedFile}
            value={materialType}
            onChange={(event) => {
              setMaterialType(event.target.value as SourceMaterialType | "");
              setUploadedFile(null);
            }}
          >
            <option value="">Choose Library type</option>
            {sourceMaterialTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      ) : (
        <label className="field-label">
          Structured part
          <select
            required={!uploadedFile}
            value={structuredStudyType}
            onChange={(event) => {
              setStructuredStudyType(event.target.value as StructuredStudyType | "");
              setUploadedFile(null);
            }}
          >
            <option value="">Choose Structured part</option>
            {structuredStudyTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      )}

      <label className="field-label">
        Choose local file
        <input
          ref={inputRef}
          required={!uploadedFile}
          accept={LOCAL_STUDY_FILE_ACCEPT}
          name="study-file"
          type="file"
          onChange={chooseFile}
        />
      </label>
      <p className="field-help">The display name is created automatically from the file name. One private browser copy is stored in {destinationLabel}.</p>
      <div className="button-row">
        <button
          className={uploadedFile ? "button success compact-square" : "button primary compact-square"}
          type={uploadedFile ? "button" : "submit"}
        >
          {uploadedFile ? "File Added" : "Add file"}
        </button>
        <button
          className={uploadedFile ? "button danger compact-square" : "button secondary compact-square"}
          disabled={!canRemove}
          onClick={() => void removeSelectionOrUpload()}
          type="button"
        >
          {uploadedFile ? "Undo add" : "Clear"}
        </button>
      </div>
      {uploadedFile ? (
        <p className="field-help uploaded-file-name">{uploadedFile.fileName}</p>
      ) : null}
    </form>
  );
}
