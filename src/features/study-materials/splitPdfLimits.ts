export const MAX_SPLIT_TOTAL_PAGES = 500;
export const MAX_SPLIT_TOTAL_OUTPUT_SIZE = 100 * 1024 * 1024;
export const MAX_RENDERED_PAGE_PIXELS = 25_000_000;
export const MAX_RENDERED_TOTAL_PIXELS = 100_000_000;

export function assertSplitPageBudget(
  ranges: readonly { pageIndexes: readonly number[] }[],
): void {
  const totalPages = ranges.reduce((total, range) => total + range.pageIndexes.length, 0);
  if (totalPages > MAX_SPLIT_TOTAL_PAGES) {
    throw new Error(`The selected chunks contain more than ${MAX_SPLIT_TOTAL_PAGES} pages in total.`);
  }
}

export function addSplitOutputSize(totalBytes: number, nextBytes: number): number {
  const nextTotal = totalBytes + nextBytes;
  if (nextTotal > MAX_SPLIT_TOTAL_OUTPUT_SIZE) {
    throw new Error("The generated PDFs are larger than the 100 MB total limit.");
  }
  return nextTotal;
}

export function addRenderedPixelCount(
  totalPixels: number,
  width: number,
  height: number,
): number {
  const pagePixels = width * height;
  if (!Number.isSafeInteger(pagePixels) || pagePixels > MAX_RENDERED_PAGE_PIXELS) {
    throw new Error("A PDF page is too large for safe compatibility splitting.");
  }
  const nextTotal = totalPixels + pagePixels;
  if (!Number.isSafeInteger(nextTotal) || nextTotal > MAX_RENDERED_TOTAL_PIXELS) {
    throw new Error("The selected pages are too large for safe compatibility splitting.");
  }
  return nextTotal;
}
