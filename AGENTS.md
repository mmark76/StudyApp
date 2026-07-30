# AGENTS.md

## Purpose

This file provides working guidance for AI coding agents and automated
contributors operating in this repository.

The project is **source-visible but proprietary**. Read `LICENSE` before making
or proposing changes. Do not copy, relicense, redistribute, or reuse project
code outside this repository.

## Required reading

Before making product, architecture, data-model, security, privacy, AI, billing,
or UX decisions, read:

1. [`VISION.md`](VISION.md);
2. [`ARCHITECTURE.md`](ARCHITECTURE.md);
3. [`SECURITY.md`](SECURITY.md);
4. [`docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md`](docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md)
   when the change touches AI, Cloud Core, network requests, credits, payments,
   generated content, or remote processing.

## Project overview

Markellos StudyApp is a local-first, offline-ready study application built with:

- React 19;
- TypeScript;
- Vite;
- React Router;
- Dexie / IndexedDB;
- PDF.js and `pdf-lib`;
- Vitest;
- `vite-plugin-pwa`.

Core study data is stored in the browser. The application currently has no user
account, cloud storage, cloud sync, analytics, advertising, or telemetry.

The current `main` branch also contains an **AI Assistant preview** and a
**Markellos Cloud Core readiness check**. The preview uses mock results and test
credits. The readiness request reports service availability only. Do not
misrepresent either as production AI, real billing, cloud storage, or cloud
sync.

## Product vision and owner intent

The owner intent is to build a **local-first personal knowledge and learning
system**, not only a flashcards app. The app should help the user add study
material, read it from source, study it through structure, transform it into
active learning, and retrieve knowledge through meaningful filters.

Do not treat uploaded material as dead file storage. Do not optimise only for
flashcard quantity if that weakens source structure, concept understanding,
traceability, retrieval, user control, or long-term learning.

Optional remote AI may support this learning workflow, but it must remain
explicit, data-minimised, reviewable, and separate from local storage and sync.

## Product-state terminology

Use these terms precisely in code, UI, PRs, and documentation:

- **local-first study workflow** — the released browser-based study capability;
- **AI Assistant preview** or **test mode** — mock results and test credits;
- **Cloud Core readiness check** — an operational availability request that
  sends no study content;
- **production AI Assistant** — a future remote capability that is not yet
  implemented and requires separate security, privacy, legal, billing, and
  data-safety approval.

Historical v1 release documents may describe the state at the v1 release gate.
Living documentation must describe current `main` behaviour and clearly label
future plans.

## Current UX boundaries

The main study navigation has Home plus four study areas. Material management
is placed at the destination where the material will be used; there is no
standalone Add / Remove Material page.

```text
Library from Source   = add, read, final-place, and remove original/source material
Structured Study      = add, read, final-place, and remove material by structure and level
Learn & Practice      = practise and consolidate knowledge
Split PDF Tool        = upload a PDF as direct input and split it in the browser
AI Assistant preview  = choose a mock task, material, cost, result, and local-save decision
```

The AI Assistant is an overlay/supporting workflow, not a fifth material store
and not a substitute for Library, Structured Study, or Learn & Practice.

### Library from Source

Allowed primary actions: **Add**, **Read**, **final source-material
placement/correction**, and **Remove**.

This area may show Books, Articles, Papers, Source/External Notes, My Notes, and
Summaries. Local source files and source links are added and removed here so
material management stays beside its final reading destination.

### Structured Study

Allowed primary actions: **Add**, **Read**, **final structured
placement/correction**, and **Remove**.

This area is for Contents, Chapters, Sections / Paragraphs, Key Concepts,
Bibliography / References, and Images / Diagrams. Placement controls may correct
the final category of split-PDF extracts.

### Learn & Practice

Allowed primary actions: **Practice**, **Review**, **Quiz**, and **Progress**.

This area is for active recall, flashcards, due review, quizzes, and progress
tracking.

### Split PDF Tool

Allowed primary actions: **Upload PDF** and **Split PDF**.

This area must remain a local PDF utility. Its upload action accepts PDF files
only and exists so the user can supply direct split input. Do not add general
file upload, cloud-link upload, remove-material, or general material-management
controls here.

### AI Assistant preview

Allowed current actions are mock-only task selection, source selection, cost
review, confirmation, sample-result review, and test-wallet interaction.

Current invariants:

- no study content is sent to an AI model;
- no real AI request is made;
- no real payment or charge occurs;
- test credits are local demonstration data, not a financial ledger;
- the Cloud Core readiness check must not include user study data;
- generated output is not production content and must remain labelled as mock.

Do not quietly turn a preview action into a real network action. Any production
remote task requires an intentionally scoped PR and the gate in
`docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md`.

## Repository structure

- `src/app/` — application configuration, root component, and routing;
- `src/data/` — optional built-in study units and flashcards;
- `src/features/` — feature-oriented UI and domain logic;
- `src/infrastructure/` — IndexedDB, backup/restore, and external-service clients;
- `src/shared/` — shared components, types, and utilities;
- `src/styles/` — global and feature-specific styles;
- `public/` — PWA assets and CSV templates;
- `tests/` — Vitest unit and integration tests;
- `docs/` — focused architecture and design documents.

Prefer keeping logic inside the relevant feature folder. Move code to `shared`
only when it is genuinely reused by multiple features. Keep remote-service
clients in a clear infrastructure boundary and do not mix transport logic into
presentation components.

## Development commands

Run the following before completing a code change:

```bash
npm ci
npm run typecheck
npm test
npm run build
```

When a dependency is added, removed, or updated, commit the lockfile. Avoid
dependency changes unless necessary.

## Coding expectations

- Keep TypeScript strict and avoid `any` unless there is a documented,
  unavoidable boundary.
- Use named domain types from `src/shared/types/models.ts` where applicable.
- Prefer small, focused functions and feature-local modules.
- Preserve the existing feature-folder architecture.
- Use React function components and hooks.
- Do not mutate React state directly.
- Prevent duplicate asynchronous submissions with a lock, idempotency mechanism,
  or disabled state as appropriate.
- Handle IndexedDB and network failures with useful user-facing messages.
- Do not silently discard, overwrite, upload, or save user data.
- Use transactions for multi-table or destructive database operations.
- Validate all external responses at runtime.
- Keep user-facing language clear and non-technical.
- Keep the primary interface in English unless internationalisation is changed
  intentionally across the application.
- Keep top-level navigation labels aligned with the documented UX boundaries.

## Data integrity rules

User data is the highest-risk area of this application.

Before changing imports, backups, migrations, deletion, generated-content save,
or progress tracking:

1. define whether the operation merges, replaces, creates, or deletes data;
2. validate all external data at runtime;
3. check identifiers for uniqueness;
4. check relationships such as flashcard `unitId`, progress `cardId`, and split
   PDF `sourceFileId`;
5. use a database transaction when several writes must succeed together;
6. provide confirmation before destructive replacement or deletion;
7. preserve forward compatibility through explicit schema versions and
   migrations;
8. add tests for malformed, duplicated, missing, oversized, interrupted, and
   partially completed input;
9. keep generated AI output in a review state until the user explicitly saves
   it;
10. never treat a client-side mock wallet as authoritative billing data.

Do not change the IndexedDB database name or existing table schema without a
Dexie migration plan.

## Privacy and security rules

- Keep the core application local-first.
- Do not add analytics, advertising, tracking, remote storage, accounts,
  telemetry, or cloud sync without explicit project-owner approval.
- Do not send study content, PDF data, progress, links, settings, or backups to
  an external service except through a separately approved, explicit,
  user-confirmed feature.
- Never scan the library or current document automatically for remote use.
- Send only the minimum content required for a confirmed task.
- Load third-party scripts only when necessary and, where appropriate, after
  clear user action or consent.
- Allow only explicitly supported URL protocols.
- Do not use `dangerouslySetInnerHTML` for user-controlled or model-generated
  content.
- Validate uploaded files by content where practical, not only by filename or
  declared MIME type.
- Keep external links protected with `rel="noopener noreferrer"` when opened in
  a new tab.
- Never commit secrets, access tokens, private URLs, personal data, generated
  user backups, local database exports, payment credentials, or privileged
  service keys.
- Do not expose provider secrets in Vite environment variables; browser build
  variables are public configuration.

## AI and remote-service rules

Any change from mock AI to real remote processing must define:

- exact request and response schemas;
- exact user-selected content and metadata sent;
- explicit confirmation and cancellation behaviour;
- service-unavailable, timeout, retry, and duplicate-submission behaviour;
- prompt-injection and untrusted-document handling;
- output validation before local persistence;
- retention and deletion behaviour;
- logging and redaction rules;
- rate limits and cost limits;
- legal and privacy wording;
- focused automated tests.

Cloud Core health availability must not be used as proof that an AI task,
payment, or ledger operation succeeded. Validate each operation independently.

## Credits and payment rules

The current wallet is test mode only. Before any real payment work:

- keep balances and ledgers server-authoritative;
- use idempotent purchase, reservation, settlement, release, and refund flows;
- show maximum estimated cost before confirmation;
- prevent duplicate charges, replay, negative balances, and client tampering;
- define failed, cancelled, timed-out, and partially completed task semantics;
- document receipts, taxes, refunds, disputes, and account/device recovery;
- complete security, legal, and privacy review.

A real payment or credit feature must not be introduced as a small follow-up to
mock UI work.

## Accessibility requirements

All new and modified UI must remain usable with keyboard navigation and
assistive technologies.

- Use semantic HTML before adding ARIA.
- Every input must have an accessible label.
- Interactive controls must be keyboard focusable.
- Preserve visible focus indicators.
- Provide accessible names for progress indicators and icon-only controls.
- Announce important asynchronous status changes using an appropriate live
  region.
- Check layouts at narrow widths and browser zoom up to at least 200%.
- Ensure confirmation, cost, service-status, failure, and AI-result states are
  understandable without colour alone.

## Study-session and scheduling logic

Changes to flashcards, quizzes, review queues, scheduling, or statistics require
special care.

- Keep a stable session definition; do not let a live database query
  unexpectedly skip or repeat items.
- Record actual session start separately from completion.
- Define statistics consistently across flashcards, quizzes, and reviews.
- Prevent double answers and duplicate session records.
- Make scheduling functions deterministic in tests by accepting a supplied
  clock or random function.
- Add regression tests for queue changes caused by live IndexedDB updates.

## Backup and restore

Backup labels and behaviour must agree exactly.

- A progress-only backup must not silently replace content, links, or
  preferences.
- A complete backup must be clearly labelled as containing all supported
  application data.
- Validate schema version, timestamps, number ranges, uniqueness, and supported
  setting keys.
- Show a summary before replacing current data.
- Never include local PDFs unless the UI and schema explicitly state that they
  are included.
- Do not imply that remote AI requests or Cloud Core provide backup or sync.

## PWA and deployment

- The Vite base path is currently `/` because deployment is intended for a
  custom-domain root.
- Do not change the base path without checking the actual deployment target.
- Preserve offline behaviour for the local study workflow when changing routes,
  assets, or service-worker settings.
- Do not describe remote AI tasks as offline-capable.
- Treat service-worker update behaviour as user-visible application behaviour.
- Avoid build-time values that unnecessarily prevent reproducible builds.
- Treat `VITE_CLOUD_CORE_URL` as public endpoint configuration, never as a
  secret.

## Testing expectations

Every bug fix should include a regression test where practical.

Prioritise tests for:

- spaced-repetition scheduling and queue behaviour;
- quiz option generation and duplicate-submission prevention;
- CSV parsing, headers, quoting, limits, and identifier collisions;
- backup validation and transactional restore;
- IndexedDB failure paths and migrations;
- data deletion and orphan cleanup;
- local-file policy and split-PDF relationships;
- keyboard accessibility of forms and upload controls;
- PWA offline and update behaviour;
- Cloud Core response validation, timeouts, and unavailable states;
- AI confirmation, cancellation, duplicate prevention, output validation, and
  no-save-before-approval behaviour;
- billing idempotency and failure semantics before any real credit work.

## Agent workflow

- Use one focused branch or PR per task.
- Keep changes reviewable and avoid unrelated cleanup.
- State the exact files changed and why.
- State the commands run and their results.
- For documentation-only changes, say when tests were not run.
- For any user-data, remote-processing, AI, or payment change, document the
  data-safety and privacy impact in the PR.
- Update living documentation in the same PR when behaviour or boundaries
  change.
