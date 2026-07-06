# AGENTS.md

## Purpose

This file provides working guidance for AI coding agents and automated contributors operating in this repository.

The project is **source-visible but proprietary**. Read `LICENSE` before making or proposing changes. Do not copy, relicense, redistribute, or reuse project code outside this repository.

## Project overview

Markellos Study App is a local-first, offline-ready study application built with:

- React 19
- TypeScript
- Vite
- React Router
- Dexie / IndexedDB
- Vitest
- `vite-plugin-pwa`

The application has no account system or backend. User-created study content, progress, settings, links, and local PDF files are stored in the browser.

## Product vision and owner intent

Before making product, architecture, data-model, or UX decisions, read [`VISION.md`](VISION.md).

The owner intent is to build a **local-first personal knowledge and learning system**, not only a flashcards app. The app should help the user collect study material, understand it at multiple depths, transform it into active learning, and retrieve knowledge through meaningful filters.

Future changes should preserve and support these long-term capabilities:

- importing or saving useful study material such as PDFs, Word documents, links, images, diagrams, charts, notes, bibliography and references;
- reading and structuring material at multiple depths: overview, table of contents, chapter, heading, subheading, paragraph, concept, image, diagram, chart, bibliography and reference;
- classifying the same source through different perspectives, such as historical, scientific, theoretical, practical, philosophical, technical or methodological layers;
- converting knowledge into active learning through repetition, flashcards, quizzes, due reviews, self-testing and recall from memory;
- supporting cognitive functions such as attention, perception, comprehension, memory encoding, active recall, classification, comparison, visual learning, metacognition and application;
- retrieving information through filters such as source, book, chapter, section, concept, perspective, material type, difficulty, due status, review history, bibliography and reference.

Do not treat uploaded material as dead file storage. Do not optimise only for flashcard quantity if that weakens source structure, concept understanding, traceability, retrieval or long-term learning.

## Repository structure

- `src/app/` — application configuration, root component, and routing
- `src/data/` — optional built-in study units and flashcards
- `src/features/` — feature-oriented UI and domain logic
- `src/infrastructure/` — IndexedDB and backup/restore infrastructure
- `src/shared/` — shared components, types, and utilities
- `src/styles/` — global and feature-specific styles
- `public/` — PWA assets and CSV templates
- `tests/` — Vitest unit tests

Prefer keeping logic inside the relevant feature folder. Move code to `shared` only when it is genuinely reused by multiple features.

## Development commands

Run the following before completing a change:

```bash
npm install
npm run typecheck
npm test
npm run build
```

When a dependency is added, removed, or updated, generate and commit the appropriate lockfile. Avoid dependency changes unless they are necessary.

## Coding expectations

- Keep TypeScript strict and avoid `any` unless there is a documented, unavoidable boundary.
- Use named domain types from `src/shared/types/models.ts`.
- Prefer small, focused functions and feature-local modules.
- Preserve the existing feature-folder architecture.
- Use React function components and hooks.
- Do not mutate React state directly.
- Prevent duplicate asynchronous submissions with a lock or disabled state where needed.
- Handle IndexedDB failures and show a useful user-facing message.
- Do not silently discard or overwrite user data.
- Use transactions for multi-table or destructive database operations.
- Keep user-facing language clear and non-technical.
- Keep the primary interface in English unless the internationalisation approach is intentionally changed across the application.

## Data integrity rules

User data is the highest-risk area of this application.

Before changing imports, backups, migrations, deletion, or progress tracking:

1. Define whether the operation merges, replaces, or deletes data.
2. Validate all external data at runtime; TypeScript types are not runtime validation.
3. Check identifiers for uniqueness.
4. Check relationships such as flashcard `unitId` and progress `cardId`.
5. Use a database transaction when several writes must succeed together.
6. Provide confirmation before destructive replacement or deletion.
7. Preserve forward compatibility through explicit schema versions and migrations.
8. Add tests for malformed, duplicated, missing, and oversized input.

Do not change the IndexedDB database name or existing table schema without a Dexie migration plan.

## Privacy and security rules

- Keep the application local-first.
- Do not add analytics, advertising, tracking, remote storage, accounts, or telemetry without explicit project-owner approval.
- Do not send study content, PDF data, progress, or settings to an external service.
- Load third-party scripts only when necessary and, where appropriate, after clear user action or consent.
- Allow only explicitly supported URL protocols.
- Do not use `dangerouslySetInnerHTML` for user-controlled content.
- Validate uploaded files by content where practical, not only by filename or declared MIME type.
- Keep external links protected with `rel="noopener noreferrer"` when opened in a new tab.
- Never commit secrets, access tokens, private URLs, personal data, generated user backups, or local database exports.

## Accessibility requirements

All new and modified UI must remain usable with keyboard navigation and assistive technologies.

- Use semantic HTML before adding ARIA.
- Every input must have an accessible label.
- Interactive controls must be keyboard focusable.
- Do not hide required file inputs with `display: none` unless an equivalent keyboard-accessible control is provided.
- Preserve visible focus indicators.
- Provide accessible names for progress indicators and icon-only controls.
- Announce important asynchronous status changes using an appropriate live region.
- Check layouts at narrow widths and browser zoom up to at least 200%.

## Study-session and scheduling logic

Changes to flashcards, quizzes, review queues, scheduling, or statistics require special care.

- Keep a stable session definition; do not let a live database query unexpectedly skip or repeat items.
- Record the actual session start time separately from completion time.
- Define statistics consistently across flashcards, quizzes, and reviews.
- Prevent double answers and duplicate session records.
- Make scheduling functions deterministic in tests by accepting a supplied clock or random function.
- Add regression tests for queue changes caused by live IndexedDB updates.

## Backup and restore

Backup labels and behaviour must agree exactly.

- A progress-only backup must not silently replace content, links, or preferences.
- A complete backup must be clearly labelled as containing all supported application data.
- Validate schema version, timestamps, number ranges, uniqueness, and supported setting keys.
- Show a summary before replacing current data.
- Never include local PDFs unless the UI and schema explicitly state that they are included.

## PWA and deployment

- The Vite base path is currently `/` because deployment is intended for a custom-domain root.
- Do not change the base path without checking the actual deployment target.
- Preserve offline behaviour when changing routes, assets, or service-worker settings.
- Treat service-worker update behaviour as user-visible application behaviour.
- Avoid build-time values that unnecessarily prevent reproducible builds.

## Testing expectations

Every bug fix should include a regression test where practical.

Prioritise tests for:

- spaced-repetition scheduling and queue behaviour
- quiz option generation and duplicate-submission prevention
- CSV parsing, headers, quoting, limits, and identifier collisions
- backup validation and transactional restore
- IndexedDB failure paths and migrations
- data deletion and orphan cleanup
- keyboard accessibility of forms and upload controls
- PWA offline and update behaviour

Tests should be deterministic. Inject time and randomness rather than depending on the real clock or `Math.random()` directly.

## Change discipline

- Keep changes narrowly scoped.
- Do not perform unrelated refactoring in the same change.
- Do not change legal text, copyright ownership, licensing, privacy claims, or product branding without explicit owner approval.
- Update the README when setup, commands, data behaviour, deployment, or user-visible workflows change.
- Explain data migrations and destructive behaviour clearly in the pull-request description.
- Prefer a branch and pull request over direct changes to `main`.

## Completion checklist

Before presenting work as complete, confirm that:

- TypeScript passes.
- Tests pass.
- The production build succeeds.
- New behaviour has appropriate tests.
- No user data can be silently lost or overwritten.
- Keyboard access still works.
- Privacy claims still match actual network behaviour.
- PWA/offline behaviour is not unintentionally broken.
- Documentation is updated where required.
- No secrets, generated data, or personal files are included.
