import { type ChangeEvent, type FormEvent, useRef, useState } from "react";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { LocalStudyFile, SourceMaterialType, StructuredStudyType } from "../../shared/types/models";
import { createId } from "../../shared/utils/id";
import {
  computeBlobSha256,
  findDuplicateLocalStudyFile,
  getLocalStudyFileKind,
  isSourceMaterialType,
  isStructuredStudyType,
  isSupportedStudyFile,
  MAX_LOCAL_FILE_SIZE,
  sourceMaterialTypeOptions,
  structuredStudyTypeOptions,
} from "./localStudyFiles";
import { normalizeStudyMaterialTitle } from "./studyMaterials";

interface UploadedLocalFile {
  id: string;
  title: string;
  fileName: string;
}

export function LocalPdfForm({
  files,
  onMessage,
}: {
  files: readonly LocalStudyFile[];
  onMessage: (message: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [materialType, setMaterialType] = useState<SourceMaterialType | "">("");
  const [structuredStudyType, setStructuredStudyType] = useState<StructuredStudyType | "">("");
  const [uploadedFile, setUploadedFile] = useState<UploadedLocalFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  const canRemove = Boolean(uploadedFile)
    || Boolean(file)
    || title.trim().length > 0
    || materialType.length > 0
    || structuredStudyType.length > 0;

  function clearDraft() {
    setFile(null);
    setTitle("");
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

    if (!isSupportedStudyFile(file)) {
      onMessage("Choose a supported study file: PDF, Word, text, CSV, or image.");
      return;
    }
    if (file.size > MAX_LOCAL_FILE_SIZE) {
      onMessage("The file is larger than 50 MB. Use a cloud link for larger files.");
      return;
    }
    if (!isSourceMaterialType(materialType)) {
      onMessage("Choose a Library type before uploading the file.");
      return;
    }
    if (structuredStudyType && !isStructuredStudyType(structuredStudyType)) {
      onMessage("Choose a valid Structured Study part.");
      return;
    }

    const selectedStructuredType = isStructuredStudyType(structuredStudyType) ? structuredStudyType : null;

    lock.current = true;
    try {
      const contentHash = await computeBlobSha256(file);
      const existingFile = findDuplicateLocalStudyFile(files, {
        fileName: file.name,
        size: file.size,
        contentHash,
      });
      if (existingFile) {
        setUploadedFile(null);
        clearDraft();
        onMessage("This file has already been uploaded.");
        return;
      }

      const item: LocalStudyFile = {
        id: createId("file"),
        title: normalizeStudyMaterialTitle(title),
        fileName: file.name,
        size: file.size,
        createdAt: new Date().toISOString(),
        data: file.slice(0, file.size, file.type || "application/octet-stream"),
        mimeType: file.type || "application/octet-stream",
        fileKind: getLocalStudyFileKind(file.name, file.type),
        fileSource: "source-material",
        materialType,
        ...(selectedStructuredType ? { structuredStudyType: selectedStructuredType } : {}),
        ...(contentHash ? { contentHash } : {}),
      };
      await studyDatabase.studyFiles.add(item);
      setUploadedFile({ id: item.id, title: item.title, fileName: item.fileName });
      clearDraft();
      onMessage(
        selectedStructuredType
          ? "The study file was uploaded to the Library and Structured Study."
          : "The study file was uploaded to the Library.",
      );
    } catch {
      onMessage("Enter a display name and choose a Library type. The file also needs enough browser storage space.");
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
      onMessage(`Removed uploaded file: ${uploadedFile.title}.`);
      setUploadedFile(null);
      clearDraft();
    } catch {
      onMessage("The uploaded file could not be removed.");
    } finally {
      lock.current = false;
    }
  }

  return (
    <form className="material-form" onSubmit={(event) => void submit(event)}>
      <label className="field-label">
        Choose local file
        <input
          ref={inputRef}
          required={!uploadedFile}
          accept=".pdf,.doc,.docx,.txt,.md,.csv,.jpg,.jpeg,.png,.gif,.webp,application/pdf,text/*,image/*"
          name="study-file"
          type="file"
          onChange={chooseFile}
        />
      </label>
      <label className="field-label">
        Display name
        <input
          required={!uploadedFile}
          maxLength={160}
          type="text"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setUploadedFile(null);
          }}
          placeholder="Example: Cognitive Psychology"
        />
      </label>
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
      <label className="field-label">
        Structured part (optional)
        <select
          value={structuredStudyType}
          onChange={(event) => {
            setStructuredStudyType(event.target.value as StructuredStudyType | "");
            setUploadedFile(null);
          }}
        >
          <option value="">Do not add to Structured Study</option>
          {structuredStudyTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <p className="field-help">Upload stores one private browser copy. The Library type places it in Library, and the optional Structured part also places the same file in Structured Study.</p>
      <div className="button-row">
        <button
          className={uploadedFile ? "button success compact-square" : "button primary compact-square"}
          type={uploadedFile ? "button" : "submit"}
        >
          {uploadedFile ? "File Uploaded" : "Upload"}
        </button>
        <button
          className={uploadedFile ? "button danger compact-square" : "button secondary compact-square"}
          disabled={!canRemove}
          onClick={() => void removeSelectionOrUpload()}
          type="button"
        >
          {uploadedFile ? "Undo upload" : "Clear"}
        </button>
      </div>
      {uploadedFile ? (
        <p className="field-help uploaded-file-name">{uploadedFile.fileName}</p>
      ) : null}
    </form>
  );
}
