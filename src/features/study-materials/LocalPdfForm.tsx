import { type ChangeEvent, type FormEvent, useRef, useState } from "react";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { LocalStudyFile } from "../../shared/types/models";
import { createId } from "../../shared/utils/id";
import {
  getLocalStudyFileKind,
  isSupportedStudyFile,
  MAX_LOCAL_FILE_SIZE,
  titleFromFileName,
} from "./localStudyFiles";
import { normalizeStudyMaterialTitle } from "./studyMaterials";

interface UploadedLocalFile {
  id: string;
  title: string;
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
  const [uploadedFile, setUploadedFile] = useState<UploadedLocalFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  const canRemove = Boolean(uploadedFile) || Boolean(file) || title.trim().length > 0;

  function clearDraft() {
    setFile(null);
    setTitle("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setUploadedFile(null);
    if (selected && title.trim().length === 0) setTitle(titleFromFileName(selected.name));
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
    if (files.some((item) => item.fileName === file.name && item.size === file.size)) {
      onMessage("This file has already been uploaded.");
      return;
    }

    lock.current = true;
    try {
      const item: LocalStudyFile = {
        id: createId("file"),
        title: normalizeStudyMaterialTitle(title || titleFromFileName(file.name)),
        fileName: file.name,
        size: file.size,
        createdAt: new Date().toISOString(),
        data: file.slice(0, file.size, file.type || "application/octet-stream"),
        mimeType: file.type || "application/octet-stream",
        fileKind: getLocalStudyFileKind(file.name, file.type),
      };
      await studyDatabase.studyFiles.add(item);
      setUploadedFile({ id: item.id, title: item.title });
      clearDraft();
      onMessage("The study file was uploaded to the app.");
    } catch {
      onMessage("The file could not be uploaded. Your browser may not have enough storage space.");
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
          placeholder="The file name will be used automatically"
        />
      </label>
      <p className="field-help">Upload stores a private browser copy inside StudyApp so it can be read or used later.</p>
      <div className="button-row">
        <button
          className={uploadedFile ? "button success compact-square" : "button primary compact-square"}
          type={uploadedFile ? "button" : "submit"}
        >
          {uploadedFile ? "Uploaded" : "Upload"}
        </button>
        <button className="button danger compact-square" disabled={!canRemove} onClick={() => void removeSelectionOrUpload()} type="button">
          Remove
        </button>
      </div>
    </form>
  );
}
