# StudyApp v1.1 Backlog

_Last updated: 2026-11-26 (audit); original backlog baseline: 2026-07-31_

This is the explicit stopping-point backlog after v1.0.0 plus the post-v1 AI
Assistant changes. Items must be handled in separate, focused work. Priority
reflects reliability, security, privacy, and financial risk; it is not a decision
to reopen the historical v1 release scope.

## Audit snapshot — 2026-11-26

Audited against fetched `main` at
[`cd05c9727492a0c478aaa0d69db6bc858998a47f`](https://github.com/mmark76/StudyApp/commit/cd05c9727492a0c478aaa0d69db6bc858998a47f)
(application version **1.5.21**). Status reflects that source tree, its tests
and merged PR history, not unmerged branches or external service assumptions.
In particular, open security PR #375 is excluded from completed implementation.

**Historical traceability:** the original 2026-07-31 requirements and P0–P3
ordering are retained below, including dated wording such as “current” and
“now.” Each added audit block states the current result and any remaining scope;
it supersedes outdated implementation claims without deleting the requirement.
The original priority of a completed or partially completed item is unchanged.
Stable audit IDs identify the existing items; they do not create new scope.

- **Completed:** the original bounded behavior is implemented, with code/test
  evidence and any specific verification limitation stated.
- **Partially completed:** relevant behavior exists, but named acceptance
  criteria or required coverage remain open.
- **Pending:** the requested decision/implementation has not been established.
- **Obsolete:** superseded or deliberately removed scope, retained for history;
  absence of a current implementation alone does not make a future gate obsolete.
- **Requires verification:** evidence is insufficient or the historical
  premise/target must be revalidated before scheduling or closing the item.

| Existing priority | Completed | Partially completed | Pending | Obsolete | Requires verification |
| --- | ---: | ---: | ---: | ---: | ---: |
| P0 | 0 | 6 | 2 | 0 | 0 |
| P1 | 1 | 6 | 0 | 0 | 0 |
| P2 | 0 | 6 | 1 | 0 | 1 |
| P3 | 2 | 6 | 1 | 0 | 0 |
| **Total: 32 existing items** | **3** | **24** | **4** | **0** | **1** |

The removed preview capabilities in the historical completion narrative are
classified separately below; they are not additional active priority items.
The approved follow-up order in
[the hardening checkpoint](docs/HARDENING_STATUS_20260816.md#planned-order)
is preserved; this audit neither reprioritises it nor declares its open capacity,
backup or import-throughput work complete.

**Verification boundary:** source/tests and relevant merged PRs were inspected.
The existing [successful CI run on the audited SHA](https://github.com/mmark76/StudyApp/actions/runs/45816504716)
reports 318 unit tests, 104 Chromium E2E tests, 32 companion tests, Windows stop
safety, production build and package verification. Those are prior executed CI
results, not a new full-suite run for this documentation edit. The earlier local
Windows full E2E run had one animation-timing failure (103/104), followed by
three passing isolated reruns. A fresh production-only npm audit on this source
passed on 2026-11-26. Neither passing CI nor a dependency scan closes untested
acceptance criteria, proves real provider/legal review, or constitutes manual
screen-reader/Firefox/WebKit verification. Relative evidence links refer to
the audited tree; the SHA above fixes the historical source context.

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

**Historical classification:** the storage notices/download hardening is
**Completed** ([PR #79](https://github.com/mmark76/StudyApp/pull/79),
[storage notice tests](tests/storageNotices.test.ts),
[split-download tests](tests/splitPdfDownloads.test.ts)). The July Assistant
simplification/accessibility baseline is **Completed** as that historical
bounded change ([PR #106](https://github.com/mmark76/StudyApp/pull/106),
[Assistant E2E](tests/e2e/release-blockers.e2e.ts)); broader remaining coverage is
P1-06. The July mock tasks, test credits, mock packages and readiness UI are
**Obsolete** active scope: PR #106 deliberately removed them. Retaining their
historical record does not authorise restoring them or treating them as real AI
or billing. The guide/handoff survives in revised form; current Local Summary
and direct-question features have their own explicitly documented boundaries.

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

**Audit P0-01 — Partially completed.** The Local Summary flow explicitly selects sources, checks
complete extraction coverage and confirms multi-request transfer. See
[SummaryPage](src/features/summary/SummaryPage.tsx),
[fullDocumentSummary](src/features/summary/fullDocumentSummary.ts) and `summarize_parts` in [the
companion](local-companion/openai_connection.py). [Full-document unit
tests](tests/fullDocumentSummary.test.ts) and [mocked summary
E2E](tests/e2e/summary-main-points.e2e.ts) cover bounded chunks, coverage failures and consent.
[PR #327](https://github.com/mmark76/StudyApp/pull/327) supplies the current implementation.
**Remaining:** versioned hosted contracts and negative inclusion tests for every originally
listed task/data class; Local summary coverage does not close the future Cloud Core gate.

### Authentication and authorisation model

Decide whether production AI requires accounts, guest sessions, device-bound
credentials, or another model. Define least-privilege access, token expiry,
revocation, recovery, cross-user isolation, and protection against replay and
session fixation. No privileged provider secret may enter the frontend bundle.

**Audit P0-02 — Partially completed.** Windows Local has OAuth state/PKCE, identity checks,
protected credential storage and disconnect/session cleanup in
[openai_connection.py](local-companion/openai_connection.py),
[credential_vault.py](local-companion/credential_vault.py) and
[browser_session.py](local-companion/browser_session.py). [Connection
tests](local-companion/test_openai_connection.py) and [session
tests](local-companion/test_browser_session.py) cover synthetic-token failures and cleanup; see
[PR #228](https://github.com/mmark76/StudyApp/pull/228), [PR
#363](https://github.com/mmark76/StudyApp/pull/363) and [PR
#364](https://github.com/mmark76/StudyApp/pull/364). **Remaining:** the hosted account/guest
model, recovery, cross-user authorisation and complete replay/session-fixation review. These
Local controls are not a hosted authentication design.

### Prompt-injection and untrusted-document threat model

Treat selected study material as untrusted input. Define separation between
system policy, user instructions, and source content; parser and extraction
limits; prohibited tool or URL execution; malicious-document cases; and safe
failure behaviour.

**Audit P0-03 — Partially completed.** The Local summary developer instructions separate
untrusted source/chunk content from instructions; requests, sizes and citations are checked in
[the companion](local-companion/openai_connection.py),
[fullDocumentSummary](src/features/summary/fullDocumentSummary.ts) and
[summaryService](src/features/summary/summaryService.ts). [Companion summary
tests](local-companion/test_openai_connection.py) assert untrusted-data wording and
invalid/oversized chunk rejection; [PR #327](https://github.com/mmark76/StudyApp/pull/327).
**Remaining:** a complete task-specific threat model, adversarial document cases and prohibited
tool/URL execution tests. RAG is currently unavailable after [PR
#346](https://github.com/mmark76/StudyApp/pull/346); historical retrieval code is not an active
security approval.

### Generated-output validation and review

Define strict runtime schemas, size limits, item limits, source traceability,
and validation for all generated content. Keep every result in a draft/review
state until the user explicitly saves it. Save related records transactionally
and reject malformed or incomplete output safely.

**Audit P0-04 — Partially completed.** [summaryService](src/features/summary/summaryService.ts)
validates bounded summaries/main points and known citation markers;
[SummaryPage](src/features/summary/SummaryPage.tsx) keeps an editable draft until explicit Save.
[Summary tests](tests/summaryService.test.ts) reject malformed/uncited results and check
explicit local TXT persistence; [E2E](tests/e2e/summary-main-points.e2e.ts) covers the mocked
draft/save path. See [PR #323](https://github.com/mmark76/StudyApp/pull/323) and [PR
#327](https://github.com/mmark76/StudyApp/pull/327). **Remaining:** schemas and transactional
multi-record saves for every future generated task type; the existing single-file summary save
is narrower than that requirement.

### Remote task lifecycle and idempotency

Define submission, reservation, processing, completion, cancellation, timeout,
retry, stale-result, and duplicate-request behaviour. A health check must not be
used as proof that a task succeeded. Add stable task identifiers and idempotency
keys before production use.

**Audit P0-05 — Partially completed.**
[fullDocumentSummary](src/features/summary/fullDocumentSummary.ts) supports cancellation,
processing progress and bounded retry/repartition for model context failures. [Its
tests](tests/fullDocumentSummary.test.ts) cover cancellation and interrupted jobs without
publishing a partial result; [PR #327](https://github.com/mmark76/StudyApp/pull/327).
**Remaining:** stable hosted task/idempotency identifiers, reservation/settlement, stale-result
and duplicate-request guarantees across retries. The local study-operation ledger in
[studyOperationService](src/features/learn/studyOperationService.ts) concerns study persistence,
not remote tasks or billing.

### Server-authoritative credits and ledger

Replace the mock wallet only through a separate, reviewed financial design.
Define immutable server-side ledger entries for purchase, reservation,
settlement, release, refund, adjustment, and reconciliation. Prevent negative
balances, duplicate charging, replay, race conditions, and client tampering.

**Audit P0-06 — Pending.** [AI boundaries — Credits and
payments](docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md#credits-and-payments) and
[AGENTS.md](AGENTS.md) explicitly keep real credits inactive and require a server-authoritative
ledger before activation. [PR #106](https://github.com/mmark76/StudyApp/pull/106) removed the
mock-wallet experience. No production purchase/reservation/settlement ledger or financial
acceptance tests were found in the audited frontend/companion. **Remaining:** the complete
original server-side financial design and tests; removing a mock wallet is not implementing a
real ledger.

### Payments, legal, tax, and recovery

Define the legal seller, payment processor, supported currencies, taxes,
receipts, refunds, disputes, failed-payment handling, account/device transfer,
and recovery. Authenticate and deduplicate payment-provider webhooks. Complete
legal and privacy review before enabling purchases.

**Audit P0-07 — Pending.** [AI boundaries — Credits and
payments](docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md#credits-and-payments) retains receipts,
taxes, refunds, disputes and recovery as activation gates; [SECURITY.md](SECURITY.md) keeps
purchases inactive. [PR #106](https://github.com/mmark76/StudyApp/pull/106) removed mock
package/payment presentation. No active payment integration or authenticated/idempotent webhook
acceptance tests were found in this repository. **Remaining:** every original production
payment/legal requirement; no Cloud Core/payment service outside this repository was audited.

### Retention, deletion, logging, and incident response

Define what Cloud Core and any AI provider retain, for how long, and for what
purpose. Exclude study content and secrets from logs by default. Add deletion,
access-control, incident-response, and provider-contract requirements.

**Audit P0-08 — Partially completed.** The Local transport sends `store: false`; [companion
tests](local-companion/test_openai_connection.py) assert that payload, and
[browser_session.py](local-companion/browser_session.py)/[PR
#364](https://github.com/mmark76/StudyApp/pull/364) add local credential removal and revocation
attempts on session end. [SECURITY.md](SECURITY.md) documents the local boundary and lists
future logging/retention requirements. **Remaining:** verified Cloud Core/provider retention
contracts, operational-log access, deletion/access procedures and incident-response evidence.
`store: false` alone does not prove provider-wide zero retention or completed legal review.

## P1 — Local data and runtime reliability

### Recursive split-PDF relationship safety

Traverse the complete `sourceFileId` descendant graph when previewing or
deleting nested split PDFs. Detect cycles, show all affected records, and cover
deep descendant cases transactionally. Current direct-child handling prevents
silent direct cascades, but retained nested descendants can lose lineage.

**Audit P1-01 — Partially completed.**
[findRelatedSplitPdfFiles](src/features/library/localFileDeletion.ts) now traverses descendants
with a visited set; [LibraryPage](src/features/library/LibraryPage.tsx) uses those IDs in a
Dexie deletion transaction. [Deletion tests](tests/localFileDeletion.test.ts) cover nested
descendants, cycles and cancel/source-only/cascade choices; [PR
#120](https://github.com/mmark76/StudyApp/pull/120). The old direct-child-only statement below
is superseded. **Remaining:** the confirmation currently shows a related-file count, not every
affected record, and no integrated deep-graph deletion/rollback browser test was found.
Source-only deletion intentionally retains split records and their original source IDs.

### PDF quota, duplication, and cancellation

Estimate browser storage where supported, prevent avoidable duplicate source and
output blobs, process large jobs incrementally, add cancellation and useful
progress, and add stress/failure tests. Preserve the current 50 MB per-file and
50-chunk limits unless evidence supports a safer change.

**Audit P1-02 — Partially completed.**
[localStudyFiles](src/features/study-materials/localStudyFiles.ts) and
[SplitPdfTool](src/features/study-materials/SplitPdfTool.tsx) hash/deduplicate source PDFs.
[splitPdfLimits](src/features/study-materials/splitPdfLimits.ts) bounds total pages/output
bytes/render pixels; [hash tests](tests/localStudyFiles.test.ts) and [limit
tests](tests/splitPdfLimits.test.ts) cover those controls; [PR
#120](https://github.com/mmark76/StudyApp/pull/120). The 50 MiB per-file/50-range limits remain.
**Remaining:** browser quota estimation, output-blob deduplication, user cancellation/progress
for splitting and end-to-end stress/interruption evidence. The page-count effect cleanup flag is
not a user-cancellable split job.

### Accurate study-session lifecycle

Record actual session start separately from completion, define completion
consistently across flashcards/review/quiz, record due-review sessions, and
prevent partial or duplicate session history.

**Audit P1-03 — Completed.** [StudySession](src/shared/types/models.ts) separates `startedAt`
from optional `completedAt`.
[studyOperationService](src/features/learn/studyOperationService.ts) commits progress,
active/completed sessions and operation IDs transactionally, rejects conflicting/replayed
operations and records review sessions. Flashcards,
[ReviewPage](src/features/review/ReviewPage.tsx) and [QuizPage](src/features/quiz/QuizPage.tsx)
use this service. [Operation tests](tests/studyOperationService.test.ts) cover rollback,
ambiguous retries, counters and completed-session protection; [E2E final-write
tests](tests/e2e/release-blockers.e2e.ts) cover all three flows. See [PR
#120](https://github.com/mmark76/StudyApp/pull/120) and [PR
#130](https://github.com/mmark76/StudyApp/pull/130). Active sessions intentionally remain
incomplete until final commit; they are not falsely completed history.

### Persistence failure states

Chapter creation, flashcard creation and appearance settings now await local
writes, lock duplicate submissions, retain input on failure and expose
bilingual failure feedback with deterministic browser tests. Continue this
pattern for the remaining content-management/settings writes and future
generated-content saves.

**Audit P1-04 — Partially completed.** [UnitForm](src/features/content-import/UnitForm.tsx),
[FlashcardForm](src/features/content-import/FlashcardForm.tsx),
[AppearanceSettingsPage](src/features/appearance/AppearanceSettingsPage.tsx) and
[practiceContentRepository](src/features/content-import/practiceContentRepository.ts) await
writes and preserve/validate state. [Deterministic write-failure
E2E](tests/e2e/release-blockers.e2e.ts) covers chapter/card creation, appearance and study
results; [PR #106](https://github.com/mmark76/StudyApp/pull/106), [PR
#120](https://github.com/mmark76/StudyApp/pull/120) and [PR
#130](https://github.com/mmark76/StudyApp/pull/130). **Remaining:** an exhaustive check and
equivalent failure/pending/duplicate-submission coverage for every other management/settings
write and future generated-content save. A few covered forms do not close this repository-wide
item.

### Corrupt stored-content recovery

Replace silent fallback-to-empty behaviour with validated error states and
recovery/export choices so corrupt imported content cannot look like an
intentional empty collection.

**Audit P1-05 — Partially completed.**
[importedContent](src/features/content-import/importedContent.ts) throws
`StoredContentValidationError`;
[useStudyContent](src/features/content-import/useStudyContent.ts) exposes
`hasStoredContentError`.
[PracticeContentManager](src/features/content-import/PracticeContentManager.tsx) alerts and
blocks add/import, and repository tests preserve [corrupt stored
chapters/cards](tests/practiceContentRepository.test.ts). See [PR
#120](https://github.com/mmark76/StudyApp/pull/120) and [PR
#130](https://github.com/mmark76/StudyApp/pull/130). **Remaining:** recovery/export choices for
damaged records and equivalent handling in every reader. The hook still returns empty item
arrays with an error flag; not every study consumer presents that flag, so the original
silent-empty risk is not globally closed.

### AI Assistant accessibility and interruption safety

Focus trapping and restoration, inert background, Escape close and bilingual
Assistant navigation now have browser coverage. Add the remaining browser tests
for screen-reader output, 200% zoom, narrow layouts and PWA updates while the
dialog is open.

**Audit P1-06 — Partially completed.**
[AssistantPanel](src/features/assistant/AssistantPanel.tsx) and [release-blockers
E2E](tests/e2e/release-blockers.e2e.ts) cover focus trap/restore, inert siblings, Escape,
bilingual navigation, reduced motion and a static accessible welcome copy; [PR
#106](https://github.com/mmark76/StudyApp/pull/106), [PR
#108](https://github.com/mmark76/StudyApp/pull/108) and [PR
#110](https://github.com/mmark76/StudyApp/pull/110). [Workspace modal/PWA isolation
E2E](tests/e2e/blocker-remediation.e2e.ts) covers a late toast in the active shell.
**Remaining:** an explicit combined Assistant-dialog/200%-zoom/narrow-layout/PWA-interruption
matrix and real assistive-technology verification. Workspace Settings-modal coverage is not
proof of every Assistant-dialog case.

### Future remote service-status state correctness

If a future remote mode exposes service status, test race conditions between
browser online/offline events, manual retry, unmount, slow responses, and stale
responses. Distinguish service readiness from task availability and task
success in both code and wording. No readiness check is active in the current
Assistant handoff.

**Audit P1-07 — Partially completed.** The retained [useCloudCoreConnection
hook](src/infrastructure/cloud-core/useCloudCoreConnection.ts) guards mounted state and request
sequence, and invalidates stale requests on offline/unmount. [Status
tests](tests/cloudCoreConnectionStatus.test.ts) assert presentation; [client
tests](tests/cloudCoreClient.test.ts) validate health responses. [PR
#80](https://github.com/mmark76/StudyApp/pull/80) introduced readiness and [PR
#106](https://github.com/mmark76/StudyApp/pull/106) removed it from the active Assistant.
**Remaining:** runtime race tests for retry/online/offline/unmount/slow responses and future
task-availability/success semantics before any activation. This conditional future requirement
is retained, not declared obsolete merely because polling is inactive.

## P2 — Import, storage, platform, and AI design hardening

### Import limits and CSV grammar validation

Add file-size and row-count limits, reject malformed quoting and trailing
invalid data, and show an import preview with create/update/conflict counts.

**Audit P2-01 — Partially completed.**
[spreadsheetImport](src/features/content-import/spreadsheetImport.ts) enforces 10 MiB text,
row/cell limits, exact headers/columns and quote grammar; [parser
tests](tests/spreadsheetImport.test.ts) cover malformed quotes and missing/extra fields.
[PracticeContentManager](src/features/content-import/PracticeContentManager.tsx) previews
changed chapter metadata and addition/update counts; [DATA-04
E2E](tests/e2e/blocker-remediation.e2e.ts) covers cancel/confirm and linked-state preservation.
See [PR #120](https://github.com/mmark76/StudyApp/pull/120) and [PR
#130](https://github.com/mmark76/StudyApp/pull/130). **Remaining:** a consistent
create/update/conflict preview for all imports, especially flashcards and additions-only chapter
imports, which currently save without that preview.

### Complete local-file export/import

Implement the versioned archive design in
[`docs/LOCAL_FILE_EXPORT_DESIGN.md`](docs/LOCAL_FILE_EXPORT_DESIGN.md), including
blob data, integrity checks, relationship validation, and explicit merge or
replace confirmation.

**Audit P2-02 — Partially completed.** [archiveService](src/features/archive/archiveService.ts)
implements a versioned selective archive with selected blob bytes, SHA-256 integrity, save
verification and non-overwriting restore; [archive tests](tests/selectiveArchive.test.ts) cover
corrupt checksums and failure/concurrency guards; [PR
#238](https://github.com/mmark76/StudyApp/pull/238). **Remaining:** the complete
archive/relationship/merge-or-replace contract in
[LOCAL_FILE_EXPORT_DESIGN](docs/LOCAL_FILE_EXPORT_DESIGN.md). The selective base64 JSON format
is not that complete ZIP-manifest design, and [JSON backup](src/infrastructure/backup/backup.ts)
still excludes local-file blobs. Do not mark complete-file backup solved by the selective
feature.

### Cloud-link policy

Decide whether new user links must be HTTPS-only, define compatibility for
existing HTTP records, and make Structured Study removal semantics distinguish
unplacing from deleting a shared saved-link record.

**Audit P2-03 — Pending.**
[normalizeStudyMaterialUrl](src/features/study-materials/studyMaterials.ts) still accepts HTTP
and HTTPS; [StudyTheoryPage](src/features/study/StudyTheoryPage.tsx) removes a Structured Study
link through `removeSavedStudyMaterialLink`, which deletes the shared saved record in [the
repository](src/features/study-materials/studyMaterialLinksRepository.ts). [PR
#120](https://github.com/mmark76/StudyApp/pull/120) added validation/transaction safety, with
[link repository tests](tests/studyMaterialLinksRepository.test.ts), but did not implement the
requested HTTPS-new-link/legacy compatibility decision or distinct unplace-versus-delete
semantics. **Remaining:** the original owner policy decision and its focused
implementation/tests.

### Generated-content data model

Define whether AI-assisted answers, notes, summaries, flashcards, and quizzes
need provenance fields such as source file, chapter, page/range, task ID, model,
creation time, user edits, and verification state. Keep the schema useful even
when AI is unavailable or disabled.

**Audit P2-04 — Partially completed.** [SummaryDraft](src/features/summary/summaryService.ts)
carries source IDs/titles/locations and serializes citations into an explicitly saved TXT;
[LocalStudyFile](src/shared/types/models.ts) has `generatedSummary`. [Summary
tests](tests/summaryService.test.ts) and [PR
#323](https://github.com/mmark76/StudyApp/pull/323)/[PR
#327](https://github.com/mmark76/StudyApp/pull/327) establish that limited provenance.
**Remaining:** an approved common model for answers, notes, summaries, flashcards and quizzes,
including structured task/model/edit/verification metadata as appropriate. Embedded TXT
citations and a boolean marker do not implement the full future schema.

### Provider-neutral Cloud Core client

Keep provider credentials and provider-specific response formats behind Cloud
Core. Define typed frontend contracts, version negotiation, timeout and retry
policy, request-size limits, and safe error codes without exposing internal
infrastructure details.

**Audit P2-05 — Partially completed.**
[cloudCoreClient](src/infrastructure/cloud-core/cloudCoreClient.ts) provides
typed/runtime-validated health responses, URL checks, abort timeout and wrapped errors; [client
tests](tests/cloudCoreClient.test.ts) cover valid/invalid responses and HTTP errors. See [PR
#80](https://github.com/mmark76/StudyApp/pull/80) and the inactive-client boundary after [PR
#106](https://github.com/mmark76/StudyApp/pull/106). **Remaining:** hosted task request/response
contracts, negotiated versions, retry policy, request-size limits and safe public error-code
mapping. The provider-specific Windows Local companion is a separate approved transport, not
evidence that the Cloud Core task contract is finished.

### Deterministic build and deployment

Remove wall-clock time from the build artifact identifier, use lockfile-based
installation in deployment, consolidate duplicate verification workflows, and
pin third-party actions to reviewed immutable revisions.

**Audit P2-06 — Partially completed.** [CI](.github/workflows/ci.yml), [Pages
deployment](.github/workflows/deploy-pages.yml) and [release
workflow](.github/workflows/release.yml) use `npm ci` and pinned action SHAs; successful main CI
gates Pages on its exact source SHA. [Release-safety tests](tests/releaseSafetyConfig.test.ts)
check workflow ordering and Playwright lockfile/image consistency; [PR
#120](https://github.com/mmark76/StudyApp/pull/120), [PR
#138](https://github.com/mmark76/StudyApp/pull/138), [PR
#199](https://github.com/mmark76/StudyApp/pull/199) and [PR
#371](https://github.com/mmark76/StudyApp/pull/371). **Remaining:**
[getBuildIdentifier](vite.config.ts) still embeds wall-clock date/time. Exact-source deployment
is not reproducible byte-for-byte artifact generation; retain that unfinished acceptance
criterion.

### React Router major update

Review and test migration to React Router 8.3.0 or later. The current npm audit
finding
([GHSA-qwww-vcr4-c8h2](https://github.com/advisories/GHSA-qwww-vcr4-c8h2))
affects only unstable RSC APIs, which StudyApp does not use, so it is not an
exploitable v1 path. Do not use `npm audit fix --force` or accept an automatic
major/downgrade without a focused compatibility review.

**Audit P2-07 — Requires verification.** [package.json](package.json) and [the
lockfile](package-lock.json) currently use React Router DOM 7.18.6, updated by [PR
#358](https://github.com/mmark76/StudyApp/pull/358) after [PR
#215](https://github.com/mmark76/StudyApp/pull/215). No Router 8 migration was found. A fresh
`npm audit --omit=dev --json` on the audited main dependency tree passed with zero findings on
2026-11-26. **Verification needed:** reassess the historical advisory/rationale and the proposed
8.3.0-or-later target before planning a major migration; neither the old vulnerability statement
nor a continuing need for that exact target is established by current repository evidence. The
old text above remains a historical requirement, not current security advice. No automatic major
upgrade/downgrade is authorised.

### Browser integration and accessibility baseline

Add focused browser tests for uploads, unsafe-file rejection, restore rollback,
IndexedDB persistence, PDF split flows, keyboard navigation, live regions, 200%
zoom, narrow/mobile layouts, and the current Assistant handoff states.

**Audit P2-08 — Partially completed.** [Release-blockers
E2E](tests/e2e/release-blockers.e2e.ts), [pagination/200%-text
E2E](tests/e2e/practice-content-pagination.e2e.ts), [Workspace mobile
E2E](tests/e2e/workspace-beta-mobile-header.e2e.ts) and [modal
E2E](tests/e2e/blocker-remediation.e2e.ts) cover persistence failures, keyboard/focus, live
status, Assistant states and narrow layouts; [PR
#120](https://github.com/mmark76/StudyApp/pull/120), [PR
#130](https://github.com/mmark76/StudyApp/pull/130) and [PR
#374](https://github.com/mmark76/StudyApp/pull/374). [File-policy
tests](tests/localFilePolicy.test.ts) and [restore rollback tests](tests/backup.test.ts) are
unit/database tests. **Remaining:** browser-level upload/unsafe-file rejection, restore rollback
and real split-PDF flow coverage, plus broader engine/assistive-technology evidence. The passing
Chromium suite is not proof of every original platform/flow acceptance case.

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
- Keep current Assistant availability wording distinct from future remote
  readiness, credit estimate, reservation, charge, release, and refund wording.

### P3 audit evidence (original bullet order retained)

#### P3-01 — Partially completed

**Original item:** Add a low-churn ESLint baseline, formatting checks, coverage reporting, and
dependency-advisory scanning.

[Dependabot](.github/dependabot.yml) provides weekly npm/action update PRs, including [PR
#358](https://github.com/mmark76/StudyApp/pull/358) and [PR
#371](https://github.com/mmark76/StudyApp/pull/371).
[package.json](package.json)/[CI](.github/workflows/ci.yml) have no
ESLint/format/coverage/advisory-scan gate. Update PRs are not equivalent to vulnerability
scanning. Remaining: the original lint/format/coverage/scanning baseline; open PR #375 is not
merged evidence.

#### P3-02 — Partially completed

**Original item:** Review route-level code splitting for the current production bundle-size
warning without weakening offline behaviour.

[router.tsx](src/app/router.tsx) lazily loads Tools and Important Info; [PR
#120](https://github.com/mmark76/StudyApp/pull/120). Most routes remain eager, and
[ARCHITECTURE.md](ARCHITECTURE.md) still identifies route-level code/style splitting as
follow-up. [Release-safety tests](tests/releaseSafetyConfig.test.ts) preserve PWA resource
precaching. Remaining: a measured broader bundle review and offline regression evidence, rather
than assuming two lazy routes finish the review.

#### P3-03 — Completed

**Original item:** Replace quiz restart page reload with a React state reset.

[QuizPage.restartQuiz](src/features/quiz/QuizPage.tsx) rebuilds questions and resets
index/score/session/pending/retry state without reloading the page; [PR
#120](https://github.com/mmark76/StudyApp/pull/120). [Quiz unit tests](tests/quiz.test.ts) and
[quiz completion/retry E2E](tests/e2e/release-blockers.e2e.ts) cover related answer/result
behavior. Completion of the restart mechanism is established by code inspection; those tests do
not explicitly assert the absence of navigation on restart.

#### P3-04 — Partially completed

**Original item:** Add an explicit due-review completion state and consistent session summary.

[ReviewPage](src/features/review/ReviewPage.tsx) now renders “Review complete” and restarts
through “Check for more reviews”; [review E2E](tests/e2e/release-blockers.e2e.ts) checks
completion only after successful transactional retry; [PR
#120](https://github.com/mmark76/StudyApp/pull/120)/[PR
#130](https://github.com/mmark76/StudyApp/pull/130). Remaining: consistent user-visible session
summaries across flashcards/review/quiz. Persisted totals exist, but review/flashcard completion
messages and quiz score presentation remain different.

#### P3-05 — Pending

**Original item:** Improve PDF compatibility-mode guidance.

[SplitPdfTool](src/features/study-materials/SplitPdfTool.tsx) falls back from vector copying to
rendered JPEG pages and has compatibility-specific errors/limits; [PR
#120](https://github.com/mmark76/StudyApp/pull/120) and [limit
tests](tests/splitPdfLimits.test.ts) provide safety controls. No preflight/result disclosure of
rasterisation, text/search loss or quality implications, or focused guidance test, was found in
the audited splitter. Remaining: the requested user guidance; a fallback implementation alone
does not complete it.

#### P3-06 — Partially completed

**Original item:** Review appearance-setting failure feedback and remaining inline layout rules.

[AppearanceSettingsPage](src/features/appearance/AppearanceSettingsPage.tsx) exposes
pending/success/failure and retains the selected setting; [appearance
E2E](tests/e2e/release-blockers.e2e.ts) verifies failure feedback; [PR
#106](https://github.com/mmark76/StudyApp/pull/106)/[PR
#120](https://github.com/mmark76/StudyApp/pull/120). Remaining: the wider inline-layout review.
Existing typography work and [typography E2E](tests/e2e/typography-consistency.e2e.ts) preserve
user font choices but do not demonstrate completion of every inline-rule cleanup.

#### P3-07 — Partially completed

**Original item:** Consolidate historical audit/update documents without removing traceability.

[HARDENING_STATUS_20260816](docs/HARDENING_STATUS_20260816.md) records completed A/B work and
the retained follow-up order; [PR #132](https://github.com/mmark76/StudyApp/pull/132). Release
documents and this dated backlog remain traceable. Remaining: reconciliation of living-document
drift and an agreed consolidation/index. For example, [AGENTS.md](AGENTS.md) describes opt-in
Google Analytics while [SECURITY.md](SECURITY.md) describes the cookieless aggregate collector;
ARCHITECTURE also retains an older separate-prototype routing explanation alongside the current
root-BETA description. This audit records the conflicts without resolving product policy or
deleting history.

#### P3-08 — Partially completed

**Original item:** Add a visible build/environment label so test, staging, and future production
AI configurations cannot be confused.

[WorkspaceBetaPage](src/features/workspace-beta/WorkspaceBetaPage.tsx) displays the full [build
ID](vite.config.ts); [PR #245](https://github.com/mmark76/StudyApp/pull/245). [Workspace footer
E2E](tests/e2e/workspace-beta.e2e.ts) checks version visibility. Remaining: an explicit
environment/configuration label distinguishing test, staging and future production AI.
Version/date/time/short SHA identifies a build, not its AI environment.

#### P3-09 — Completed

**Original item:** Keep current Assistant availability wording distinct from future remote
readiness, credit estimate, reservation, charge, release, and refund wording.

[AssistantPanel](src/features/assistant/AssistantPanel.tsx), [comparison
page](src/features/assistant/AssistantComparisonPage.tsx) and
[WorkspaceBetaPage](src/features/workspace-beta/WorkspaceBetaPage.tsx) distinguish Available,
Coming soon, No charges yet, Windows Local and unavailable RAG. [Bilingual Assistant
E2E](tests/e2e/release-blockers.e2e.ts) and [AI-option
E2E](tests/e2e/workspace-beta-ai-actions-release.e2e.ts) assert the current boundaries; [PR
#106](https://github.com/mmark76/StudyApp/pull/106), [PR
#129](https://github.com/mmark76/StudyApp/pull/129) and [PR
#346](https://github.com/mmark76/StudyApp/pull/346). This closes the current wording task only;
future readiness/financial states remain subject to P0 gates.

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
