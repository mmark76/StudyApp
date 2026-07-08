import { type ChangeEvent, type FormEvent, useRef, useState } from "react";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { LocalStudyFile, SourceMaterialType } from "../../shared/types/models";
import { createId } from "../../shared/utils/id";
import {
  computeBlobSha256,
  findDuplicateLocalStudyFile,
  getLocalStudyFileKind,
  isSourceMaterialType,
  isSupportedStudyFile,
  MAX_LOCAL_FILE_SIZE,
  sourceMaterialTypeOptions,
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
  const [uploadedFile, setUploadedFile] = useState<UploadedLocalFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  const canRemove = Boolean(uploadedFile) || Boolean(file) || title.trim().length > 0 || materialType.length > 0;

  function clearDraft() {
    setFile(null);
    setTitle("");
    setMaterialType("");
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
      onMessage("Choose a source type before uploading the file.");
      return;
    }

    lock.current = true;
    try {
      const contentHash = await computeBlobSha256(file);
      const existingFile = findDuplicateLocalStudyFile(files, {
        fileName: file.name,
        size: file.size,
        contentHash,
      });
      if (existingFile) {
        setUploadedFile({ id: existingFile.id, title: existingFile.title, fileName: existingFile.fileName });
        clearDraft();
        onMessage("");
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
        ...(contentHash ? { contentHash } : {}),
      };
      await studyDatabase.studyFiles.add(item);
      setUploadedFile({ id: item.id, title: item.title, fileName: item.fileName });
      clearDraft();
      onMessage("The study file was uploaded to the app.");
    } catch {
      onMessage("Enter a display name and choose a source type. The file also needs enough browser storage space.");
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
        Type
        <select
          required={!uploadedFile}
          value={materialType}
          onChange={(event) => {
            setMaterialType(event.target.value as SourceMaterialType | "");
            setUploadedFile(null);
          }}
        >
          <option value="">Choose type</option>
          {sourceMaterialTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <p className="field-help">Upload stores a private browser copy inside StudyApp with the display name and source type you choose.</p>
      <div className="button-row">
        <button
          className={uploadedFile ? "button success compact-square" : "button primary compact-square"}
          type={uploadedFile ? "button" : "submit"}
        >
          {uploadedFile ? "File Uploaded" : "Upload"}
        </button>
        <button className="button danger compact-square" disabled={!canRemove} onClick={() => void removeSelectionOrUpload()} type="button">
          Remove
        </button>
      </div>
      {uploadedFile ? (
        <p className="field-help uploaded-file-name">{uploadedFile.fileName}</p>
      ) : null}
    </form>
  );
}
