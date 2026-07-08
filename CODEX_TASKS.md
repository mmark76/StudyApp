# Codex Task Queue

_Last updated: 2026-07-08_

Use these tasks one at a time. Each task should become a small, focused PR.

## Standard preface

Read `AGENTS.md`, `README.md`, `AUDIT.md`, and `ROADMAP.md` first. Work only on the requested task. Keep the local-first/no-backend model. Avoid unrelated refactors. Run these checks when practical:

```bash
npm test
npm run typecheck
npm run build
```

## Task 1 — Review queue stability

Fix the due-card queue so that rating one due card does not skip the next due card.

Scope:

- `src/features/review/ReviewPage.tsx`
- review-related tests if practical

Acceptance criteria:

- Rating a card does not skip the next due card.
- The spaced-repetition algorithm is not changed unless needed.
- A regression test is added where practical.

## Task 2 — Quiz answer lock

Prevent rapid repeated answer clicks from submitting the same quiz question more than once.

Scope:

- `src/features/quiz/QuizPage.tsx`
- quiz-related tests if practical

Acceptance criteria:

- Each question accepts only one answer.
- The final quiz session is recorded once.
- Current quiz behavior remains otherwise unchanged.

## Task 3 — CSV header validation

Require the expected headers in chapter and flashcard CSV imports.

Scope:

- `src/features/content-import/spreadsheetImport.ts`
- import-related tests

Acceptance criteria:

- Valid templates still import.
- Wrong headers fail clearly.
- Quoted CSV values still work.

## Task 4 — CI workflow

Add GitHub Actions CI for pull requests and pushes to `main`.

Scope:

- `.github/workflows/ci.yml`

Acceptance criteria:

- CI runs `npm ci`.
- CI runs `npm run typecheck`.
- CI runs `npm test`.
- CI runs `npm run build`.

## Task 5 — Source and split PDF deletion behavior

Improve source-file deletion so related split PDFs are detected and handled intentionally.

Scope:

- `src/features/library/LibraryPage.tsx`
- helper module/tests if useful

Acceptance criteria:

- Source files without related split PDFs behave as before.
- Source files with related split PDFs show clear user choices.
- Multi-record changes use a transaction.

## Task 6 — Backup clarity

Clarify that current progress/settings backup does not include local file blobs.

Scope:

- backup/export UI files if present
- `README.md`
- `BACKUP_AND_DATA_SAFETY.md`

Acceptance criteria:

- UI and docs use matching language.
- The user can understand what is saved and what is not.
- No new export implementation is added in this task.

## Task 7 — File content hashing

Add content hashing for newly saved local files and use it for safer duplicate detection.

Scope:

- `src/shared/types/models.ts`
- local file upload/split helpers
- tests where practical

Acceptance criteria:

- New files can store a content hash.
- Duplicate detection prefers the hash when available.
- Legacy files continue to load.

## Task 8 — Complete local-file export design

Design the future complete export format before implementation.

Scope:

- `BACKUP_AND_DATA_SAFETY.md`
- `DATA_MODEL.md`
- optional ADR

Acceptance criteria:

- Export scope is clear.
- Restore scope is clear.
- Browser storage and file-size limitations are documented.
