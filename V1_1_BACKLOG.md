# StudyApp v1.1 Backlog

_Created: 2026-07-28_

This is the explicit stopping-point backlog after v1.0.0. These items are not
part of the v1 release and must be handled in separate, focused work. Priority
reflects reliability impact, not a decision to reopen the v1 scope.

## Release-hardening items completed after v1.0.0

The focused July 28 hardening follow-up added shared local-storage/data-safety
notices and direct download for generated split PDFs, including a latest-result
**Download all** action. These items are no longer backlog work. Complete
local-file archive export/import and broader browser automation remain deferred
below.

## P1 — Data and runtime reliability

### Recursive split-PDF relationship safety

Traverse the complete `sourceFileId` descendant graph when previewing or
deleting nested split PDFs. Detect cycles, show all affected records, and cover
deep descendant cases transactionally. Current direct-child handling prevents
silent direct cascades, but retained nested descendants can lose lineage.

### PDF quota, duplication, and cancellation

Estimate browser storage where supported, prevent avoidable duplicate source
and output blobs, process large jobs incrementally, add cancellation and useful
progress, and add stress/failure tests. Preserve the current 50 MB per-file and
50-chunk limits unless evidence supports a safer change.

### Accurate study-session lifecycle

Record the actual session start separately from completion, define completion
consistently across flashcards/review/quiz, record due-review sessions, and
prevent partial or duplicate session history.

### Persistence failure states

Make UI advancement depend on successful IndexedDB writes, add retry/recovery
messages, and inject write failures in tests for flashcards, reviews, quizzes,
content management, and settings.

### Corrupt stored-content recovery

Replace silent fallback-to-empty behavior with validated error states and
recovery/export choices so corrupt imported content cannot look like an
intentional empty collection.

## P2 — Import, storage, and platform hardening

### Import limits and CSV grammar validation

Add file-size and row-count limits, reject malformed quoting and trailing
invalid data, and show an import preview with create/update/conflict counts.

### Complete local-file export/import

Implement the versioned archive design in
[`docs/LOCAL_FILE_EXPORT_DESIGN.md`](docs/LOCAL_FILE_EXPORT_DESIGN.md), including
blob data, integrity checks, relationship validation, and explicit merge or
replace confirmation.

### Cloud-link policy

Decide whether new user links must be HTTPS-only, define compatibility for
existing HTTP records, and make Structured Study removal semantics distinguish
unplacing from deleting a shared saved-link record.

### Deterministic build and deployment

Remove wall-clock time from the build artifact identifier, use lockfile-based
installation in deployment, consolidate duplicate verification workflows, and
pin third-party actions to reviewed immutable revisions.

### React Router major update

Review and test migration to React Router 8.3.0 or later. The current npm audit
finding
([GHSA-qwww-vcr4-c8h2](https://github.com/advisories/GHSA-qwww-vcr4-c8h2))
affects only unstable RSC APIs, which StudyApp does not use, so it is not an
exploitable v1 path. Do not use `npm audit fix --force` or accept an automatic
major/downgrade without a focused compatibility review.

### Browser integration and accessibility baseline

Add focused browser tests for uploads, unsafe-file rejection, restore rollback,
IndexedDB persistence, PDF split flows, keyboard navigation, live regions,
200% zoom, and narrow/mobile layouts.

## P3 — Maintainability and product polish

- Add a low-churn ESLint baseline, formatting checks, coverage reporting, and
  dependency-advisory scanning.
- Review route-level code splitting for the current production bundle-size
  warning without weakening offline behavior.
- Replace quiz restart page reload with a React state reset.
- Add an explicit due-review completion state and consistent session summary.
- Improve PDF compatibility-mode guidance.
- Review appearance-setting failure feedback and remaining inline layout rules.
- Consolidate historical audit/update documents without removing traceability.

## Exit rule

Do not start these items as part of the v1 release gate. Select one focused
item per future branch/PR, define its data-safety impact, and run the repository
verification gate before merge.
