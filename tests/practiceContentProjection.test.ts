import { describe, expect, it } from "vitest";
import {
  buildPracticeContentProjection,
  clampPage,
  getPageForItemIndex,
  MAX_MOUNTED_PRACTICE_CONTENT_ROWS,
  paginateItems,
  PRACTICE_CHAPTER_PAGE_SIZE,
  PRACTICE_FLASHCARD_PAGE_SIZE,
} from "../src/features/content-import/practiceContentProjection";
import type { Flashcard, StudyUnit } from "../src/shared/types/models";

function unit(id: string, number: number): StudyUnit {
  return { id, number, title: `Unit ${number}`, objectives: [], summary: [], keyTerms: [] };
}

function card(id: string, unitId: string, number: number): Flashcard {
  return { id, unitId, number, question: `Question ${id}?`, answer: `Answer ${id}.`, tags: [] };
}

describe("practice content projections", () => {
  it("builds empty deterministic indexes", () => {
    const projection = buildPracticeContentProjection([], []);
    expect([...projection.unitById]).toEqual([]);
    expect([...projection.unitByNumber]).toEqual([]);
    expect([...projection.cardsByUnitId]).toEqual([]);
    expect([...projection.cardCountByUnitId]).toEqual([]);
  });

  it("indexes units and groups every card once in source order", () => {
    const units = [unit("unit-1", 1), unit("unit-2", 2), unit("unit-3", 3)];
    const cards = [
      card("card-1", "unit-2", 1),
      card("card-2", "unit-1", 1),
      card("card-3", "unit-2", 2),
    ];
    const projection = buildPracticeContentProjection(units, cards);

    expect(projection.unitById.get("unit-2")).toBe(units[1]);
    expect(projection.unitByNumber.get(3)).toBe(units[2]);
    expect(projection.cardsByUnitId.get("unit-2")).toEqual([cards[0], cards[2]]);
    expect(projection.cardsByUnitId.get("unit-1")).toEqual([cards[1]]);
    expect(projection.cardsByUnitId.get("unit-3")).toBeUndefined();
    expect(projection.cardCountByUnitId.get("unit-2")).toBe(2);
    const projectedCards = [...projection.cardsByUnitId.values()].flat();
    expect(projectedCards).toHaveLength(cards.length);
    expect(new Set(projectedCards.map((projectedCard) => projectedCard.id)))
      .toEqual(new Set(cards.map((sourceCard) => sourceCard.id)));
  });

  it("rebuilds from changed authoritative arrays without stale entries", () => {
    const first = buildPracticeContentProjection(
      [unit("unit-1", 1)],
      [card("card-1", "unit-1", 1)],
    );
    const changedCard = card("card-2", "unit-2", 1);
    const second = buildPracticeContentProjection(
      [unit("unit-2", 2)],
      [changedCard],
    );

    expect(first.unitById.has("unit-1")).toBe(true);
    expect(second.unitById.has("unit-1")).toBe(false);
    expect(second.cardsByUnitId.get("unit-2")).toEqual([changedCard]);
    expect(second.cardsByUnitId.has("unit-1")).toBe(false);
  });
});

describe("practice content pagination", () => {
  it("uses page sizes that keep combined mounted rows below the B-02 budget", () => {
    expect(PRACTICE_CHAPTER_PAGE_SIZE).toBe(25);
    expect(PRACTICE_FLASHCARD_PAGE_SIZE).toBe(50);
    expect(MAX_MOUNTED_PRACTICE_CONTENT_ROWS).toBe(75);
    expect(MAX_MOUNTED_PRACTICE_CONTENT_ROWS).toBeLessThanOrEqual(100);
  });

  it.each([
    { count: 0, page: 1, expectedPage: 1, range: [0, 0], values: [] },
    { count: 1, page: 1, expectedPage: 1, range: [1, 1], values: [1] },
    { count: 3, page: 1, expectedPage: 1, range: [1, 3], values: [1, 2, 3] },
    { count: 4, page: 2, expectedPage: 2, range: [4, 4], values: [4] },
    { count: 8, page: 3, expectedPage: 3, range: [7, 8], values: [7, 8] },
    { count: 8, page: 99, expectedPage: 3, range: [7, 8], values: [7, 8] },
  ])("returns a deterministic bounded range for $count items on requested page $page", ({
    count,
    page,
    expectedPage,
    range,
    values,
  }) => {
    const result = paginateItems(
      Array.from({ length: count }, (_, index) => index + 1),
      3,
      page,
    );
    expect(result.currentPage).toBe(expectedPage);
    expect([result.visibleStart, result.visibleEnd]).toEqual(range);
    expect(result.items).toEqual(values);
  });

  it("clamps a page after deletion reduces the page count", () => {
    expect(clampPage(2, 4, 3)).toBe(2);
    expect(clampPage(2, 3, 3)).toBe(1);
    expect(paginateItems([1, 2, 3], 3, 2)).toMatchObject({
      currentPage: 1,
      items: [1, 2, 3],
      totalPages: 1,
    });
  });

  it.each([3, 4, 5])(
    "keeps a deterministic second page after deleting visible item %s",
    (removedItem) => {
      const remaining = [1, 2, 3, 4, 5, 6, 7]
        .filter((item) => item !== removedItem);
      expect(paginateItems(remaining, 3, 2)).toMatchObject({
        currentPage: 2,
        items: remaining.slice(3, 6),
      });
    },
  );

  it("locates appended items and rejects invalid page sizes", () => {
    expect(getPageForItemIndex(0, 25)).toBe(1);
    expect(getPageForItemIndex(24, 25)).toBe(1);
    expect(getPageForItemIndex(25, 25)).toBe(2);
    expect(() => paginateItems([], 0, 1)).toThrow("positive integer");
  });
});
