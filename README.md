# StudyApp

A local-first, subject-neutral personal knowledge and learning application with
an early AI Assistant workflow preview.

## Current status

StudyApp has two clearly separated capability layers:

1. **Released local-first study workflow** — add user-provided material, read it
   from source or structure, practise through active recall, and keep progress
   in the current browser.
2. **AI Assistant preview** — a test-mode interface for questions, summaries,
   explanations, quizzes, and flashcards. It uses mock results and test credits;
   it does not yet send study material to an AI model or make real charges.

The local study workflow is the production capability. The AI Assistant is a
preview of a future optional cloud-assisted workflow and must not be treated as
cloud storage, cloud sync, permanent storage, or an operational paid AI service.

See [`docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md`](docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md)
for the authoritative current and future boundaries.

## Version 1.0.0

StudyApp v1 provides a practical browser-based workflow for adding
user-provided study material, reading it from source or structure, practising
with active recall, and keeping progress locally. It is a content-use and study
tool, not a permanent-storage, archive, or backup service.

The v1 safety gate includes:

- a central local-file allowlist with content checks and safe open/download
  behaviour;
- strict backup validation, a restore preview, explicit confirmation, and an
  atomic IndexedDB restore;
- deterministic content-based IDs for spreadsheet-imported flashcards;
- stable review queues and quiz duplicate-answer protection;
- a user-controlled PWA update prompt that never reloads an active page
  automatically;
- automated install, typecheck, test, and production-build checks.

See [`RELEASE_NOTES_v1.md`](RELEASE_NOTES_v1.md) for the historical v1 release
summary, [`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md) for the acceptance gate,
and [`V1_1_BACKLOG.md`](V1_1_BACKLOG.md) for deferred and post-v1 work. The
focused download/storage-notice follow-up is recorded in
[`RELEASE_HARDENING_SMOKE_TEST.md`](RELEASE_HARDENING_SMOKE_TEST.md).

## Product areas

Home introduces the workflow. The main work is divided into four local study
areas plus the AI Assistant preview:

1. **Library from Source** — add, classify, open, and remove original/source
   files and links under Books, Articles, Papers, Source Notes, My Notes, or
   Summaries.
2. **Structured Study** — add, classify, open, and remove material organised as
   Contents, Chapters, Sections / Paragraphs, Key Concepts,
   Bibliography / References, or Images / Diagrams.
3. **Learn & Practice** — import or use flashcards, complete due reviews, take
   quizzes, and inspect progress.
4. **Split PDF Tool** — import a PDF into the current browser as direct input,
   split it locally into named structured extracts, and download the generated
   PDFs when they are needed outside StudyApp.
5. **AI Assistant preview** — explore the planned confirmation, service-status,
   test-credit, result-review, and local-save workflow. Current results are
   samples only.

There is no standalone material-management page. Files and links are managed in
Library or Structured Study according to their final reading destination. The
legacy `#/study-materials` URL redirects to Library for compatibility.

## Intended local study workflow

1. Add original material in Library, or material already organised by level in
   Structured Study.
2. Give each item a clear display name and classification.
3. Read source material in Library.
4. Use Split PDF Tool when a source PDF needs smaller focused extracts.
5. Read those extracts in Structured Study.
6. Create or import your own chapters and flashcards from the supplied CSV
   templates.
7. Practise through flashcards, due review, and quizzes.
8. Inspect progress and regularly export a progress/settings backup.

## AI Assistant preview

The preview currently offers mock flows for:

- asking a question about deliberately selected or pasted text;
- creating flashcards;
- creating a quiz;
- summarising material;
- explaining a concept more clearly.

The preview demonstrates the intended sequence: choose a task, choose material,
review an estimated maximum credit cost, confirm, review a result, and decide
whether to save it. In the current implementation:

- no selected study content is sent to an AI model;
- no real AI response is generated;
- no real payment, purchase, credit reservation, or charge occurs;
- the test wallet is stored locally and is not a financial record;
- saving a mock result does not create production AI-generated study content.

StudyApp may perform a Cloud Core readiness check so the interface can show
whether future AI services appear online. This operational request sends no
study material, local files, progress, links, settings, or backups.

## Local-first storage and privacy

Study content, progress, settings, links, and uploaded file blobs are stored in
the browser's IndexedDB. StudyApp currently has no user account, cloud storage,
cloud sync, analytics, telemetry, or advertising.

Local files stay in the current browser on the current device. Clearing site
data, removing the application or browser profile, exhausting or damaging
browser storage, or changing browser or device can remove them. StudyApp is not
permanent storage or a file backup. Keep original files and required copies
outside StudyApp.

The JSON backup includes progress, sessions, supported settings,
settings-backed imported content, and saved link records. It does **not**
include uploaded PDFs, documents, images, or generated split-PDF blobs. See
[`BACKUP_AND_DATA_SAFETY.md`](BACKUP_AND_DATA_SAFETY.md).

Generated split PDFs remain stored in IndexedDB until the user removes them.
Each split PDF has a **Download** action. After a successful multi-chunk split,
**Download all** starts one download for each output from that latest split
only; it does not include older outputs.

A future production AI task may send only the material that the user explicitly
selects and confirms. That feature is not implemented yet and must satisfy the
privacy, security, billing, and data-minimisation gates in
[`docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md`](docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md).

## Supported local files

StudyApp accepts PDF, DOC, DOCX, TXT, Markdown, CSV, PNG, JPEG, WebP, and GIF
files after checking extension, browser MIME information, and common content
signatures where practical. Safe browser-renderable formats may open in a new
tab; Word files download instead.

HTML/XHTML, SVG, XML, JavaScript, executable content, unsupported formats, and
significantly mismatched file types are rejected. This allowlist applies both
when a file is saved and when a stored file is opened.

## Current limitations

- Local file blobs and split PDFs are not included in the JSON backup.
- Storage capacity and persistence depend on the browser and device.
- Browsers may ask the user to allow multiple downloads when **Download all**
  is used.
- Existing legacy row-based flashcard IDs are preserved; they are not guessed
  or automatically migrated to content-based IDs.
- The AI Assistant produces mock results only and uses test credits only.
- Cloud Core connectivity currently indicates service readiness; it does not
  provide cloud sync, remote storage, production AI, user accounts, or billing.
- PDF processing, complete local-file export/import, production AI integration,
  broader browser integration tests, and other non-blocking improvements are
  deferred to [`V1_1_BACKLOG.md`](V1_1_BACKLOG.md).

## Project guidance

- [`VISION.md`](VISION.md) — owner intent and product boundaries.
- [`AGENTS.md`](AGENTS.md) — repository rules for coding agents.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — runtime and feature architecture.
- [`DATA_MODEL.md`](DATA_MODEL.md) — persisted data and relationship rules.
- [`SECURITY.md`](SECURITY.md) — security and privacy boundaries.
- [`docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md`](docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md)
  — current AI preview, remote-data, credits, and production gates.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribution and review rules.
- [`AUDIT.md`](AUDIT.md) — historical v1 release assessment.
- [`ROADMAP.md`](ROADMAP.md) and [`CODEX_TASKS.md`](CODEX_TASKS.md) — completed
  v1 work and current handoff.

## Development

```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

Before merging a code change, run `npm ci`, typecheck, the full test suite, and
the production build. Documentation-only changes should state when tests were
not run.

## Add built-in subject content

1. Edit `src/app/studyConfig.ts` for application and subject names.
2. Add chapters to `src/data/units.ts`.
3. Add flashcards to `src/data/flashcards.ts`.
4. Optionally add built-in links to
   `src/features/study-materials/studyMaterials.ts`.

The data model is generic and can support academic, professional, or personal
study subjects.

## Licence

Copyright © 2026 Markellos Markides. All rights reserved.

See [`LICENSE`](LICENSE) for the source-visible, all-rights-reserved terms.
