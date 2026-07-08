# Codex Task Queue

_Last updated: 2026-07-08_

The v1 hardening task queue is complete. Keep future Codex tasks small, focused, and aligned with `AGENTS.md`, `README.md`, `ROADMAP.md`, `DATA_MODEL.md`, and `BACKUP_AND_DATA_SAFETY.md`.

## Standard Preface

Read `AGENTS.md`, `README.md`, `AUDIT.md`, and `ROADMAP.md` first. Work only on the requested task. Keep the local-first/no-backend model. Avoid unrelated refactors. Run these checks when practical:

```bash
npm test
npm run typecheck
npm run build
```

## Completed v1 Hardening Tasks

### Task 1 - Review Queue Stability - Done

Fixed the due-card queue so rating one due card does not skip the next due card.

Status:

- stable review queue behavior is implemented;
- spaced-repetition scheduling remains unchanged;
- regression tests were added.

### Task 2 - Quiz Answer Lock - Done

Prevented rapid repeated answer clicks from submitting the same quiz question more than once.

Status:

- each question accepts only one answer;
- final quiz session recording is protected from duplicate submission;
- current quiz UX remains otherwise unchanged.

### Task 3 - CSV Header Validation - Done

Required expected headers in chapter and flashcard CSV imports.

Status:

- valid templates still import;
- wrong headers fail clearly;
- quoted CSV values still work;
- parser tests were added.

### Task 4 - CI Workflow - Done

Added GitHub Actions CI for pull requests and pushes to `main`.

Status:

- CI runs `npm ci`;
- CI runs `npm run typecheck`;
- CI runs `npm test`;
- CI runs `npm run build`.

### Task 5 - Source and Split PDF Deletion Behavior - Done

Improved source-file deletion so related split PDFs are detected and handled intentionally.

Status:

- source files without related split PDFs behave as before;
- source files with related split PDFs show clear user choices;
- deleting source and related split PDFs together uses a transaction;
- helper tests cover child detection and deletion choices.

### Task 6 - Backup Clarity - Done

Clarified that the current progress/settings backup does not include local file blobs.

Status:

- UI and docs use matching language;
- the user can understand what is saved and what is not;
- no new export implementation was added.

### Task 7 - File Content Hashing - Done

Added content hashing for newly saved local files and safer duplicate detection.

Status:

- new local files can store `contentHash`;
- generated split PDFs can store `contentHash`;
- duplicate detection prefers hashes when available;
- legacy files without hashes continue to load and use the conservative fallback.

### Task 8 - Complete Local-File Export Design - Done

Designed the future complete local-file export/import format without implementing it.

Status:

- export scope is clear;
- restore scope and safety rules are clear;
- browser storage and file-size limitations are documented;
- design lives in [`docs/LOCAL_FILE_EXPORT_DESIGN.md`](docs/LOCAL_FILE_EXPORT_DESIGN.md).

## Future Task Candidates

These are future tasks, not v1 hardening blockers:

- Implement complete local-file export/import from the design.
- Add PDF split progress feedback and compatibility-mode warnings.
- Replace quiz restart full page reload with React state reset.
- Introduce linting/formatting after agreeing on a formatting baseline.
- Add deeper backup/restore validation before any restore behavior expansion.
