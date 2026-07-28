# Architecture

_Last updated: 2026-07-28_

## Summary

StudyApp is a local-first single-page application for organizing, reading,
practising, and reviewing study material. It is frontend-only and requires no
account, backend API, analytics service, or cloud sync.

## Technology stack

- React 19 and TypeScript
- Vite and React Router hash routing
- Dexie over IndexedDB
- PDF.js and pdf-lib
- Vitest
- vite-plugin-pwa

## Runtime and storage

The application runs in the browser. IndexedDB contains:

- `cardProgress` — spaced-repetition state;
- `studySessions` — completed study/quiz session records;
- `settings` — appearance, imported content, and saved links;
- `studyFiles` — uploaded and generated local file metadata and blobs.

The current JSON backup covers progress, sessions, and supported settings. It
does not contain `studyFiles` blobs.

## Routing

The app uses hash routing so static hosting needs no server-side route
handling.

- `/` — Home
- `/library` — Library from Source
- `/study/theory` — Structured Study
- `/learn` — Learn & Practice
- `/flashcards`, `/review`, `/quiz`, `/progress` — practice flows
- `/import` — chapter and flashcard CSV import
- `/tools` — Split PDF Tool
- `/appearance` — local appearance settings
- `/legal/*` — legal information

`/study-materials` is a legacy compatibility route that redirects to
`/library`. It is not a navigation area. The `src/features/study-materials/`
folder remains the feature-local home of shared file/link and PDF-splitting
logic; its name does not imply a standalone page.

## Product areas

### Library from Source

Adds, classifies, opens, and removes original source files and links. Source
material is read here.

### Structured Study

Adds, classifies, opens, and removes material by structure and level. Generated
split-PDF extracts are read and placed here.

### Learn & Practice

Supports flashcards, stable due-review sessions, quizzes, CSV import, and
progress.

### Split PDF Tool

Accepts direct PDF input and splits it locally. Generated chunks are saved as
local study files with `fileSource: "split-pdf"` and a `sourceFileId` where
available.

## Safety boundaries

- External input is validated at runtime.
- Local-file save and open flows share one explicit allowlist.
- Active web/executable content is rejected and non-renderable supported files
  download instead of opening in the app origin.
- Restore validates the entire backup before one transactional replacement.
- Imported flashcard IDs derive from normalized stable content rather than CSV
  row position.
- Destructive file operations require an intentional user choice.
- PWA updates wait for the user's explicit **Update now** action; an update
  never reloads an active page automatically.

## High-risk areas

- IndexedDB schema changes and migrations
- Backup/restore and local-file export
- Browser storage quota and large PDF processing
- Source/split-PDF relationships
- Study-session lifecycle and persistence failures
- PWA service-worker updates

## Testing strategy

Focused unit and IndexedDB integration tests cover scheduling, review queues,
quiz locks, CSV parsing and identity, local-file policy, backup validation and
transaction rollback, local-file relationships, and PWA update state.

Broader browser/E2E, accessibility, and large-PDF stress coverage is explicitly
deferred to [`V1_1_BACKLOG.md`](V1_1_BACKLOG.md).
