# StudyApp Roadmap

_Last updated: 2026-07-30_

## v1.0.0 — Complete

The v1 roadmap ended at the release gate. Completed work includes:

1. stable review queues, quiz answer locking, and CSV header validation;
2. intentional direct source/split-PDF deletion choices and content hashing;
3. a central safe local-file policy;
4. strict previewed transactional backup restore;
5. stable content-based flashcard import IDs;
6. user-controlled PWA updates;
7. final navigation/documentation alignment and release verification.

The released v1 study workflow is local-first, browser-based, offline-ready, and
without accounts, cloud storage, cloud sync, analytics, advertising, or
telemetry.

## v1.0.0 release-hardening follow-up — Complete

A focused post-gate follow-up added explicit local-storage/non-backup notices and
download actions for generated split PDFs. It did not add content generation,
cloud storage, authentication, billing, or a new persisted data model.

## Post-v1 AI Assistant preview — Current `main`

The repository now includes a clearly labelled test-mode AI Assistant workflow
preview. Completed preview work includes:

1. mock tasks for questions, flashcards, quizzes, summaries, and explanations;
2. deliberate source selection and confirmation screens;
3. mock results and a locally stored test-credit wallet;
4. planned one-time credit-package presentation with no real purchase;
5. Cloud Core readiness status in the application and assistant;
6. unavailable/offline handling that prevents mock task execution;
7. a user guide explaining the preview, privacy boundary, and planned charging
   model.

This work is not production AI. It does not send study material to a model, make
a real AI request, create a real account, synchronise study data, or charge the
user.

The current and future boundary is defined in
[`docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md`](docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md).

## Next roadmap phase

Future work should proceed through separate, focused branches and PRs.

### Track A — Local-first reliability

Continue the existing v1.1 backlog for:

- recursive split-PDF relationship safety;
- storage quota, large-PDF, duplication, and cancellation handling;
- accurate study-session lifecycle;
- persistence-failure recovery;
- complete local-file export/import;
- browser integration and accessibility coverage;
- deterministic build and deployment hardening.

### Track B — AI preview hardening

Before production integration, improve the preview itself:

- keep mock/test labels impossible to miss;
- test keyboard, screen-reader, narrow-layout, offline, timeout, retry, and
  interrupted-flow behaviour;
- define draft result schemas for answers, flashcards, quizzes, summaries, and
  explanations;
- define traceability from every generated item back to selected source
  material;
- define review, edit, discard, and transactional local-save behaviour;
- remove any ambiguity between service health and task success.

### Track C — Production Cloud Core and AI design

Production AI must not begin as a direct replacement of mock functions. First
complete design and review for:

- authentication and authorisation;
- exact request/response contracts;
- user-selected and confirmed payloads;
- prompt-injection and malicious-document handling;
- provider abstraction and secrets management;
- rate, size, concurrency, and cost limits;
- task idempotency, cancellation, timeout, and retry semantics;
- logging, retention, deletion, and incident response;
- legal and privacy updates;
- server-authoritative credit and payment design.

### Track D — Real credits and payments

Real billing is a separate high-risk workstream. It requires:

- a legal seller and payment processor;
- server-authoritative balances and immutable ledger entries;
- idempotent purchase, reservation, settlement, release, refund, and
  reconciliation;
- maximum-cost disclosure before confirmation;
- explicit treatment of failed, timed-out, cancelled, and partial tasks;
- receipts, taxes, refunds, disputes, account recovery, and device transfer;
- security and privacy review plus browser-to-service integration tests.

## Historical-document rule

Historical release documents such as `RELEASE_NOTES_v1.md`,
`RELEASE_CHECKLIST.md`, and `AUDIT.md` may preserve the facts and scope of the v1
release gate. Living documents must describe current `main` and distinguish:

1. the released local-first workflow;
2. the current test-mode AI Assistant preview;
3. planned production cloud-assisted capabilities.

## Work selection rule

Remaining work is tracked in [`V1_1_BACKLOG.md`](V1_1_BACKLOG.md). Select one
focused item per branch/PR, document data-safety and privacy impact, and preserve
the boundaries in [`AGENTS.md`](AGENTS.md).
