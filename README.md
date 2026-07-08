# StudyApp

A local-first, subject-neutral study application template.

## Vision and goal

The long-term goal of this project is documented in [`VISION.md`](VISION.md).

In short, StudyApp is intended to become a **local-first personal knowledge and learning system**: a private workspace where the user can keep study material, read it from source, study it through structure, practise it through active recall, and protect local ownership of data.

The app should not be understood only as a flashcards app. Flashcards, quizzes, review queues and spaced repetition are learning tools inside a broader system for organising, understanding, remembering and recalling knowledge.

## Project guidance documents

Before making larger code, data-model, or workflow changes, read these files:

- [`AGENTS.md`](AGENTS.md) — instructions for AI coding agents and automated contributors.
- [`AUDIT.md`](AUDIT.md) — current audit findings and priority risks.
- [`ROADMAP.md`](ROADMAP.md) — recommended development sequence.
- [`CODEX_TASKS.md`](CODEX_TASKS.md) — small, focused tasks suitable for Codex-style implementation.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — PR and review rules.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — architecture overview.
- [`DATA_MODEL.md`](DATA_MODEL.md) — persisted data model and relationship rules.
- [`BACKUP_AND_DATA_SAFETY.md`](BACKUP_AND_DATA_SAFETY.md) — backup limitations and data-safety expectations.
- [`SECURITY.md`](SECURITY.md) — security and privacy boundaries.

## Current product areas

The user-facing workflow is intentionally separated into distinct areas so that actions do not overlap.

1. **Library from Source** — read original/source material only.
   - Books
   - Articles
   - Papers
   - Source or external notes
   - My Notes
   - Summaries
   - Final source-material placement and correction

2. **Structured Study** — read and understand the same material through structure.
   - Contents
   - Chapters
   - Sections / Paragraphs
   - Key Concepts
   - Bibliography / References
   - Images / Diagrams
   - Split PDF extracts created from source material
   - Final structured-study placement and correction

3. **Learn & Practice** — practise and consolidate knowledge.
   - Flashcards
   - Due review
   - Quiz
   - Progress

4. **Split PDF Tool** — use a local browser-only utility to split saved PDF files.
   - The only intentional overlap with material management is an extra **Upload PDF** action, limited to uploading a PDF directly for splitting.
   - Generated split PDFs are shown under **Structured Study** as structured source extracts, not under **Library from Source**.
   - Each generated chunk must be given a user-chosen display name and structured type such as Contents, Chapter, Section / Paragraph, Key Concept, Bibliography / Reference, or Image / Diagram.

5. **Add / Remove Material** — add or remove local files and cloud links.
   - Add material from this device
   - Add material from a cloud link
   - Choose a source type such as Book, Article, Paper, Outsource Note, My Note, or Summary
   - Remove saved local files or cloud links

The guiding boundary is:

```text
Library from Source   = read and final-place original/source material
Structured Study      = read and final-place the same material by structure and level
Learn & Practice      = practise and consolidate
Split PDF Tool        = PDF splitting utility, plus Upload PDF for direct split input only
Add / Remove Material = material management only
```

## Intended learning workflow

The intended user workflow is:

1. add or save study material such as PDFs, Word documents, links, images, diagrams, charts, notes, bibliography and references through **Add / Remove Material**;
2. give source material a display name and source type so it appears under Books, Articles, Papers, Outsource Notes, My Notes or Summaries;
3. read the original/source material through **Library from Source** and correct its final Library placement there when needed;
4. use **Split PDF Tool** when a PDF needs to be uploaded for splitting or divided into smaller local files;
5. give each split PDF chunk a display name and structured type so it appears under Contents, Chapters, Sections / Paragraphs, Key Concepts, Bibliography / References or Images / Diagrams;
6. read and understand the same material by structure through **Structured Study** and correct its final Structured Study placement there when needed;
7. practise and consolidate knowledge through **Learn & Practice** using flashcards, due review, quizzes and progress tracking;
8. retrieve information through meaningful filters such as source, chapter, section, concept, material type, difficulty, due status, review history, bibliography or reference.

The app should not silently guess the educational type of saved material. Items without a user-chosen type remain **Unclassified** until the user chooses their final placement.

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
- **Library from Source** — read primary/source material and correct its final source-material placement.
- **Structured Study** — read the same material through contents, chapters, sections, concepts, references, diagrams and split PDF extracts, and correct final structured placement.
- **Learn & Practice** — practise with flashcards, due review, quizzes and progress tracking.
- **Split PDF Tool** — split local PDFs in the browser; it may upload a PDF only as direct input for splitting.
- **Add / Remove Material** — add or remove local files and cloud links.

## Local-first data and privacy

Study progress, user-added links and local files remain in the browser's IndexedDB unless the user exports a backup or manually opens a cloud link. The application has no account system and no backend by default.

Local files are stored only in this browser on this device. They are not uploaded and are not synced by StudyApp. Cloud links store only the title, type and URL; the actual file remains in the user's cloud service.

Progress/settings backups include progress, sessions and settings-backed data. They do not include local file blobs such as uploaded PDFs, documents, images or generated split PDFs. Keep original files outside StudyApp as your primary file copies.

For more detail, see [`BACKUP_AND_DATA_SAFETY.md`](BACKUP_AND_DATA_SAFETY.md).

## Current limitations

These limitations are intentional or known at this stage:

- Local files and split PDFs depend on browser storage.
- Progress/settings backups do not currently include local file blobs.
- Duplicate local file detection should be improved with content hashing.
- Source-file deletion should intentionally handle any related split PDFs.
- Review and quiz flows need regression protection for queue stability and duplicate submissions.

See [`AUDIT.md`](AUDIT.md) and [`ROADMAP.md`](ROADMAP.md) for the current priority plan.

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

Before merging code changes, run:

```bash
npm test
npm run typecheck
npm run build
```

Documentation-only changes should still explain that tests were not run.

## Contributor workflow

- Use one focused branch or PR per task.
- Start with the tasks in [`CODEX_TASKS.md`](CODEX_TASKS.md).
- Follow [`AGENTS.md`](AGENTS.md) for Codex-style work.
- Follow [`CONTRIBUTING.md`](CONTRIBUTING.md) for PR requirements.
- Keep the local-first/no-backend boundary unless the owner explicitly changes the product direction.

## Licence

Copyright © 2026 Markellos Markides. All rights reserved.

See `LICENSE` for the repository's source-visible, all-rights-reserved terms.
