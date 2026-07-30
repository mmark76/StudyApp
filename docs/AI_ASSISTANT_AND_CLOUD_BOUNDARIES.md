# AI Assistant and Cloud Boundaries

_Last updated: 2026-07-30_

## Purpose

This document defines the current and intended boundaries between StudyApp's
local-first study experience, the AI Assistant preview, and Markellos Cloud
Core. It is the authoritative reference for contributors working on remote AI,
credits, payments, service availability, or any flow that may send study
content outside the browser.

## Product states

StudyApp documentation must distinguish three product states.

### 1. Released local-first study application

The released study workflow stores study material, local file blobs, links,
progress, sessions, and settings in the current browser. It has no user account,
cloud storage, cloud sync, analytics, advertising, or telemetry. Browser storage
is not permanent storage or a complete backup.

### 2. Current AI Assistant preview

The current AI Assistant is a user-interface and workflow preview. It supports
mock task selection for:

- asking a question;
- creating flashcards;
- creating a quiz;
- summarising selected material;
- explaining a concept.

The preview uses sample results and test credits stored locally. It does not
send study material to an AI model, perform a real AI request, make a real
purchase, reserve real funds, or charge the user.

The application may check whether Markellos Cloud Core is operational. The
current readiness request is a `GET` request to `/api/v1/health/ready` at the
configured `VITE_CLOUD_CORE_URL`. It is an availability check only and must not
contain study material, local files, progress, saved links, settings, backups,
or personal account data.

### 3. Planned cloud-assisted AI workflow

A future production AI Assistant may send deliberately selected material to a
remote service. That capability is not part of the released local-only study
workflow and must not be described as already operational.

The intended task flow is:

1. the user chooses an AI task;
2. the user chooses or pastes the exact material to use;
3. StudyApp shows the selected material, service status, and maximum estimated
   credit cost;
4. the user explicitly confirms the task;
5. only the confirmed task payload is sent;
6. the result is returned for review;
7. the user decides whether to edit, discard, or save the result locally.

## Non-negotiable data boundaries

Any production remote feature must satisfy all of the following:

- **Explicit selection:** never scan or upload the library, database, current
  document, or chapter automatically.
- **Explicit confirmation:** no study content leaves the browser until the user
  reviews and confirms the task.
- **Data minimisation:** send only the content and metadata required for the
  confirmed task.
- **Purpose limitation:** do not reuse submitted study material for unrelated
  tasks, profiling, advertising, or analytics.
- **Clear state:** show whether the service is checking, online, offline, or has
  failed.
- **Local control:** AI output is not saved into StudyApp until the user chooses
  to save it.
- **Failure safety:** a failed or cancelled task must not silently save partial
  content or consume credits.
- **No hidden sync:** remote AI must not become cloud backup or cloud sync by
  implication.
- **No secrets in the client:** API secrets, payment credentials, signing keys,
  and privileged service tokens must never be embedded in the frontend build.

## Credits and payments

The current credit wallet and packages are test-mode demonstrations. They are
not financial records and must remain clearly labelled as mock or test data.

Before real credits or payments are introduced, the design must define and test:

- the legal seller and payment processor;
- supported currencies, taxes, receipts, refunds, and charge disputes;
- server-authoritative balances and an immutable ledger;
- idempotent purchase, reservation, settlement, release, and refund operations;
- maximum-cost disclosure before confirmation;
- protection against replay, duplicate charging, negative balances, and client
  manipulation;
- treatment of failed, timed-out, cancelled, or partially completed AI tasks;
- account, guest, device-transfer, and recovery behaviour;
- data retention and deletion rules.

No client-side balance may be treated as authoritative in production.

## Security and privacy requirements

Remote AI work must include a threat model and privacy review before merge. At a
minimum, cover:

- authentication and authorisation;
- transport security and origin restrictions;
- request-size and file-type limits;
- prompt-injection and untrusted-document handling;
- output validation before creating flashcards, quizzes, notes, or summaries;
- rate limits, abuse controls, cost limits, and denial-of-service protection;
- logging that excludes study content and secrets by default;
- retention, deletion, incident response, and provider contracts;
- accessibility and understandable consent text.

The service health response must continue to be validated at runtime. Production
AI responses and billing responses require separate strict schemas; a healthy
service status is not proof that an AI or payment operation is valid.

## Documentation rules

Use the following terms consistently:

- **local-first** means core study data remains local by default;
- **offline-ready** applies to the local study workflow, not remote AI tasks;
- **AI Assistant preview** or **test mode** means mock results and test credits;
- **Cloud Core readiness check** means the operational health request only;
- **production AI Assistant** means a future remote feature that has completed
  its security, privacy, legal, billing, and data-safety gates.

Historical v1 release documents may retain statements that were true at the v1
release gate. Living documents such as `README.md`, `AGENTS.md`, `VISION.md`,
`ARCHITECTURE.md`, `SECURITY.md`, `ROADMAP.md`, and `V1_1_BACKLOG.md` must state
current `main` behaviour and clearly separate it from future plans.

## Contributor gate

Before implementing a non-mock AI or payment feature, contributors must:

1. read `LICENSE`, `AGENTS.md`, `VISION.md`, `SECURITY.md`, and this document;
2. define the exact data sent from the browser and the exact reason for each
   field;
3. document failure, cancellation, retry, and charging semantics;
4. define the local-save boundary for generated content;
5. add focused unit, integration, and browser tests;
6. update legal and user-facing documentation in the same PR;
7. run the full repository verification gate.
