# Complete Local-File Export Design

_Status: design only. Complete local-file export/import is not implemented in v1._

This document describes a future complete export/import feature for StudyApp. It does not describe current behavior. The current JSON backup remains progress/settings oriented and does not include local file blobs.

## Goals

The future complete export should let a user preserve and restore all local StudyApp data in a browser-only, local-first way. It should include progress, settings, imported content, cloud-link records, local file metadata, uploaded file blobs, source PDFs, uploaded documents/images, generated split PDFs, and `contentHash` values.

The feature must not require an account, backend, telemetry, remote storage, or external processing of study content.

## Data Classes

A complete export must include these data classes:

- `cardProgress`: card progress, due dates, ratings, repetitions, intervals, lapses and last-reviewed timestamps.
- `studySessions`: flashcard, review and quiz session records.
- `settings`: app settings, appearance settings, settings-backed imported content and settings-backed saved cloud-link records.
- imported study content: imported units and flashcards stored through settings.
- cloud-link records: link title, material type and URL only. The external cloud file itself is not copied.
- local file metadata: every `LocalStudyFile` field except `data`, including `id`, `title`, `fileName`, `size`, `createdAt`, `mimeType`, `fileKind`, `fileSource`, `materialType`, `sourceFileId`, `pageRangeLabel` and `contentHash`.
- local file blobs: the actual bytes stored in IndexedDB for uploaded source PDFs, Word documents, text files, CSVs, images and other supported local files.
- generated split PDFs: metadata and blob bytes for split PDFs created by Split PDF Tool.
- content hashes: SHA-256 hashes for each local file blob where available; missing hashes should be computed during export when practical.

## Recommended Export Format

Use a single user-downloadable archive file, preferably a ZIP-compatible archive created fully in the browser.

Recommended file extension:

```text
studyapp-complete-export-YYYY-MM-DD.studyapp.zip
```

Recommended archive structure:

```text
manifest.json
data/cardProgress.json
data/studySessions.json
data/settings.json
data/studyFiles.json
files/<localFileId>/<safe-original-file-name>
checksums/sha256.json
```

`manifest.json` should be the authoritative index. Other JSON files may make validation and inspection easier, but restore should primarily trust the manifest after validation.

Example manifest shape:

```json
{
  "schemaVersion": 1,
  "exportType": "complete-local-file-export",
  "appName": "StudyApp",
  "createdAt": "2026-07-08T12:00:00.000Z",
  "format": {
    "archive": "zip",
    "hashAlgorithm": "SHA-256"
  },
  "counts": {
    "cardProgress": 0,
    "studySessions": 0,
    "settings": 0,
    "studyFiles": 0
  },
  "files": [
    {
      "id": "file_123",
      "path": "files/file_123/source.pdf",
      "title": "Source PDF",
      "fileName": "source.pdf",
      "size": 123456,
      "mimeType": "application/pdf",
      "fileKind": "pdf",
      "fileSource": "source-material",
      "materialType": "book",
      "sourceFileId": null,
      "pageRangeLabel": null,
      "contentHash": "hex-encoded-sha-256",
      "createdAt": "2026-07-08T12:00:00.000Z"
    }
  ]
}
```

Versioning rules:

- `schemaVersion` must be required and integer.
- New optional fields may be added in minor-compatible readers.
- Breaking layout changes require a new `schemaVersion`.
- Restore must reject unsupported versions with a clear message.

Blob storage rules:

- Store each file as raw bytes in `files/<localFileId>/`.
- Preserve original file extensions in safe filenames for human inspection.
- Do not base64-encode large blobs inside JSON unless ZIP/file APIs are unavailable; raw archive entries are smaller and easier to stream.
- Store each blob path and expected byte size in `manifest.json`.
- Store SHA-256 hashes in both file entries and `checksums/sha256.json` for easy integrity checks.

Archive library note:

- A browser-compatible ZIP library may be needed.
- The dependency should support Blob inputs/outputs and avoid loading unnecessary remote scripts.
- Large exports should prefer streaming or chunked generation where browser support allows.

## Export Flow

Recommended export steps:

1. Read `cardProgress`, `studySessions`, `settings` and `studyFiles` from IndexedDB.
2. For every local file, read the `Blob`, compute SHA-256 with Web Crypto when `contentHash` is missing or verification is requested, and add the blob to the archive.
3. Build a manifest with counts, total byte size, file metadata, hash algorithm and schema version.
4. Validate the archive before download by checking expected counts and generated manifest paths.
5. Offer the archive as a local browser download.

The UI should show an estimated export size before starting when practical. At minimum it should show the total stored local-file bytes from `studyFiles.size`.

## Restore Modes

The restore flow should offer explicit modes:

- `Preview only`: validate the archive and show what would be imported.
- `Merge`: add missing records and skip or resolve duplicates.
- `Replace all StudyApp data`: replace supported app data after clear confirmation.

Do not silently overwrite existing user data in any mode.

## Validation Before Restore

Restore must validate before writing:

- archive can be opened;
- `manifest.json` exists;
- `schemaVersion` is supported;
- `exportType` is `complete-local-file-export`;
- JSON data files are valid arrays/objects;
- record shapes match runtime validators;
- IDs are unique within each data class;
- `cardProgress.cardId` points to an exported or existing flashcard when applicable;
- imported flashcards point to valid units;
- split PDF `sourceFileId` points to an exported, existing or intentionally missing source file;
- each file path exists in the archive;
- each blob byte size matches the manifest;
- each blob SHA-256 matches `contentHash`;
- settings keys are supported or explicitly preserved as unknown forward-compatible settings;
- total restore size is within practical browser storage limits.

Invalid archives should fail before any data is written.

## Duplicate and Conflict Handling

Use `contentHash` as the primary duplicate key for local file blobs.

Recommended rules:

- If an imported local file has the same `contentHash` as an existing file, treat it as the same file content.
- If metadata differs for a same-hash file, preview the difference and let the user keep existing metadata, import as a separate record with a new ID, or update metadata if that is explicitly supported.
- If an imported file has no `contentHash`, compute one before deciding.
- If hashing fails, fall back to conservative behavior: do not assume duplicate by name/size alone without showing it as a possible match in the preview.
- For cloud links, match by normalized URL and link ID where available.
- For settings, show whether the import will merge, replace or skip each settings-backed data group.
- For progress, preserve `cardId` relationships. If the referenced flashcard is missing, mark that progress record as skipped in preview.

ID handling:

- In replace mode, preserve exported IDs to keep relationships intact.
- In merge mode, preserve IDs only when they do not conflict.
- When an ID conflicts but content differs, generate a new ID and rewrite dependent relationships in the imported data before writing.
- Relationship rewrites must be shown in preview and tested.

Generated split PDFs:

- If both a source file and its split PDFs are imported, preserve `sourceFileId`.
- If a split PDF is imported without its source file, keep it only after preview clearly marks it as an orphaned split PDF.
- If the matching source exists locally by `contentHash` but has a different ID, offer to relink `sourceFileId` to the local source during merge.

## Import Write Safety

The importer should separate validation from writing.

Recommended write approach:

1. Parse and validate the archive.
2. Build an import plan.
3. Show a preview with counts, total bytes, duplicates, conflicts, skipped records and storage estimate.
4. Require explicit confirmation.
5. Write data using Dexie transactions where possible.
6. Verify written counts and key relationships after commit.

For complete replace, clear and write supported tables in a transaction where browser/Dexie behavior allows. For large Blob writes, if one transaction is impractical, use a staged approach:

- write imported files under temporary import IDs or a temporary import marker;
- verify all blobs and metadata;
- commit metadata relationships;
- remove temporary records on failure where possible;
- report any cleanup that could not be completed.

Partial failure policy:

- Prefer all-or-nothing for metadata and progress/settings.
- For large blobs, do not report success unless every selected file was imported and verified.
- If the browser fails because of quota or interruption, show which stage failed and leave existing user data unchanged whenever possible.
- Never silently delete current data after a failed import.

## UX Requirements

Labels must distinguish the current progress/settings backup from the future complete export.

Recommended labels:

- Current feature: `Save progress and settings backup`.
- Future feature: `Export complete StudyApp archive`.
- Future restore: `Import complete StudyApp archive`.

Required copy points:

- The progress/settings backup does not include local file copies.
- The complete archive includes local file copies and may be large.
- Files remain local; no backend upload is involved.
- Keep original PDFs/files outside StudyApp as a separate safeguard.
- Browser storage limits may prevent very large imports.
- A preview will be shown before any import writes data.

Future export UI should show:

- number of local files;
- total file byte size;
- number of source files and generated split PDFs;
- whether any files lack `contentHash` and will be hashed during export;
- approximate archive size when possible.

Future import UI should show:

- archive version;
- exported date;
- counts by data class;
- total blob size;
- duplicate files by content hash;
- conflicts requiring a decision;
- missing/corrupt files;
- orphaned split PDFs;
- final action: merge, replace, or cancel.

## Technical Constraints

- Must run fully in the browser.
- Must remain local-first with no backend, account, analytics or telemetry.
- Must not send study content or files to external services.
- Must handle IndexedDB `Blob` values from `studyFiles`.
- Must use Web Crypto SHA-256 for content hashes where available.
- Must keep legacy records without `contentHash` readable.
- Must tolerate browser quota errors and memory pressure.
- Must avoid changing the existing Dexie database name.
- Schema/index changes are not required for the design, but any future implementation requiring indexed `contentHash` needs a Dexie migration plan.

## Testing Strategy

Unit tests:

- manifest validation accepts valid archives and rejects malformed versions;
- runtime validators reject bad record shapes;
- hash validation detects corrupt blobs;
- duplicate detection prefers `contentHash`;
- ID conflict planning preserves or rewrites relationships correctly;
- orphaned split PDF detection works;
- unsupported settings keys are handled according to policy;
- size/quota preflight logic reports practical warnings.

Integration tests:

- export with progress, settings, cloud links, source PDFs and split PDFs;
- import preview for a complete archive;
- merge import into an existing database with duplicate file hashes;
- replace import into an existing database after confirmation;
- corrupt/missing blob import fails before writes;
- quota-like write failure does not silently clear existing data;
- split PDFs preserve or intentionally relink `sourceFileId`.

Manual checklist:

- export from an empty app;
- export with one source PDF and several split PDFs;
- export with uploaded documents, images and text files;
- import into a fresh browser profile;
- import into a profile that already has overlapping files;
- cancel from preview and confirm no writes happen;
- interrupt or fail a large import and confirm existing data remains understandable;
- verify files open after restore;
- verify review progress and quiz/session history remain intact;
- verify no network requests are made during export/import.

## Rollout Plan

Phase 1: design and validation helpers.

- Define manifest types and runtime validators.
- Add import plan generation without writing data.
- Add tests for malformed archives and conflict planning.

Phase 2: export archive.

- Add browser ZIP/archive dependency if approved.
- Generate manifest, JSON data files and blob entries.
- Compute or reuse `contentHash`.
- Add export size preview.

Phase 3: import preview.

- Parse archive locally.
- Validate data, hashes and relationships.
- Show merge/replace preview with conflicts and duplicates.

Phase 4: safe import writes.

- Implement merge mode first.
- Add replace mode only with explicit confirmation.
- Use transactions or staged writes for large blobs.
- Add post-import verification and clear reporting.

Phase 5: polish and resilience.

- Add progress indicators for hashing, archive generation and import.
- Improve quota warnings.
- Add manual QA checklist to release notes.

## Risks

- Large Blob archives may exceed browser memory or storage limits.
- ZIP generation may require an added dependency.
- Browser support for streaming archive writes varies.
- IndexedDB transactions with many large Blobs may be slow or fragile.
- Relationship rewrites in merge mode can be complex.
- Users may misunderstand progress/settings backup versus complete archive unless labels stay strict.

## Non-Goals

- No backend sync.
- No cloud storage integration.
- No automatic upload of study files.
- No encrypted archive format in the first design unless separately specified.
- No implementation in this documentation task.
