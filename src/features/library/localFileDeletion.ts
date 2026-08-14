import type { LocalStudyFile } from "../../shared/types/models";
import { isSplitPdfFile } from "../study-materials/localStudyFiles";

export type LocalFileDeletionChoice = "cancel" | "delete-source-only" | "delete-source-and-splits";

export function findRelatedSplitPdfFiles(sourceFileId: string, files: readonly LocalStudyFile[]): LocalStudyFile[] {
  const childrenBySourceId = new Map<string, LocalStudyFile[]>();
  for (const file of files) {
    if (!file.sourceFileId || !isSplitPdfFile(file)) continue;
    const children = childrenBySourceId.get(file.sourceFileId) ?? [];
    children.push(file);
    childrenBySourceId.set(file.sourceFileId, children);
  }

  const relatedFiles: LocalStudyFile[] = [];
  const visitedIds = new Set([sourceFileId]);
  const pendingIds = [sourceFileId];
  while (pendingIds.length > 0) {
    const currentId = pendingIds.shift();
    if (!currentId) continue;
    for (const child of childrenBySourceId.get(currentId) ?? []) {
      if (visitedIds.has(child.id)) continue;
      visitedIds.add(child.id);
      relatedFiles.push(child);
      pendingIds.push(child.id);
    }
  }
  return relatedFiles;
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
