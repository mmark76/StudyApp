# Backup and Data Safety

_Last updated: 2026-07-08_

## Local-first principle

StudyApp stores user-created study content, progress, settings, cloud links, and local files in the browser. The app has no backend and no account system by default.

This protects ownership and privacy, but it also means the browser storage is important user data.

## Current backup limitation

The current JSON backup is progress/settings oriented. It includes:

- card progress and review scheduling;
- study session records;
- app settings, including settings-backed imported content and saved cloud-link records.

It does not include local file blobs such as uploaded PDFs, Word documents, images, or generated split PDFs. Those files remain stored only in this browser on this device unless a future complete local-file export feature explicitly adds them.

Users should keep the original PDFs and files outside StudyApp as their primary file copies.

This is the current v1 behavior. A future complete local-file export/import feature is designed, but it is not implemented yet.

## What can be lost

Local browser data may be lost if:

- the user clears site data;
- the browser profile is removed;
- the device is replaced;
- the browser storage quota is exceeded or cleaned;
- the user uses a different browser or device without export/import support.

## Required wording rule

Any UI label or documentation about backup/export must state exactly what is included.

Do not call an export "complete" unless it includes every supported data class that the user expects, including local files where applicable.

## Current data classes

### Progress and sessions

Included in the current JSON backup. This covers card progress, review scheduling, study sessions, and quiz/session summaries where implemented.

### Settings

Included in the current JSON backup. This covers stored app settings, user-added study links, and imported content when those are saved in the settings table.

### Local files

Includes files stored in IndexedDB as `Blob` data, such as uploaded source PDFs, documents, images, and generated split PDFs.

These are not included in the current JSON backup. New local file records can store `contentHash` values for safer duplicate detection, but the file blobs themselves still remain only in this browser on this device. Keep original file copies outside StudyApp, especially before clearing browser data, changing browsers, or moving to another device.

### Cloud links

Cloud links store only title, type, and URL. The actual file remains in the user's external service.

## Future complete export requirements

A complete export feature should define:

- schema version;
- export creation timestamp;
- app build/version where useful;
- progress records;
- session records;
- settings records;
- imported units and flashcards;
- saved cloud links;
- local file metadata;
- local file binary data or a documented archive structure;
- hash/checksum values for integrity;
- restore behavior and conflict handling.

The working design for this future feature is in [`docs/LOCAL_FILE_EXPORT_DESIGN.md`](docs/LOCAL_FILE_EXPORT_DESIGN.md).

## Future restore requirements

A restore flow should:

- validate schema version;
- validate record shapes at runtime;
- check uniqueness of IDs;
- check relationships such as flashcard `unitId`, progress `cardId`, and split PDF `sourceFileId`;
- show a summary before replacing or merging data;
- use transactions for multi-table writes;
- avoid partial restore where possible;
- clearly report skipped or invalid records.

## User-facing warning to preserve

Until complete local-file export exists, user-facing copy should preserve this meaning:

> Progress backups do not include local file copies. Files saved in StudyApp remain in this browser on this device. Export or keep your original files separately before clearing browser data or changing device.
