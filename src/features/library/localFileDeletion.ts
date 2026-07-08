import type { LocalStudyFile } from "../../shared/types/models";
import { isSplitPdfFile } from "../study-materials/localStudyFiles";

export type LocalFileDeletionChoice = "cancel" | "delete-source-only" | "delete-source-and-splits";

export function findRelatedSplitPdfFiles(sourceFileId: string, files: readonly LocalStudyFile[]): LocalStudyFile[] {
  return files.filter((file) => file.sourceFileId === sourceFileId && isSplitPdfFile(file));
}

export function getLocalFileDeletionIds(
  sourceFileId: string,
  relatedSplitPdfs: readonly LocalStudyFile[],
  choice: LocalFileDeletionChoice,
): string[] {
  if (choice === "cancel") return [];
  if (choice === "delete-source-and-splits") {
    return [sourceFileId, ...relatedSplitPdfs.map((file) => file.id)];
  }
  return [sourceFileId];
}
