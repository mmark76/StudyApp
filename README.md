# StudyApp

A local-first, subject-neutral study application template.

## Vision and goal

The long-term goal of this project is documented in [`VISION.md`](VISION.md).

In short, StudyApp is intended to become a **local-first personal knowledge and learning system**: a private workspace where the user can keep study material, read it from source, study it through structure, practise it through active recall, and protect local ownership of data.

The app should not be understood only as a flashcards app. Flashcards, quizzes, review queues and spaced repetition are learning tools inside a broader system for organising, understanding, remembering and recalling knowledge.

## Current product areas

The user-facing workflow is intentionally separated into distinct areas so that actions do not overlap.

1. **Library from Source** — read original/source material only.
   - Books
   - Articles
   - Papers
   - Source or external notes
   - My Notes
   - Summaries

2. **Structured Study** — read and understand the same material through structure.
   - Contents
   - Chapters
   - Sections / Paragraphs
   - Key Concepts
   - Bibliography / References
   - Images / Diagrams
   - Split PDF extracts created from source material

3. **Learn & Practice** — practise and consolidate knowledge.
   - Flashcards
   - Due review
   - Quiz
   - Progress

4. **Split PDF Tool** — use a local browser-only utility to split saved PDF files.
   - The only intentional overlap with material management is an extra **Upload PDF** action, limited to uploading a PDF directly for splitting.
   - Generated split PDFs are shown under **Structured Study** as structured source extracts, not under **Library from Source**.

5. **Add / Remove Material** — add or remove local files and cloud links.
   - Add material from this device
   - Add material from a cloud link
   - Remove saved local files or cloud links

The guiding boundary is:

```text
Library from Source   = read from original/source material
Structured Study      = read the same material by structure and level
Learn & Practice      = practise and consolidate
Split PDF Tool        = PDF splitting utility, plus Upload PDF for direct split input only
Add / Remove Material = material management only
```

## Intended learning workflow

The intended user workflow is:

1. add or save study material such as PDFs, Word documents, links, images, diagrams, charts, notes, bibliography and references through **Add / Remove Material**;
2. read the original/source material through **Library from Source**;
3. read and understand the same material by structure through **Structured Study**;
4. practise and consolidate knowledge through **Learn & Practice** using flashcards, due review, quizzes and progress tracking;
5. use **Split PDF Tool** when a PDF needs to be uploaded for splitting or divided into smaller local files; generated split PDFs appear in **Structured Study**;
6. retrieve information through meaningful filters such as source, chapter, section, concept, material type, difficulty, due status, review history, bibliography or reference.

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

## Study vocabulary

The app uses this study hierarchy:

```text
Source Material
└── Structured Study
    ├── Contents
    ├── Chapters
    ├── Sections / Paragraphs
    ├── Key Concepts
    ├── Bibliography / References
    └── Images / Diagrams
        └── Learn & Practice
            ├── Flashcards
            ├── Review
            ├── Quiz
            └── Progress
```

- **Source Material** — the original book, paper, article, note, PDF, file or link.
- **Library from Source** — read primary/source material and notes without add/remove actions.
- **Structured Study** — read the same material through contents, chapters, sections, concepts, references, diagrams and split PDF extracts.
- **Learn & Practice** — practise with flashcards, due review, quizzes and progress tracking.
- **Split PDF Tool** — split local PDFs in the browser; it may upload a PDF only as direct input for splitting.
- **Add / Remove Material** — add or remove local files and cloud links.

## Local-first data and privacy

Study progress, user-added links and local files remain in the browser's IndexedDB unless the user exports a backup or manually opens a cloud link. The application has no account system and no backend by default.

Local files are stored only in this browser on this device. They are not uploaded and are not synced by StudyApp. Cloud links store only the title and URL; the actual file remains in the user's cloud service.

Progress backups include progress, sessions and settings, but they do not include local file blobs.

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

## Licence

Copyright © 2026 Markellos Markides. All rights reserved.

See `LICENSE` for the repository's source-visible, all-rights-reserved terms.
