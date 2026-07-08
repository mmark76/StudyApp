# StudyApp Roadmap

_Last updated: 2026-07-08_

This roadmap defines the recommended sequence of work. It should be updated when priorities change or when a phase is completed.

## Phase 1 — Stability fixes

Goal: remove bugs that can make study sessions unreliable.

### 1. Review queue stability

Fix the review flow so rating one due card does not skip the next due card.

Expected outcome:

- due cards are processed predictably;
- spaced repetition scheduling remains unchanged;
- regression tests are added where practical.

### 2. Quiz duplicate-answer protection

Prevent rapid repeated clicks from submitting the same quiz question more than once.

Expected outcome:

- each question accepts one answer;
- final quiz session is recorded once;
- current UX remains otherwise unchanged.

### 3. CSV import validation

Validate spreadsheet headers and give clear import errors.

Expected outcome:

- valid templates continue to work;
- wrong headers fail early;
- parser tests cover normal and malformed imports.

## Phase 2 — Data safety

Goal: make user data lifecycle explicit and resilient.

### 4. Source deletion and split PDF handling

When a source PDF is deleted, detect split PDFs created from it and guide the user.

Expected outcome:

- no silent orphaning;
- no silent destructive cascade;
- clear confirmation and documented behavior.

### 5. Backup and file export clarity

Make it impossible for the user to misunderstand what backups include.

Expected outcome:

- docs and UI agree;
- progress/settings backup is clearly labelled;
- future complete backup/export path is specified.

### 6. File content hashing

Use content hashes to identify duplicate local files more reliably than filename and size alone.

Expected outcome:

- duplicate detection is safer;
- legacy files without hashes still work;
- new data fields are introduced with a migration plan if needed.

### 7. Complete local-file export

Add a safe export path for locally stored files and split PDFs.

Expected outcome:

- users can preserve study files before clearing browser storage or changing device;
- export format is documented;
- restore limitations are clear.

## Phase 3 — Automation and code quality

Goal: protect the main branch and reduce manual checks.

### 8. CI workflow

Run install, typecheck, tests, and build on pull requests and pushes.

Expected outcome:

- `npm ci` runs in CI;
- `npm run typecheck` runs in CI;
- `npm test` runs in CI;
- `npm run build` runs in CI.

### 9. Dependency maintenance

Add Dependabot and consider dependency-review checks.

Expected outcome:

- dependency updates are visible and reviewable;
- lockfile changes are explicit;
- risky dependency updates are not merged blindly.

### 10. Linting and formatting

Introduce ESLint and Prettier only when the repository is ready for a formatting baseline.

Expected outcome:

- style rules are automated;
- unrelated formatting churn is avoided;
- future PRs are easier to review.

## Phase 4 — UX polish

Goal: make the app clearer and easier to use without changing the core model.

### 11. Placement editing UX

Reduce repeated placement editors and make final placement correction clearer.

### 12. PDF split progress

Add progress feedback and compatibility-mode warnings for rendered PDF splitting.

### 13. Responsive layout cleanup

Move inline layout decisions into CSS classes and improve narrow-width behavior.

### 14. Quiz restart polish

Replace full page reload with local React state reset.

## Working rule

Prefer small PRs. Each PR should address one roadmap item unless a shared test or small documentation update is directly required.
