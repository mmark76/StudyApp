# Architecture

_Last updated: 2026-07-08_

## Summary

StudyApp is a local-first single-page application for organizing, reading, practising, and reviewing study material.

The application is intentionally frontend-only by default. It uses browser storage and does not require a user account, backend API, analytics service, or cloud sync.

## Technology stack

- React
- TypeScript
- Vite
- React Router hash routing
- Dexie / IndexedDB
- PDF.js and pdf-lib for PDF handling
- Vitest for unit tests
- vite-plugin-pwa for PWA support

## Runtime model

The app runs entirely in the browser. User data is stored in IndexedDB.

Main storage responsibilities:

- `cardProgress`: spaced repetition state;
- `studySessions`: completed study/quiz sessions;
- `settings`: app settings, imported content, and saved links;
- `studyFiles`: local file blobs and metadata.

## Routing

The app uses hash routing so that static hosting can serve the application without server-side route handling.

Main routes map to product areas:

- `/` home
- `/library` Library from Source
- `/study/theory` Structured Study
- `/study` Learn & Practice overview
- `/flashcards` flashcards
- `/review` due review
- `/quiz` quiz
- `/progress` progress
- `/import` content import
- `/study-materials` add/remove material
- `/tools` tools and PDF splitting
- `/legal/*` legal information

## Product areas

### Library from Source

Shows original source material and saved cloud links. Allows final source-material placement/correction.

### Structured Study

Shows split PDF extracts by structured type. Allows final structured placement/correction.

### Learn & Practice

Supports active recall, due review, quiz, and progress.

### Split PDF Tool

Splits local PDFs in the browser. Generated chunks are saved as local study files with `fileSource: "split-pdf"`.

### Add / Remove Material

Adds local files and cloud links and removes saved material.

## Data flow

1. User adds source material.
2. Source material is stored as local file metadata/blob or as a saved cloud link.
3. User can classify source material into source categories.
4. User can split PDFs into structured chunks.
5. Split chunks are classified into structured study categories.
6. User studies material and practises with flashcards, review, and quiz.
7. Progress and sessions are stored locally.

## Design constraints

- Keep data local by default.
- Avoid backend dependencies.
- Validate all imported or stored unknown data at runtime.
- Avoid silent destructive actions.
- Keep local file backup/export limitations explicit.
- Keep source reading, structured reading, and practice workflows separate.

## High-risk areas

- IndexedDB schema changes and migrations.
- Backup and restore behavior.
- Local file blobs and browser storage quota.
- Source file deletion when split PDFs exist.
- Review queue stability under live progress updates.
- PDF splitting memory usage.
- PWA service-worker update behavior.

## Testing strategy

Prioritize tests for pure domain logic and data safety:

- spaced repetition scheduling;
- review queue behavior;
- quiz generation and answer locking;
- CSV parsing and validation;
- local file classification;
- backup/restore validation;
- source/split PDF relationship handling.
