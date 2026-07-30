# Architecture

_Last updated: 2026-07-30_

## Summary

StudyApp is a local-first single-page application for organising, reading,
practising, and reviewing user-provided study material. The core study workflow
runs in the browser and requires no account, cloud storage, cloud sync,
analytics, advertising, or telemetry.

The current `main` branch also contains:

- an **AI Assistant preview** that uses mock results and locally stored test
  credits; and
- a **Markellos Cloud Core readiness client** used to display whether future AI
  services appear available.

The readiness check is the only current first-party remote-service interaction.
It does not send study material and does not provide production AI, billing,
accounts, storage, or sync. See
[`docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md`](docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md).

## Technology stack

- React 19 and TypeScript;
- Vite and React Router hash routing;
- Dexie over IndexedDB;
- PDF.js and `pdf-lib`;
- Vitest;
- `vite-plugin-pwa`.

## Runtime layers

### Browser application

The browser application owns the current product state and all released study
features. IndexedDB contains:

- `cardProgress` — spaced-repetition state;
- `studySessions` — completed study and quiz session records;
- `settings` — appearance, imported content, and saved links;
- `studyFiles` — uploaded and generated local file metadata and blobs.

The current JSON backup covers progress, sessions, and supported settings. It
does not contain `studyFiles` blobs.

The mock AI wallet uses browser storage and is demonstration data only. It is
not part of a production financial ledger and must never become authoritative
for real credits.

### Markellos Cloud Core readiness boundary

`src/infrastructure/cloud-core/` contains the external-service readiness client
and shared connection-state logic.

The configured base URL comes from `VITE_CLOUD_CORE_URL`. This value is public
frontend configuration, not a secret. Outside local development it must use
HTTPS.

The current request is:

```text
GET {VITE_CLOUD_CORE_URL}/api/v1/health/ready
Accept: application/json
```

The response is validated at runtime. The client supports timeout, offline, and
invalid-response states. The request must not include study content, files,
progress, links, settings, backups, wallet data, or personal account data.

Service readiness means only that the remote service answered its health check.
It is not proof that an AI task, payment, credit ledger, or future authenticated
operation succeeded.

### Future production AI boundary

Production AI is not implemented. Its intended boundary is:

```text
User-selected material
        ↓
Review scope and maximum estimated cost
        ↓
Explicit user confirmation
        ↓
Authenticated, validated Cloud Core request
        ↓
Validated draft result
        ↓
User review and optional local save
```

Any production implementation must use separate validated schemas and explicit
failure semantics for task submission, task status, result delivery, credit
reservation, settlement, release, and refund. No provider secret may be placed
in the browser bundle.

## Routing

The app uses hash routing so static hosting needs no server-side route handling.

- `/` — Home;
- `/library` — Library from Source;
- `/study/theory` — Structured Study;
- `/learn` — Learn & Practice;
- `/flashcards`, `/review`, `/quiz`, `/progress` — practice flows;
- `/import` — chapter and flashcard CSV import;
- `/tools` — Split PDF Tool;
- `/appearance` — local appearance settings;
- `/ai-assistant-guide` — AI Assistant preview guide;
- `/legal/*` — legal information.

`/study-materials` is a legacy compatibility route that redirects to
`/library`. It is not a navigation area. The `src/features/study-materials/`
folder remains the feature-local home of shared file/link and PDF-splitting
logic; its name does not imply a standalone page.

The AI Assistant is presented as a supporting overlay and guide, not as a new
material repository or navigation replacement.

## Product areas

### Library from Source

Adds, classifies, opens, and removes original source files and links. Source
material is read here.

### Structured Study

Adds, classifies, opens, and removes material by structure and level. Generated
split-PDF extracts are read and placed here.

### Learn & Practice

Supports flashcards, stable due-review sessions, quizzes, CSV import, and
progress.

### Split PDF Tool

Accepts direct PDF input and splits it locally. Generated chunks are saved as
local study files with `fileSource: "split-pdf"` and a `sourceFileId` where
available. They remain in IndexedDB until removed and can be downloaded
individually from Structured Study or from the latest split result. A
multi-output result can start separate downloads for that latest successful
split only.

`splitPdfDownloads.ts` owns output filenames, exact split-record selection,
stored-PDF revalidation, Blob download triggering, latest-batch replacement,
and object-URL revocation. It introduces no server or ZIP dependency.

### AI Assistant preview

The assistant preview supports five mock task types:

- ask a question;
- create flashcards;
- create a quiz;
- summarise;
- explain a concept.

The preview models source selection, availability state, cost review,
confirmation, processing, result review, and test-wallet activity. Current
results are static samples; current test-credit spending is local UI state.

The service-status layer may disable mock task execution when Cloud Core appears
unavailable. This is a presentation and workflow preview, not a production task
queue.

## Data-flow boundaries

### Local file flow

```text
User file → runtime validation → IndexedDB blob → safe open or download
```

The local-file allowlist is applied when saving and opening. Active web or
executable content is rejected.

### Backup flow

```text
IndexedDB supported records → validated JSON export
Validated JSON import → preview → explicit confirmation → transaction
```

Uploaded and generated file blobs are excluded from the JSON backup.

### Current readiness flow

```text
Browser → Cloud Core health endpoint → validated service status
```

No study payload is present.

### Future AI flow

```text
User-selected content → review and confirmation → Cloud Core → draft result
Draft result → user review → optional validated local persistence
```

The future flow must never begin from an automatic library scan or save a result
without explicit user choice.

## Safety boundaries

- External input and remote responses are validated at runtime.
- Local-file save and open flows share one explicit allowlist.
- Active web/executable content is rejected and non-renderable supported files
  download instead of opening in the app origin.
- Restore validates the entire backup before one transactional replacement.
- Imported flashcard IDs derive from normalised stable content rather than CSV
  row position.
- Destructive file operations require an intentional user choice.
- PWA updates wait for the user's explicit **Update now** action.
- Shared visible storage notices keep local-only and non-backup boundaries
  consistent.
- The readiness request contains no study data.
- Production remote tasks require explicit material selection and confirmation.
- Generated content remains a draft until the user chooses to save it.
- Real credit balances and ledgers must be server-authoritative and idempotent.

## High-risk areas

- IndexedDB schema changes and migrations;
- backup/restore and local-file export;
- browser storage quota and large PDF processing;
- source/split-PDF relationships;
- study-session lifecycle and persistence failures;
- PWA service-worker updates;
- network timeout, retry, race, and stale-status behaviour;
- prompt injection and untrusted study documents;
- AI output validation before creating local records;
- authentication and authorisation for future remote features;
- credit reservation, settlement, release, refunds, and duplicate charging;
- legal and privacy alignment when study content leaves the browser.

## Testing strategy

Focused unit and IndexedDB integration tests cover scheduling, review queues,
quiz locks, CSV parsing and identity, local-file policy, backup validation and
transaction rollback, local-file relationships, and PWA update state.

Current Cloud Core tests cover URL normalisation, HTTPS requirements, readiness
request construction, runtime response validation, and failure presentation.

Production AI work must add tests for:

- exact payload selection and redaction;
- confirmation and cancellation;
- request deduplication and idempotency;
- timeout, retry, offline, and stale-result handling;
- prompt-injection and malformed-output handling;
- review-before-save behaviour;
- billing reservation, settlement, release, and refund semantics;
- browser-level accessibility and end-to-end flows.

Broader browser/E2E, accessibility, large-PDF stress coverage, and production AI
integration remain tracked in [`V1_1_BACKLOG.md`](V1_1_BACKLOG.md).
