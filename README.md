# StudyApp

A local-first, subject-neutral personal knowledge and learning application.

## Version 1.0.0

StudyApp v1 provides a practical browser-only workflow for adding study
material, reading it from source or structure, practising with active recall,
and keeping progress locally.

The v1 safety gate includes:

- a central local-file allowlist with content checks and safe open/download
  behavior;
- strict backup validation, a restore preview, explicit confirmation, and an
  atomic IndexedDB restore;
- deterministic content-based IDs for spreadsheet-imported flashcards;
- stable review queues and quiz duplicate-answer protection;
- a user-controlled PWA update prompt that never reloads an active page
  automatically;
- automated install, typecheck, test, and production-build checks.

See [`RELEASE_NOTES_v1.md`](RELEASE_NOTES_v1.md) for the release summary,
[`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md) for the acceptance gate, and
[`V1_1_BACKLOG.md`](V1_1_BACKLOG.md) for explicitly deferred work.

## Product areas

Home introduces the workflow. The main work is divided into four areas:

1. **Library from Source** — add, classify, open, and remove original/source
   files and links under Books, Articles, Papers, Source Notes, My Notes, or
   Summaries.
2. **Structured Study** — add, classify, open, and remove material organized
   as Contents, Chapters, Sections / Paragraphs, Key Concepts,
   Bibliography / References, or Images / Diagrams.
3. **Learn & Practice** — import or use flashcards, complete due reviews, take
   quizzes, and inspect progress.
4. **Split PDF Tool** — upload a PDF as direct input and split it locally into
   named structured extracts.

There is no standalone material-management page. Files and links are managed
in Library or Structured Study according to their final reading destination.
The legacy `#/study-materials` URL redirects to Library for compatibility.

## Intended workflow

1. Add original material in Library, or material already organized by level in
   Structured Study.
2. Give each item a clear display name and classification.
3. Read source material in Library.
4. Use Split PDF Tool when a source PDF needs smaller focused extracts.
5. Read those extracts in Structured Study.
6. Import chapters and flashcards from the supplied CSV templates.
7. Practise through flashcards, due review, and quizzes.
8. Inspect progress and regularly export a progress/settings backup.

## Local-first storage and privacy

Study content, progress, settings, links, and uploaded file blobs are stored in
the browser's IndexedDB. StudyApp has no account system, backend, analytics,
telemetry, advertising, remote storage, or cloud sync.

Local files stay in the current browser on the current device. Clearing site
data, removing the browser profile, exhausting browser storage, or changing
device can remove them. Keep the original files outside StudyApp.

The JSON backup includes progress, sessions, supported settings,
settings-backed imported content, and saved link records. It does **not**
include uploaded PDFs, documents, images, or generated split-PDF blobs. See
[`BACKUP_AND_DATA_SAFETY.md`](BACKUP_AND_DATA_SAFETY.md).

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
- Existing legacy row-based flashcard IDs are preserved; they are not guessed
  or automatically migrated to content-based IDs.
- PDF processing, complete local-file export/import, broader browser
  integration tests, and other non-blocking improvements are deferred to
  [`V1_1_BACKLOG.md`](V1_1_BACKLOG.md).

## Project guidance

- [`VISION.md`](VISION.md) — owner intent and product boundaries.
- [`AGENTS.md`](AGENTS.md) — repository rules for coding agents.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — runtime and feature architecture.
- [`DATA_MODEL.md`](DATA_MODEL.md) — persisted data and relationship rules.
- [`SECURITY.md`](SECURITY.md) — security and privacy boundaries.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribution and review rules.
- [`AUDIT.md`](AUDIT.md) — v1 release assessment.
- [`ROADMAP.md`](ROADMAP.md) and [`CODEX_TASKS.md`](CODEX_TASKS.md) — completed
  v1 work and the handoff to the v1.1 backlog.

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
