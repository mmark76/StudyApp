# StudyApp v1.1 Backlog

_Last updated: 2026-07-31_

This is the explicit stopping-point backlog after v1.0.0 plus the post-v1 AI
Assistant preview. Items must be handled in separate, focused work. Priority
reflects reliability, security, privacy, and financial risk; it is not a decision
to reopen the historical v1 release scope.

## Completed after v1.0.0

The focused July 28 release-hardening follow-up added shared
local-storage/data-safety notices and direct download for generated split PDFs,
including a latest-result **Download all** action.

The short-lived July 29–30 post-v1 preview formerly included:

- mock AI Assistant tasks and sample results;
- deliberate source selection and confirmation screens;
- locally stored test credits and mock package presentation;
- Cloud Core readiness checking and assistant availability status;
- a user-facing AI Assistant guide.

Those mock tasks, test credits, package presentation and readiness UI were
removed by the July 31 simplification. They never performed production AI
requests or real charges. The governing boundary is
[`docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md`](docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md).

The July 31 simplification replaced the Companion's local import, prompt,
clipboard and scripted-popup workflow with a two-screen Assistant and a normal
external link to the approved Custom GPT. It also added focus trapping,
background inertness, Escape close and launcher focus restoration.

The July 31 minimum audit remediation also aligned the English and Greek local
storage notices. Both now explain browser/device-local storage, realistic loss
conditions, storage availability, the incomplete JSON file-backup boundary and
the need to keep original files and required copies outside StudyApp.

## P0 — Production AI and financial safety gates

The following items are prerequisites for real AI requests or payments. They
must not be combined into one uncontrolled implementation PR.

### Remote task contract and explicit consent

Define versioned request and response schemas for each task type: question,
flashcards, quiz, summary, and explanation. Specify the exact selected content
and metadata sent, show it before submission, require explicit confirmation,
and prevent automatic library or current-document scanning.

Acceptance requires tests proving that unselected material, local files,
progress, links, settings, backups, and unrelated database records are never
included.

### Authentication and authorisation model

Decide whether production AI requires accounts, guest sessions, device-bound
credentials, or another model. Define least-privilege access, token expiry,
revocation, recovery, cross-user isolation, and protection against replay and
session fixation. No privileged provider secret may enter the frontend bundle.

### Prompt-injection and untrusted-document threat model

Treat selected study material as untrusted input. Define separation between
system policy, user instructions, and source content; parser and extraction
limits; prohibited tool or URL execution; malicious-document cases; and safe
failure behaviour.

### Generated-output validation and review

Define strict runtime schemas, size limits, item limits, source traceability,
and validation for all generated content. Keep every result in a draft/review
state until the user explicitly saves it. Save related records transactionally
and reject malformed or incomplete output safely.

### Remote task lifecycle and idempotency

Define submission, reservation, processing, completion, cancellation, timeout,
retry, stale-result, and duplicate-request behaviour. A health check must not be
used as proof that a task succeeded. Add stable task identifiers and idempotency
keys before production use.

### Server-authoritative credits and ledger

Replace the mock wallet only through a separate, reviewed financial design.
Define immutable server-side ledger entries for purchase, reservation,
settlement, release, refund, adjustment, and reconciliation. Prevent negative
balances, duplicate charging, replay, race conditions, and client tampering.

### Payments, legal, tax, and recovery

Define the legal seller, payment processor, supported currencies, taxes,
receipts, refunds, disputes, failed-payment handling, account/device transfer,
and recovery. Authenticate and deduplicate payment-provider webhooks. Complete
legal and privacy review before enabling purchases.

### Retention, deletion, logging, and incident response

Define what Cloud Core and any AI provider retain, for how long, and for what
purpose. Exclude study content and secrets from logs by default. Add deletion,
access-control, incident-response, and provider-contract requirements.

## P1 — Local data and runtime reliability

### Recursive split-PDF relationship safety

Traverse the complete `sourceFileId` descendant graph when previewing or
deleting nested split PDFs. Detect cycles, show all affected records, and cover
deep descendant cases transactionally. Current direct-child handling prevents
silent direct cascades, but retained nested descendants can lose lineage.

### PDF quota, duplication, and cancellation

Estimate browser storage where supported, prevent avoidable duplicate source and
output blobs, process large jobs incrementally, add cancellation and useful
progress, and add stress/failure tests. Preserve the current 50 MB per-file and
50-chunk limits unless evidence supports a safer change.

### Accurate study-session lifecycle

Record actual session start separately from completion, define completion
consistently across flashcards/review/quiz, record due-review sessions, and
prevent partial or duplicate session history.

### Persistence failure states

Chapter creation, flashcard creation and appearance settings now await local
writes, lock duplicate submissions, retain input on failure and expose
bilingual failure feedback with deterministic browser tests. Continue this
pattern for the remaining content-management/settings writes and future
generated-content saves.

### Corrupt stored-content recovery

Replace silent fallback-to-empty behaviour with validated error states and
recovery/export choices so corrupt imported content cannot look like an
intentional empty collection.

### AI preview accessibility and interruption safety

Focus trapping and restoration, inert background, Escape close and bilingual
Assistant navigation now have browser coverage. Add the remaining browser tests
for screen-reader status, 200% zoom, narrow layouts, offline/online transitions,
service timeout, repeated connection checks and PWA updates while the dialog is
open.

### Service-status state correctness

Test race conditions between focus, browser online/offline events, manual retry,
unmount, slow responses, and stale responses. Distinguish service readiness from
task availability and task success in both code and wording.

## P2 — Import, storage, platform, and AI design hardening

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

### Generated-content data model

Define whether AI-assisted answers, notes, summaries, flashcards, and quizzes
need provenance fields such as source file, chapter, page/range, task ID, model,
creation time, user edits, and verification state. Keep the schema useful even
when AI is unavailable or disabled.

### Provider-neutral Cloud Core client

Keep provider credentials and provider-specific response formats behind Cloud
Core. Define typed frontend contracts, version negotiation, timeout and retry
policy, request-size limits, and safe error codes without exposing internal
infrastructure details.

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
IndexedDB persistence, PDF split flows, keyboard navigation, live regions, 200%
zoom, narrow/mobile layouts, and the AI preview states.

## P3 — Maintainability and product polish

- Add a low-churn ESLint baseline, formatting checks, coverage reporting, and
  dependency-advisory scanning.
- Review route-level code splitting for the current production bundle-size
  warning without weakening offline behaviour.
- Replace quiz restart page reload with a React state reset.
- Add an explicit due-review completion state and consistent session summary.
- Improve PDF compatibility-mode guidance.
- Review appearance-setting failure feedback and remaining inline layout rules.
- Consolidate historical audit/update documents without removing traceability.
- Add a visible build/environment label so test, staging, and future production
  AI configurations cannot be confused.
- Review all AI and credit wording for consistent use of preview, test mode,
  readiness, estimate, reservation, charge, release, and refund.

## Documentation rule

Historical v1 documents may retain their release-gate statements. Living
product and engineering documents must distinguish:

1. released local-first functionality;
2. current AI Assistant external handoff and inactive future modes;
3. future production AI, account, payment, or cloud capabilities.

Update legal, privacy, security, architecture, user guide, and data-safety text
in the same PR as any boundary-changing implementation.

## Exit rule

Select one focused backlog item per branch/PR. Define its data-safety, privacy,
security, accessibility, and—where relevant—financial impact. Run the full
repository verification gate before merge:

```bash
npm ci
npm run typecheck
npm test
npm run build
```
