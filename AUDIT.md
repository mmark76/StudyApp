# StudyApp Audit

_Last updated: 2026-07-08_

## Purpose

This audit records the current stability, data-safety, maintainability, and automation issues that should guide the next development phase.

It is a working audit for planning focused PRs.

## Overall assessment

StudyApp has a good local-first foundation, clear product boundaries, strict TypeScript, a small test suite, and sensible validation around file and link handling.

The main risk areas are:

- data lifecycle and backup expectations;
- source PDF deletion versus generated split PDFs;
- review and quiz state stability;
- missing automation such as CI, dependency review, linting, and formatting;
- limited test coverage for data import, backup, deletion, and queue behavior.

## Critical / high priority findings

### 1. Local files are not included in progress backups

Local files are stored in IndexedDB as `Blob` data, while the current backup model is progress/settings oriented. This is documented behavior, but it is still a real data-loss risk if the browser storage is cleared or the user changes device.

**Risk:** loss of saved PDFs, documents, images, and split PDFs.

**Recommended direction:** add a clearly labelled export path for local files, or add a complete backup mode that includes file blobs. Until then, keep the UI and documentation explicit about what is and is not backed up.

**Acceptance criteria:**

- The UI clearly states whether local files are included in a backup.
- Documentation states what can be restored and what cannot.
- A future complete backup/export feature includes tests for schema validation and file handling.

### 2. Deleting a source PDF can leave split PDFs orphaned

Split PDFs can keep a `sourceFileId` relation to the original source file. If a source file is deleted without considering those child files, Structured Study may contain split PDFs whose source no longer exists.

**Risk:** loss of traceability and confusing orphaned study material.

**Recommended direction:** when deleting a source file, detect child split PDFs and offer a clear choice: keep them, delete them, or cancel. Add an orphan indicator in Structured Study if kept.

**Acceptance criteria:**

- Source deletion detects related split PDFs.
- The user is warned before any destructive cascade.
- A test covers source deletion with zero, one, and multiple child split PDFs.

### 3. Review queue may skip cards after rating

The review page derives due cards from live progress data. After rating a card, the due set changes, and the current index can move past the next due card.

**Risk:** due cards can be skipped or review order can become unstable.

**Recommended direction:** use a stable review session queue or update the current index relative to the next due-card list without incrementing blindly.

**Acceptance criteria:**

- Rating one due card does not skip the next due card.
- Tests cover the regression.
- Existing spaced repetition behavior remains unchanged.

## Medium priority findings

### 4. Quiz answer submission lacks a double-submit lock

Rapid repeated clicks on an answer can cause duplicate state transitions or duplicate session writes.

**Acceptance criteria:**

- Each quiz question accepts only one answer.
- Rapid double-clicking does not double count.
- Tests cover duplicate answer submission where practical.

### 5. Duplicate file detection uses filename and size only

Two different files can share the same name and size. This may incorrectly treat a new file as an existing file.

**Recommended direction:** compute and store a content hash using Web Crypto where practical.

### 6. CSV import does not validate headers explicitly

The parser reads data by column position and skips the header row. It should reject unexpected headers with a clear message.

**Acceptance criteria:**

- Units and flashcard imports validate expected headers.
- Wrong headers produce a specific error.
- Tests cover valid headers, wrong headers, and quoted values.

### 7. PDF rendered split fallback can be heavy

Compatibility splitting renders pages to canvas and embeds JPEG output. This can consume memory and increase output size for large ranges.

**Recommended direction:** add progress feedback, smaller quality/scale options, and clear warnings when rendered output is used.

## Low priority findings

### 8. Quiz restart uses full page reload

Use React state reset instead of `window.location.reload()`.

### 9. Placement editors appear in multiple lists

This is functional but can feel repetitive. Consider consolidating editing into one explicit placement action.

### 10. Some layout choices are inline

Move repeated or responsive layout rules into CSS classes where possible.

## Test priorities

Add or improve tests for:

- review queue stability;
- quiz duplicate answer prevention;
- source deletion and split PDF handling;
- CSV header validation;
- malformed stored settings;
- backup and restore validation;
- local file classification and legacy split detection;
- URL validation and unsupported protocols;
- file hashing once introduced.

## Recommended implementation order

1. Fix review queue stability.
2. Add quiz answer lock.
3. Add CSV header validation.
4. Add CI workflow for typecheck, tests, and build.
5. Add source deletion handling for split PDFs.
6. Add documentation and UI warnings for local-file backup limitations.
7. Add file hashing.
8. Add complete export/backup for local files.
9. Add linting and formatting.
10. Polish placement editing and PDF split progress.
