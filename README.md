# Generic Study App

A local-first, subject-neutral study application template.

The project keeps the learning workflow of the original study app while starting with no subject content:

- empty chapters;
- empty flashcard collection;
- empty built-in study-material links;
- flashcards with self-rating `0 / 1 / 2`;
- local spaced repetition and due-review queue;
- ten-question quizzes when enough cards exist;
- local progress dashboard;
- validated JSON backup and restore;
- offline-ready PWA without accounts or backend.

## Application structure

The primary study flow is organised around these areas:

- **Home** — entry point for Study, Learn and Library;
- **Study & Learn** — the learning workspace, split into **Study** for theory and **Learn** for exercises;
- **Library** — source materials organised as Books, Articles, Papers and Notes.

## Study vocabulary

The app uses this study hierarchy:

```text
Subject
└── Chapter
    └── Section
        └── Concept
            └── Flashcards
```

- **Subject** — the full field or course, such as Cognitive Psychology.
- **Chapter** — a major part of the subject.
- **Section** — a smaller part inside a chapter.
- **Concept** — a key idea to understand and remember.
- **Flashcard** — a question-and-answer item for active recall.
- **Review** — spaced repetition of due flashcards.
- **Quiz** — a short test built from flashcards.
- **Progress** — local study history and review data.
- **Library** — study sources, links and local files.

## Library

The Library stores source material. It supports cloud links and local files kept inside the browser on the current device. Local files can include PDFs, Word documents, text files, CSV files and images, subject to the configured size limit.

## Study and Learn

**Study** is for theory: selecting sources, organising contents, chapters, sections, concepts, bibliography, images, diagrams, tables, notes and summaries.

**Learn** is for exercises: flashcards, due review, quizzes, practice and progress tracking.

Content import, detailed progress and study-material management remain available through the app navigation.

## Add a subject

1. Edit `src/app/studyConfig.ts` for the application and subject names.
2. Add chapters to `src/data/units.ts`.
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

See `LICENSE` for the repository's source-visible, all-rights-reserved terms.
