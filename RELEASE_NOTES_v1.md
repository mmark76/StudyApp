# StudyApp v1.0.0 Release Notes

_Current production verification: 2026-08-20_

## August 20 verified production release

StudyApp v1.0.0 is now **RELEASE VERIFIED** for the current deployed build.

Release identity:

- PR: `#186`;
- production `main` SHA: `5d94e2744014e1d87a4e65d8462ac98082d3e1ce`;
- deployed build: `v1.0.0_20260820_2202_5d94e27`;
- stable release branch: `stable/release-2026-08-20`.

The August remediation resolved four confirmed release blockers:

- DATA-04;
- WB-01;
- WB-02;
- WB-03.

Verification for the exact remediation state passed typecheck, the production
build, 268/268 unit tests, 49/49 E2E tests, Linux CI and the production-only
dependency audit with 0 vulnerabilities.

Interactive production smoke verification then passed DATA-04 and
WB-01/WB-02/WB-03 in Google Chrome `151.0.7922.138` using Playwright `1.62.1`.
No runtime/React error or critical request failure was observed. Temporary smoke
data was removed through the normal UI and cleanup was confirmed after reload.
A non-material `/favicon.ico` 404 remains.

## July 28 release-hardening follow-up

The July 28 follow-up preserved the v1 feature scope while making its limited
personal-use model explicit:

- visible shared notices explain local browser storage, data-loss risk,
  original-file retention, and the exact progress/settings backup boundary;
- adding a file is described as importing a local browser copy, not sending it
  to a server;
- chapters, flashcards, quizzes, and other study content are user-provided;
  StudyApp does not generate them automatically;
- each generated split PDF can be downloaded with its stored PDF filename;
- a successful multi-chunk split offers **Download all** for only that latest
  result, using separate browser downloads with no ZIP dependency.

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
- Workspace BETA as a separate experimental multi-panel UX area. The current
  DATA-04 and WB-01/WB-02/WB-03 release-blocking defects are resolved without
  changing the stable top-level product scope.

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

- DATA-02 remains Low/non-blocking.
- WB-04 remains Low/non-blocking.
- Complete local-file backup/export is not implemented.
- Browsers may prompt for permission before allowing several files from
  **Download all**.
- Browser storage capacity is not estimated before large PDF work, and
  multi-chunk processing has limited progress/cancellation feedback.
- Nested split-PDF relationships are not traversed recursively during source
  deletion; retained descendants remain stored but may lose source lineage.
- Some study-session timing and persistence-failure UX may benefit from further
  lifecycle hardening.
- Two high-severity advisories remain in transitive build/dev dependencies;
  the production-only dependency audit is clean.
- Firefox and WebKit interactive verification remain future cross-browser work.
- Manual screen-reader verification remains future accessibility work.
- Existing legacy row-based flashcard progress is preserved and is not
  automatically migrated to new content-based IDs.

The scoped follow-up list remains in [`V1_1_BACKLOG.md`](V1_1_BACKLOG.md). No
unrelated v1.1 feature expansion is implied by the August release verification.
