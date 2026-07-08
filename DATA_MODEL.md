# Data Model

_Last updated: 2026-07-08_

This document explains the current persisted data model and the safety rules around it.

## Storage layer

StudyApp uses Dexie over IndexedDB. The database name is currently `generic-study-app`.

Current tables:

- `cardProgress`
- `studySessions`
- `settings`
- `studyFiles`

Do not rename the database or change table schemas without a migration plan.

## Core records

### StudyUnit

A study unit represents a chapter or learning unit.

Important fields:

- `id`
- `number`
- `title`
- `objectives`
- `summary`
- `keyTerms`

Imported units can override or extend built-in units by ID.

### Flashcard

A flashcard belongs to a unit.

Important fields:

- `id`
- `unitId`
- `number`
- `question`
- `answer`
- `tags`

When importing flashcards, validate that `unitId` or the referenced unit number exists.

### CardProgress

A progress record is keyed by `cardId`.

Important fields:

- `cardId`
- `score`
- `repetitions`
- `intervalDays`
- `nextReviewAt`
- `lastReviewedAt`
- `lapses`

Review logic must avoid skipping or repeating cards because of live query updates.

### StudySession

A study session records a completed learning activity.

Important fields:

- `id`
- `mode`
- `startedAt`
- `completedAt`
- `reviewedCards`
- `correctAnswers`

Avoid duplicate session records from rapid repeated UI actions.

### AppSetting

Settings are generic key/value records.

Important fields:

- `key`
- `value`

Because `value` is unknown at runtime, every parser must validate data before using it.

### LocalStudyFile

A local study file represents an uploaded or generated local file stored in browser IndexedDB.

Important fields:

- `id`
- `title`
- `fileName`
- `size`
- `createdAt`
- `data`
- `mimeType`
- `fileKind`
- `fileSource`
- `materialType`
- `sourceFileId`
- `pageRangeLabel`

`data` is a `Blob`. This can be large and is not currently included in progress/settings backups.

`fileSource` separates original source material from generated split PDFs.

`sourceFileId` links a generated split PDF back to its original source file when available.

Future complete local-file export/import behavior is designed in [`docs/LOCAL_FILE_EXPORT_DESIGN.md`](docs/LOCAL_FILE_EXPORT_DESIGN.md). That design preserves local file metadata, Blob data, split PDF relationships and `contentHash` values where available.

## Material classification

Source material types:

- `book`
- `article`
- `paper`
- `outsource-note`
- `my-note`
- `summary`

Structured study types:

- `contents`
- `chapter`
- `section`
- `key-concept`
- `bibliography-reference`
- `image-diagram`

Do not silently guess a material type. Untyped records should remain unclassified until the user chooses a final placement.

## Relationship rules

- A `Flashcard.unitId` should point to an existing unit.
- A `CardProgress.cardId` should point to an existing flashcard, or be cleaned when the corresponding imported card is removed.
- A split PDF `sourceFileId` may point to an original source file.
- Source deletion must handle related split PDFs intentionally.

## Migration rules

When changing persisted data:

1. Add optional fields first where possible.
2. Keep legacy records readable.
3. Add runtime guards for unknown values.
4. Add Dexie migrations for required schema/index changes.
5. Add tests for old and new records.
6. Document backup/export impact.

## Future fields to consider

- `contentHash` for local files.
- `updatedAt` for user-edited records.
- `schemaVersion` for complex setting values.
- explicit backup/export metadata.
