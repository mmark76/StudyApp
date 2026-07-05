# Generic Study App

A local-first, topic-neutral study application template.

The project keeps the learning workflow of the original study app while starting with no subject content:

- empty study units;
- empty flashcard collection;
- empty built-in study-material links;
- flashcards with self-rating `0 / 1 / 2`;
- local spaced repetition and due-review queue;
- ten-question quizzes when enough cards exist;
- local progress dashboard;
- validated JSON backup and restore;
- offline-ready PWA without accounts or backend.

## Application structure

The primary navigation is intentionally limited to three areas:

- **Home** — today's recommended action, due reviews, recent activity and a concise progress overview;
- **Study & Learn** — the learning workspace, split into **Study** for theory and **Learn** for exercises;
- **Library** — source materials organised as Books, Articles, Papers and Notes.

## Library

The Library stores source material. It supports cloud links and local files kept inside the browser on the current device. Local files can include PDFs, Word documents, text files, CSV files and images, subject to the configured size limit.

## Study and Learn

**Study** is for theory: selecting sources, organising contents, chapters, paragraphs, bibliography, images, diagrams, tables, notes and summaries.

**Learn** is for exercises: flashcards, due review, quizzes, practice and progress tracking.

Content import, detailed progress, study-material management and education-level controls remain available through the auxiliary **More** menu.

## Add a subject

1. Edit `src/app/studyConfig.ts` for the application and subject names.
2. Add units to `src/data/units.ts`.
3. Add flashcards to `src/data/flashcards.ts`.
4. Optionally add built-in links to `src/features/study-materials/studyMaterials.ts`.

The data model is generic and can be used for any academic, professional, or personal study subject.

## Development

```bash
npm install
npm run dev
npm run typecheck
npm test
npm run build
```

## Data and privacy

Study progress, user-added links and local files remain in the browser's IndexedDB unless the user exports a backup. Progress backups include progress, sessions and settings, but they do not include local file blobs.

## Licence

Copyright © 2026 Markellos Markides. All rights reserved.

This project is publicly visible but is not open source. No permission is granted to copy, modify, distribute, rehost, sublicense, sell, or otherwise reuse the source code or original content without prior written permission.
