# StudyApp v1 Release Assessment

_Last updated: 2026-07-28_

## Assessment

The v1 release gate concentrates on the three user-data blockers identified by
the July 2026 audit and one release-time PWA risk:

- executable local content opening under the StudyApp origin;
- insufficiently validated destructive restore;
- CSV row-position-based flashcard identity;
- automatic PWA reload while a user may have unfinished input.

These blockers are resolved with focused policies, transactional behavior, and
regression tests. Current navigation and release wording now match the
implemented Home plus four-area product.

## Resolved release blockers

- Local uploads and stored-file opens use one allowlist. Active web/executable
  content is rejected, safe renderable formats preview, and Word formats
  download.
- Backups are size/count limited and fully validated before a preview,
  confirmation, and one IndexedDB transaction. Failure retains existing data.
- Spreadsheet flashcards use normalized unit/question/answer SHA-256 identity,
  independent of row order. Duplicate normalized cards are rejected.
- Service-worker updates show an Update now/Later prompt and never trigger an
  automatic active-page reload.

## Accepted v1 boundaries

StudyApp is local-first and browser-only. JSON backup does not include local
file blobs. Browser storage has finite capacity. Complete local-file export,
recursive nested split-PDF graph handling, broader session/persistence failure
states, and additional browser/tooling automation are not silently treated as
complete.

They are documented as non-blocking follow-up work in
[`V1_1_BACKLOG.md`](V1_1_BACKLOG.md). Release behavior and limitations are in
[`RELEASE_NOTES_v1.md`](RELEASE_NOTES_v1.md); execution evidence and the final
READY/NOT READY decision live in
[`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md).
