# StudyApp Audit

_Last updated: 2026-07-08_

## Purpose

This audit records the current stability, data-safety, maintainability, and automation state for the v1 release candidate.

## Overall Assessment

StudyApp is in a **v1 hardening complete** state. The main local-first workflows are source-visible, browser-only, offline-ready, and protected by TypeScript, Vitest tests, and GitHub Actions CI.

The v1 hardening pass addressed the highest-risk study-session and local-file lifecycle issues:

- review queue stability;
- quiz duplicate-answer protection;
- CSV header validation;
- source/split-PDF deletion handling;
- progress/settings backup clarity;
- local file content hashing for new records;
- complete local-file export/import design;
- CI for install, typecheck, tests and build.

This does not mean the app has full local-file export/import yet. Current progress/settings backup still does not include local file blobs, and users should keep original PDFs and files outside StudyApp.

## Resolved v1 Hardening Findings

### 1. Local Files Are Not Included in Progress Backups - Clarified

Status: documented and reflected in user-facing backup copy.

The current JSON backup is intentionally progress/settings oriented. It includes progress, sessions and settings-backed data, but not local file blobs such as uploaded PDFs, documents, images or generated split PDFs.

Remaining future work:

- implement complete local-file export/import from [`docs/LOCAL_FILE_EXPORT_DESIGN.md`](docs/LOCAL_FILE_EXPORT_DESIGN.md).

### 2. Deleting a Source PDF Can Leave Split PDFs Orphaned - Fixed

Status: source deletion now detects related split PDFs by `sourceFileId` and requires an intentional user choice.

Current behavior:

- files without related split PDFs keep the simple delete confirmation;
- source files with related split PDFs allow cancel;
- the user may keep split PDFs intentionally;
- the user may delete source and related split PDFs together;
- multi-file deletion uses a transaction.

### 3. Review Queue May Skip Cards After Rating - Fixed

Status: review sessions use a stable due-card queue so rating one due card does not skip the next due card.

Regression tests cover the queue behavior. The spaced-repetition algorithm was not changed.

### 4. Quiz Answer Submission Lacks a Double-Submit Lock - Fixed

Status: quiz answers are guarded so rapid repeated clicks do not submit the same question twice.

Tests cover the answer lock helper.

### 5. Duplicate File Detection Uses Filename and Size Only - Improved

Status: new local files and generated split PDFs can store a SHA-256 `contentHash`, and duplicate detection prefers `contentHash` when available.

Legacy files without `contentHash` remain readable and use the conservative name/size fallback.

### 6. CSV Import Does Not Validate Headers Explicitly - Fixed

Status: chapter/unit and flashcard CSV imports require the expected headers and preserve quoted CSV value support.

Tests cover valid headers, wrong headers and quoted values.

### 7. Missing Automation - Improved

Status: GitHub Actions CI runs install, typecheck, tests and build on pull requests and pushes to `main`.

Dependabot is configured for npm and GitHub Actions updates.

## Remaining Future Work

These items are not v1 hardening blockers, but they remain useful next steps.

### Complete Local-File Export/Import

The design exists in [`docs/LOCAL_FILE_EXPORT_DESIGN.md`](docs/LOCAL_FILE_EXPORT_DESIGN.md). Implementation remains future work.

The current progress/settings backup still does not include local file blobs.

### PDF Split Progress and Compatibility Feedback

Compatibility splitting can be heavy for large page ranges. Future work should add progress feedback, clearer compatibility-mode warnings and possibly quality/scale options.

### Quiz Restart Polish

The quiz restart still uses a full page reload. Replacing it with local React state reset would be a small UX polish task.

### Placement Editing UX

Placement editors appear in multiple lists. This is functional, but future UX polish could consolidate final placement correction.

### Linting and Formatting

ESLint and Prettier remain future work. Add them only when the repository is ready for a formatting baseline to avoid unrelated churn.

### Complete Backup/Restore Validation Expansion

Before expanding restore behavior, add stricter runtime validation, preview summaries and tests for malformed, duplicate, missing and oversized data.

## Test Priorities After v1

Future test expansion should prioritise:

- complete local-file export/import validation when implemented;
- quota and large-Blob failure paths;
- restore preview and conflict handling;
- orphaned split PDF indicators if added;
- PDF split progress and compatibility behavior;
- keyboard accessibility of import/export controls.

## Recommended Next Implementation Order

1. Implement complete local-file export/import from the design.
2. Add PDF split progress and compatibility warnings.
3. Replace quiz restart page reload with React state reset.
4. Add stricter restore preview/validation before expanding backup behavior.
5. Introduce linting/formatting after agreeing on a baseline.
