import type { SourceMaterialType } from "../../shared/types/models";
import { isSourceMaterialType } from "./localStudyFiles";

export interface StudyMaterialLink {
  id: string;
  title: string;
  url: string;
  materialType?: SourceMaterialType;
}

export const STUDY_MATERIALS_SETTING_KEY = "study-material-links";

// Add permanent subject links here. The template intentionally starts empty.
export const builtInStudyMaterials: readonly StudyMaterialLink[] = [];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeStudyMaterialUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 2048) throw new Error("Invalid URL length");
  const url = new URL(trimmed);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Only HTTP and HTTPS links are supported");
  return url.toString();
}

export function normalizeStudyMaterialTitle(value: string): string {
  const title = value.trim().replace(/\s+/g, " ");
  if (title.length === 0 || title.length > 160) throw new Error("Invalid title length");
  return title;
}

export function parseStoredStudyMaterials(value: unknown): StudyMaterialLink[] {
  if (!Array.isArray(value)) return [];
  const result: StudyMaterialLink[] = [];
  const ids = new Set<string>();
  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== "string" || typeof item.title !== "string" || typeof item.url !== "string") continue;
    try {
      const id = item.id.trim();
      if (!id || ids.has(id)) continue;
      result.push({
        id,
        title: normalizeStudyMaterialTitle(item.title),
        url: normalizeStudyMaterialUrl(item.url),
        materialType: isSourceMaterialType(item.materialType) ? item.materialType : undefined,
      });
      ids.add(id);
    } catch {
      // Ignore malformed local records.
    }
  }
  return result;
}
