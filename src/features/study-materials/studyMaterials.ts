import type { SourceMaterialType, StructuredStudyType } from "../../shared/types/models";
import { isSourceMaterialType, isStructuredStudyType } from "./localStudyFiles";

export interface StudyMaterialLink {
  id: string;
  title: string;
  url: string;
  materialType?: SourceMaterialType;
  structuredStudyType?: StructuredStudyType;
}

export const STUDY_MATERIALS_SETTING_KEY = "study-material-links";
const STUDY_MATERIAL_LINK_KEYS = ["id", "title", "url", "materialType", "structuredStudyType"] as const;

export class StoredStudyMaterialsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoredStudyMaterialsValidationError";
  }
}

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

export function titleFromStudyMaterialUrl(value: string): string {
  const url = new URL(value);
  const rawSegment = url.pathname.split("/").filter(Boolean).pop() ?? "";
  let segment = rawSegment;
  try {
    segment = decodeURIComponent(rawSegment);
  } catch {
    // Keep the encoded path segment when it cannot be decoded safely.
  }

  const cleanedSegment = segment
    .replace(/\.[^.]+$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
  const hostname = url.hostname.replace(/^www\./i, "");
  return normalizeStudyMaterialTitle((cleanedSegment || hostname || "Cloud material").slice(0, 160));
}

export function parseStoredStudyMaterials(value: unknown): StudyMaterialLink[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new StoredStudyMaterialsValidationError("Saved links are not an array.");
  }
  const result: StudyMaterialLink[] = [];
  const ids = new Set<string>();
  for (const item of value) {
    if (
      !isRecord(item)
      || Object.keys(item).some((key) => !STUDY_MATERIAL_LINK_KEYS.includes(key as typeof STUDY_MATERIAL_LINK_KEYS[number]))
      || typeof item.id !== "string"
      || typeof item.title !== "string"
      || typeof item.url !== "string"
      || (item.materialType !== undefined && !isSourceMaterialType(item.materialType))
      || (item.structuredStudyType !== undefined && !isStructuredStudyType(item.structuredStudyType))
    ) {
      throw new StoredStudyMaterialsValidationError("A saved link is invalid.");
    }
    try {
      const id = item.id.trim();
      if (!id || id.length > 256 || ids.has(id)) {
        throw new StoredStudyMaterialsValidationError("A saved link ID is invalid or duplicated.");
      }
      result.push({
        id,
        title: normalizeStudyMaterialTitle(item.title),
        url: normalizeStudyMaterialUrl(item.url),
        ...(isSourceMaterialType(item.materialType)
          ? { materialType: item.materialType }
          : {}),
        ...(isStructuredStudyType(item.structuredStudyType)
          ? { structuredStudyType: item.structuredStudyType }
          : {}),
      });
      ids.add(id);
    } catch (error) {
      if (error instanceof StoredStudyMaterialsValidationError) throw error;
      throw new StoredStudyMaterialsValidationError("A saved link is invalid.");
    }
  }
  return result;
}
