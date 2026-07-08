# StudyApp Roadmap

_Last updated: 2026-07-08_

This roadmap defines the recommended sequence of work. The v1 hardening pass is complete; remaining items are future work.

## Phase 1 - Stability Fixes - Done

Goal: remove bugs that can make study sessions unreliable.

### 1. Review Queue Stability - Done

The review flow now uses a stable due-card queue so rating one due card does not skip the next due card.

Completed outcome:

- due cards are processed predictably;
- spaced repetition scheduling remains unchanged;
- regression tests were added.

### 2. Quiz Duplicate-Answer Protection - Done

Rapid repeated answer clicks are guarded so each quiz question accepts one answer.

Completed outcome:

- each question accepts one answer;
- final quiz session recording is protected from duplicate submission;
- current quiz UX remains otherwise unchanged.

### 3. CSV Import Validation - Done

Spreadsheet imports now validate expected chapter and flashcard headers and keep quoted CSV values working.

Completed outcome:

- valid templates continue to work;
- wrong headers fail early;
- parser tests cover normal and malformed imports.

## Phase 2 - Data Safety - v1 Hardening Done

Goal: make user data lifecycle explicit and resilient.

### 4. Source Deletion and Split PDF Handling - Done

When a source PDF is deleted, related split PDFs are detected and the user can cancel, keep split PDFs intentionally, or delete source and split PDFs together.

Completed outcome:

- no silent orphaning;
- no silent destructive cascade;
- clear confirmation and documented behavior.

### 5. Backup and File Export Clarity - Done

Backup wording now distinguishes current progress/settings backup from future complete local-file export.

Completed outcome:

- docs and UI agree;
- progress/settings backup is clearly labelled;
- future complete backup/export path is specified.

### 6. File Content Hashing - Done

New local files and generated split PDFs can store `contentHash` values, and duplicate detection prefers hash matches.

Completed outcome:

- duplicate detection is safer;
- legacy files without hashes still work;
- the optional `contentHash` field was added without an IndexedDB schema change.

### 7. Complete Local-File Export Design - Done

The future complete local-file export/import design is documented in [`docs/LOCAL_FILE_EXPORT_DESIGN.md`](docs/LOCAL_FILE_EXPORT_DESIGN.md).

Completed design outcome:

- export format is specified;
- restore behavior and safety rules are specified;
- browser storage and file-size limitations are documented.

Implementation remains future work:

- users still need to keep original files outside StudyApp;
- current progress/settings backup still does not include local file blobs;
- no complete local-file export/import UI exists yet.

## Phase 3 - Automation and Code Quality - Partly Done

Goal: protect the main branch and reduce manual checks.

### 8. CI Workflow - Done

CI runs install, typecheck, tests and build on pull requests and pushes to `main`.

Completed outcome:

- `npm ci` runs in CI;
- `npm run typecheck` runs in CI;
- `npm test` runs in CI;
- `npm run build` runs in CI.

### 9. Dependency Maintenance - Done

Dependabot is configured for npm and GitHub Actions updates.

Completed outcome:

- dependency updates are visible and reviewable;
- lockfile changes are explicit;
- risky dependency updates are not merged blindly through the normal review process.

### 10. Linting and Formatting - Future

Introduce ESLint and Prettier only when the repository is ready for a formatting baseline.

Expected outcome:

- style rules are automated;
- unrelated formatting churn is avoided;
- future PRs are easier to review.

## Phase 4 - UX Polish - Future

Goal: make the app clearer and easier to use without changing the core model.

### 11. Placement Editing UX

Reduce repeated placement editors and make final placement correction clearer.

### 12. PDF Split Progress

Add progress feedback and compatibility-mode warnings for rendered PDF splitting.

### 13. Responsive Layout Cleanup

Move inline layout decisions into CSS classes and improve narrow-width behavior.

### 14. Quiz Restart Polish

Replace full page reload with local React state reset.

## Working Rule

Prefer small PRs. Each PR should address one roadmap item unless a shared test or small documentation update is directly required.
