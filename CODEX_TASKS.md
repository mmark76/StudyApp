# Codex Task Queue

_Last updated: 2026-07-30_

## v1 status

The historical v1 release task queue is closed. The completed release sequence
was:

1. secure local file handling;
2. safe backup restore;
3. stable flashcard IDs;
4. final v1 release gate;
5. focused storage-notice and split-PDF download hardening.

Do not reopen or rewrite the historical v1 release gate to include later AI or
Cloud Core work.

## Current `main` status

The repository now contains a post-v1 AI Assistant preview with mock results,
test credits, a user guide, and Cloud Core readiness presentation. This is not a
production AI, account, billing, cloud-storage, or cloud-sync implementation.

Before touching the assistant, Cloud Core, remote processing, credits, payments,
or generated-content persistence, read:

1. `LICENSE`;
2. `AGENTS.md`;
3. `VISION.md`;
4. `ARCHITECTURE.md`;
5. `SECURITY.md`;
6. `docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md`;
7. the selected item in `V1_1_BACKLOG.md`.

## Task source

All remaining work is listed in [`V1_1_BACKLOG.md`](V1_1_BACKLOG.md). Select one
focused item per branch and PR.

For each task:

1. state whether it affects only the local study workflow, only the mock AI
   preview, the Cloud Core readiness boundary, or a future production remote
   capability;
2. define the exact data-safety and privacy impact;
3. preserve explicit user selection and confirmation for any remote content;
4. keep generated output in review state until the user saves it;
5. define failure, cancellation, retry, and duplicate-submission semantics;
6. add focused regression tests;
7. update living documentation in the same PR when behaviour changes;
8. run:

```bash
npm ci
npm run typecheck
npm test
npm run build
```

## Production AI and payment gate

Do not implement real AI requests or payments as an incremental replacement of
mock functions without a reviewed architecture. A production task must first
define:

- authenticated request and response contracts;
- exact selected payload and data minimisation;
- prompt-injection and untrusted-document handling;
- output validation and source traceability;
- idempotent task and billing operations;
- server-authoritative credits and ledger;
- retention, deletion, logging, incident response, and legal wording;
- browser integration and accessibility coverage.

If those boundaries are not explicit, the task is not implementation-ready.
