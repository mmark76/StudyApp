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

export function LocalPdfForm({
  files,
  onMessage,
}: {
  files: readonly LocalStudyFile[];
  onMessage: (message: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const lock = useRef(false);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    if (selected && title.trim().length === 0) setTitle(titleFromFileName(selected.name));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
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
      onMessage("This file has already been added.");
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
      setFile(null);
      setTitle("");
      const input = form.elements.namedItem("study-file") as HTMLInputElement | null;
      if (input) input.value = "";
      onMessage("The study file was added to this device.");
    } catch {
      onMessage("The file could not be saved. Your browser may not have enough storage space.");
    } finally {
      lock.current = false;
    }
  }

  return (
    <form className="material-form" onSubmit={(event) => void submit(event)}>
      <label className="field-label">
        Material from this device
        <input
          required
          accept=".pdf,.doc,.docx,.txt,.md,.csv,.jpg,.jpeg,.png,.gif,.webp,application/pdf,text/*,image/*"
          name="study-file"
          type="file"
          onChange={chooseFile}
        />
      </label>
      <label className="field-label">
        Name
        <input
          required
          maxLength={160}
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="The file name will be used automatically"
        />
      </label>
      <button className="button primary" type="submit">Add material from this device</button>
    </form>
  );
}
