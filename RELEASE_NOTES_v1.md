# StudyApp v1.0.0 Release Notes

_Release gate date: 2026-07-28_

## What v1 includes

- Local-first Library and Structured Study areas for adding, classifying,
  opening, and removing study files and links.
- A browser-only PDF splitter that creates named structured extracts without
  uploading PDFs.
- CSV chapter and flashcard import with required headers, duplicate detection,
  and stable content-based flashcard IDs.
- Flashcards, stable due-review queues, quizzes, spaced repetition, progress,
  and local session history.
- Appearance settings and offline-ready PWA support.
- A deferred PWA update prompt: the page reloads only after the user chooses
  **Update now**.
- A progress/settings JSON backup with strict validation, preview, explicit
  confirmation, and transactional restore.
- Central safe handling for every uploaded or reopened local study file.

## Local-first storage limitations

All app data is stored in the current browser profile. StudyApp has no account,
backend, cloud sync, analytics, or telemetry. Browser site-data clearing,
profile removal, device loss, or storage pressure can remove local data. Keep
original study files outside StudyApp.

## Backup limitations

The JSON backup includes card progress, study sessions, supported settings,
settings-backed imported chapters and flashcards, and saved link records. It
does not include uploaded file blobs or generated split-PDF blobs. Restoring a
backup replaces the covered data classes after validation and confirmation; it
does not change local file blobs.

## Supported local file types

- PDF
- DOC and DOCX
- TXT and Markdown
- CSV
- PNG, JPEG, WebP, and GIF

StudyApp checks extension, MIME information, and common signatures where
practical. PDF, text, and supported images may preview in a new tab. Word files
download. HTML/XHTML, SVG, XML, JavaScript, executables, unsupported files, and
significant type mismatches are rejected.

## Known non-blocking limitations

- Complete local-file backup/export is not implemented.
- Browser storage capacity is not estimated before large PDF work, and
  multi-chunk processing has limited progress/cancellation feedback.
- Nested split-PDF relationships are not traversed recursively during source
  deletion; retained descendants remain stored but may lose source lineage.
- Some study-session timing and persistence-failure UX needs stronger lifecycle
  handling.
- Browser/E2E, accessibility, coverage, linting, and dependency-advisory
  automation are not yet part of the standard test gate.
- `npm audit --omit=dev` flags
  [GHSA-qwww-vcr4-c8h2](https://github.com/advisories/GHSA-qwww-vcr4-c8h2)
  in React Router. The advisory applies only to unstable RSC APIs; StudyApp is
  a client-only hash-routed SPA with no RSC, server actions, or backend, so the
  vulnerable path is not present. Moving to the patched major release is
  deferred as a separately reviewed dependency migration.
- Existing legacy row-based flashcard progress is preserved and is not
  automatically migrated to new content-based IDs.

The scoped follow-up list is in [`V1_1_BACKLOG.md`](V1_1_BACKLOG.md). No v1.1
work is included in this release.
