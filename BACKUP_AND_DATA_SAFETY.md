# Backup and Data Safety

_Last updated: 2026-07-31_

## Local-first principle

StudyApp stores user-created or user-imported study content, progress,
settings, saved external links, and local files in the current browser. The
app has no backend, server upload, account system, or cloud storage. It does
not generate chapters, flashcards, quizzes, or other study content
automatically.

This protects ownership and privacy, but it also means browser storage is
important user data whose capacity and availability depend on the browser and
device. StudyApp is not permanent storage, an archive, or a complete file
backup.

## Current backup limitation

The current JSON backup is progress/settings oriented. It includes:

- card progress and review scheduling;
- study session records;
- app settings, including settings-backed imported content and saved cloud-link records.

It does not include local file blobs such as uploaded PDFs, Word documents, images, or generated split PDFs. Those files remain stored only in this browser on this device unless a future complete local-file export feature explicitly adds them.

Users should keep the original PDFs, import spreadsheets, and other files
outside StudyApp as their primary copies. Generated split PDFs can be
downloaded individually; **Download all** is limited to the outputs from the
latest successful split.

This is the current v1 behavior. A future complete local-file export/import feature is designed, but it is not implemented yet.

## Current restore safety

StudyApp validates the complete progress/settings backup before changing browser
data. Restore accepts schema version 1 backups up to 10 MB and checks record
shapes, supported values, dates, non-negative number ranges, unique IDs,
supported settings and relationships between chapters, flashcards and progress.

After validation, StudyApp shows the backup creation date and counts for
progress, sessions and included settings. Existing data is replaced only after
the user explicitly confirms the preview. Progress, sessions and settings are
then restored in one IndexedDB transaction. A validation or write failure keeps
the existing data unchanged. Local file blobs are neither imported nor changed.

## What can be lost

Local browser data may be lost if:

- the user clears site data;
- the browser profile is removed or the browser fails;
- the device is replaced or fails;
- the browser storage quota is exceeded or cleaned;
- the user uses a different browser or device without export/import support.
- the application is removed or browser/local storage becomes unavailable.

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

Generated split PDFs remain local file blobs until removed. Their Download
actions create copies outside StudyApp; downloading does not remove the
IndexedDB record or change its relationship to the source PDF.

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

## Future broader restore requirements

A future complete local-file archive restore should additionally:

- validate its archive schema version;
- validate record shapes at runtime;
- check uniqueness of IDs;
- check relationships such as flashcard `unitId`, progress `cardId`, and split PDF `sourceFileId`;
- show a summary before replacing or merging data;
- use transactions for multi-table writes;
- avoid partial restore where possible;
- clearly report skipped or invalid records;
- verify file integrity and split-PDF relationships before writing blobs.

## User-facing warning to preserve

Until complete local-file export exists, English user-facing copy should
preserve this meaning:

> StudyApp stores data locally in this browser and device. Data can be lost if site data is cleared or the browser or device fails. StudyApp is not permanent storage or a complete backup service. Keep original files and required copies outside StudyApp. The JSON backup does not include uploaded or generated file copies, and available storage depends on the browser and device.

Greek user-facing copy must communicate the same material facts:

> Το StudyApp αποθηκεύει δεδομένα τοπικά σε αυτόν τον browser και τη συσκευή. Τα δεδομένα μπορεί να χαθούν αν διαγραφούν τα δεδομένα ιστοτόπου ή αν παρουσιαστεί βλάβη στον browser ή στη συσκευή. Το StudyApp δεν είναι υπηρεσία μόνιμης αποθήκευσης ούτε πλήρης υπηρεσία backup. Κράτησε τα πρωτότυπα αρχεία και τα απαραίτητα αντίγραφα εκτός StudyApp. Το JSON backup δεν περιλαμβάνει αρχεία που προστέθηκαν ή δημιουργήθηκαν και ο διαθέσιμος χώρος εξαρτάται από τον browser και τη συσκευή.
