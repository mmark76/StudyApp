import type { Flashcard, StudyUnit } from "../../shared/types/models";

export const PRACTICE_CHAPTER_PAGE_SIZE = 25;
export const PRACTICE_FLASHCARD_PAGE_SIZE = 50;
export const MAX_MOUNTED_PRACTICE_CONTENT_ROWS =
  PRACTICE_CHAPTER_PAGE_SIZE + PRACTICE_FLASHCARD_PAGE_SIZE;

export interface PracticeContentProjection {
  cardCountByUnitId: ReadonlyMap<string, number>;
  cardsByUnitId: ReadonlyMap<string, readonly Flashcard[]>;
  unitById: ReadonlyMap<string, StudyUnit>;
  unitByNumber: ReadonlyMap<number, StudyUnit>;
}

export interface PaginatedItems<T> {
  currentPage: number;
  endIndex: number;
  items: readonly T[];
  pageSize: number;
  startIndex: number;
  totalItems: number;
  totalPages: number;
  visibleEnd: number;
  visibleStart: number;
}

export function buildPracticeContentProjection(
  units: readonly StudyUnit[],
  flashcards: readonly Flashcard[],
): PracticeContentProjection {
  const unitById = new Map<string, StudyUnit>();
  const unitByNumber = new Map<number, StudyUnit>();
  const mutableCardsByUnitId = new Map<string, Flashcard[]>();

  for (const unit of units) {
    unitById.set(unit.id, unit);
    if (!unitByNumber.has(unit.number)) unitByNumber.set(unit.number, unit);
  }
  for (const card of flashcards) {
    const groupedCards = mutableCardsByUnitId.get(card.unitId);
    if (groupedCards) groupedCards.push(card);
    else mutableCardsByUnitId.set(card.unitId, [card]);
  }

  const cardsByUnitId = new Map<string, readonly Flashcard[]>();
  const cardCountByUnitId = new Map<string, number>();
  for (const [unitId, groupedCards] of mutableCardsByUnitId) {
    cardsByUnitId.set(unitId, groupedCards);
    cardCountByUnitId.set(unitId, groupedCards.length);
  }

  return { cardCountByUnitId, cardsByUnitId, unitById, unitByNumber };
}

function assertPageSize(pageSize: number): void {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) {
    throw new Error("Pagination page size must be a positive integer.");
  }
}

export function clampPage(
  requestedPage: number,
  totalItems: number,
  pageSize: number,
): number {
  assertPageSize(pageSize);
  const totalPages = Math.max(1, Math.ceil(Math.max(0, totalItems) / pageSize));
  if (!Number.isFinite(requestedPage)) return 1;
  return Math.min(totalPages, Math.max(1, Math.trunc(requestedPage)));
}

export function getPageForItemIndex(itemIndex: number, pageSize: number): number {
  assertPageSize(pageSize);
  if (!Number.isSafeInteger(itemIndex) || itemIndex < 0) return 1;
  return Math.floor(itemIndex / pageSize) + 1;
}

export function paginateItems<T>(
  items: readonly T[],
  pageSize: number,
  requestedPage: number,
): PaginatedItems<T> {
  const currentPage = clampPage(requestedPage, items.length, pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const startIndex = items.length === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = Math.min(items.length, startIndex + pageSize);

  return {
    currentPage,
    endIndex,
    items: items.slice(startIndex, endIndex),
    pageSize,
    startIndex,
    totalItems: items.length,
    totalPages,
    visibleEnd: endIndex,
    visibleStart: items.length === 0 ? 0 : startIndex + 1,
  };
}
