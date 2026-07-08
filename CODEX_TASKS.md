# Codex Task Queue

Last updated: 2026-07-08

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

## Post-v1 Implementation Order

These tasks are future tasks, not v1 hardening blockers. Implement them after the `v1.0.0-rc.1` release candidate tag.

The order is intentional:

1. Strengthen restore safety first.
2. Implement complete local-file export/import after restore validation is safer.
3. Improve PDF split feedback.
4. Polish quiz and review UX.
5. Improve storage quota feedback.
6. Add linting/formatting last, after the feature/data-safety work is stable.

---

### Task 9 - Restore Preview and Stronger Backup Validation

Priority: P1  
Status: should be done before expanding restore behavior

Strengthen the current progress/settings restore flow before broader import behavior is added.

Scope:

- Validate schema version.
- Validate ISO date fields.
- Validate number ranges.
- Validate duplicate IDs.
- Validate supported setting keys.
- Validate flashcard/unit/progress relationships where possible.
- Show counts before restore.
- Show warnings before destructive replacement.
- Require explicit confirmation before clearing existing progress/settings.

Safety requirements:

- Do not clear existing data until validation passes.
- Do not report success after partial restore.
- Keep restore wording clear that current progress/settings backups do not include local file blobs.
- Keep the current local-first/no-backend model unchanged.

Checks:

```bash
npm test
npm run typecheck
npm run build
```

---

### Task 10 - Complete Local-File Export/Import

Priority: P1  
Status: next major data-safety task

Implement the complete local-file export/import feature from `docs/LOCAL_FILE_EXPORT_DESIGN.md`.

Scope:

- Export progress records.
- Export study sessions.
- Export settings.
- Export imported units and flashcards.
- Export saved cloud links.
- Export local file metadata.
- Export local file Blob data.
- Preserve split PDF relationships through `sourceFileId`.
- Preserve `contentHash` values where available.
- Include manifest/schema version/export timestamp.
- Include checksum or integrity validation.

Safety requirements:

- Do not call this a complete backup unless local file blobs are included.
- Validate archive structure before writing anything.
- Show a restore preview before import.
- Never silently overwrite local data.
- Support explicit merge or replace mode only after confirmation.
- Use transactions or staged writes where possible.
- Clearly report skipped, invalid, duplicate, or oversized records.
- Do not upload files or send study material outside the browser.

Checks:

```bash
npm test
npm run typecheck
npm run build
```

---

### Task 11 - PDF Split Progress and Compatibility Feedback

Priority: P2  
Status: UX and performance safety improvement

Improve feedback during PDF splitting, especially compatibility rendering mode.

Scope:

- Show progress while splitting multiple chunks.
- Show current chunk/page where practical.
- Warn when compatibility rendering mode will be used.
- Explain that compatibility output may be larger or slower.
- Keep the 50 MB output protection.
- Keep the existing source/split PDF relationship behavior.

Safety requirements:

- Do not upload PDFs or send data outside the browser.
- Do not weaken local-first privacy wording.
- Preserve generated split PDF metadata.
- Preserve `sourceFileId`.
- Keep object URL and local file handling safe.

Checks:

```bash
npm test
npm run typecheck
npm run build
```

---

### Task 12 - Replace Quiz Restart Page Reload

Priority: P2  
Status: small UX polish

Replace the current full page reload used to start a new quiz with a local React state reset.

Scope:

- Reset quiz index.
- Reset score.
- Reset finished state.
- Reset answer lock.
- Generate a new quiz without reloading the whole app.
- Keep duplicate-answer protection intact.

Safety requirements:

- Do not change scoring rules.
- Do not create duplicate study sessions.
- Do not weaken the answer-lock behavior.
- Add or update regression tests for the restart behavior if practical.

Checks:

```bash
npm test
npm run typecheck
npm run build
```

---

### Task 13 - Review Session Completion State

Priority: P2  
Status: review UX polish

Make the end of a due-review session explicit.

Scope:

- Show a "Review session complete" state when the snapshot queue is finished.
- Show reviewed count.
- Provide a "Check again" or "Start new review session" action.
- Preserve the stable review queue behavior.
- Do not allow live IndexedDB updates to skip or repeat cards inside the active session.

Safety requirements:

- Do not change the spaced-repetition algorithm unless explicitly requested.
- Do not create duplicate progress records.
- Keep scheduling deterministic in tests.
- Keep the existing due-review snapshot behavior stable.

Checks:

```bash
npm test
npm run typecheck
npm run build
```

---

### Task 14 - Add Storage Quota Feedback

Priority: P2  
Status: local-file reliability improvement

Improve user feedback when browser storage may be insufficient for local files or split PDFs.

Scope:

- Use `navigator.storage.estimate()` where supported.
- Warn when available storage appears low.
- Improve messages for quota/storage failures.
- Preserve the 50 MB per-file limit.
- Keep recommending cloud links for large files.
- Keep the original-file safety guidance visible.

Safety requirements:

- Do not introduce remote storage.
- Do not upload files.
- Do not add cloud sync.
- Do not add analytics or telemetry.
- Keep local-file warnings clear and user-facing.

Checks:

```bash
npm test
npm run typecheck
npm run build
```

---

### Task 15 - Introduce Linting and Formatting Baseline

Priority: P3  
Status: maintainability improvement

Add linting and formatting only after the repository is ready for a controlled baseline.

Scope:

- Add ESLint with TypeScript and React rules.
- Keep the initial rule set modest.
- Add Prettier only in a separate PR if formatting churn would be large.
- Add npm scripts for lint/format checking.
- Add CI lint step after the baseline passes.

Safety requirements:

- Avoid unrelated refactors.
- Do not mix formatting-only changes with functional changes.
- Keep one focused PR for the baseline.
- Do not change application behavior as part of the linting baseline.

Checks:

```bash
npm test
npm run typecheck
npm run build
npm run lint
```
