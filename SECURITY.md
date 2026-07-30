# Security Policy

_Last updated: 2026-07-30_

## Supported model

StudyApp is a local-first browser application for using and studying
user-provided content. Core study data is stored in the current browser. The
application currently has no user account, cloud storage, cloud sync,
first-party analytics, advertising, or telemetry. It is not a permanent-storage,
archive, or backup service.

The current `main` branch includes an AI Assistant preview and a Markellos Cloud
Core readiness check. The assistant uses mock results and test credits. The
readiness request reports operational availability only and must not send study
content or other user study data.

A future production AI Assistant may process deliberately selected material
remotely, but that capability is not implemented and requires the controls in
[`docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md`](docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md).

## Security and privacy boundaries

- Keep core study data local by default.
- Do not send study material, local files, progress, links, settings, backups,
  or personal data to an external service unless an approved feature states the
  exact behaviour and the user explicitly confirms it.
- Do not add analytics, telemetry, advertising, tracking, accounts, remote
  storage, or cloud sync without explicit project-owner approval.
- Do not commit secrets, tokens, generated user backups, local database exports,
  private URLs, payment credentials, or personal user material.
- Keep external links protected with `rel="noopener noreferrer"` when opened in
  a new tab.
- Support only explicitly allowed URL protocols for user-saved links.
- Avoid rendering user-controlled or model-generated HTML.
- Treat all imported files, remote responses, and generated content as
  untrusted input.

## Current Cloud Core readiness check

The browser may request:

```text
GET {VITE_CLOUD_CORE_URL}/api/v1/health/ready
Accept: application/json
```

Security requirements:

- require HTTPS outside local development;
- treat `VITE_CLOUD_CORE_URL` as public configuration, never as a secret;
- use a bounded timeout;
- validate the complete JSON response at runtime;
- show offline, timeout, invalid-response, and unavailable states safely;
- send no study content, file data, progress, links, settings, backups, wallet
  data, or personal account data;
- do not expose internal diagnostics, credentials, database connection strings,
  stack traces, or sensitive infrastructure details in the health response;
- do not treat a successful health response as authorisation or proof that a
  separate operation succeeded.

## AI Assistant preview

The current assistant is mock-only. It must remain clear that:

- no real AI request is performed;
- sample results are not based on the user's material;
- test credits are not money or a financial record;
- no real purchase or charge occurs;
- no generated result is trusted or saved automatically.

A preview action must not be changed into a real remote action without an
explicitly scoped security and privacy review.

## Production AI security gate

Before any study content is sent remotely, the implementation must define and
test:

### User control and data minimisation

- exact task selection;
- exact text, document segment, chapter, or pasted content selected;
- a review screen showing what will be sent;
- explicit user confirmation;
- cancellation before submission where practical;
- no automatic library, database, current-document, or folder scan;
- no hidden cloud sync or remote backup.

### Authentication and authorisation

- authenticated requests where required;
- least-privilege access controls;
- protection against cross-user data access;
- token expiry, rotation, revocation, and secure recovery;
- no privileged provider credentials in the browser bundle.

### Request and document safety

- strict request-size, content-type, and file-type limits;
- safe document extraction and parser isolation;
- prompt-injection and malicious-document threat modelling;
- separation between user instructions, source content, and system policy;
- rate limits, concurrency limits, abuse controls, and cost ceilings;
- idempotency for retried task submissions.

### Response and persistence safety

- separate runtime schemas for answers, summaries, explanations, flashcards,
  quizzes, usage, and billing responses;
- maximum lengths and item counts;
- rejection or safe fallback for malformed output;
- no execution of model-produced code, HTML, URLs, or instructions;
- review and edit state before local persistence;
- transactional creation of related local records;
- traceability to the source material used;
- clear uncertainty and error presentation.

### Retention and logging

- documented provider and first-party retention periods;
- deletion and incident-response procedures;
- logs that exclude study content and secrets by default;
- redaction of tokens, payment data, and personal content;
- access controls and auditability for operational logs;
- explicit legal and privacy wording for any retained data.

## Credits and payments

The current test wallet is not a production ledger. Before real credits or
payments are introduced:

- balances and transaction history must be server-authoritative;
- purchase, reservation, settlement, release, refund, and reconciliation must
  be idempotent;
- client-provided prices, balances, or charge amounts must not be trusted;
- the maximum estimated cost must be shown before confirmation;
- failed, timed-out, cancelled, and partially completed tasks must have explicit
  no-charge or settlement rules;
- duplicate charging, replay, negative balances, race conditions, and wallet
  tampering must be tested;
- payment-provider webhooks must be authenticated and replay-safe;
- receipts, taxes, refunds, disputes, account recovery, and device transfer must
  be defined;
- payment and AI-provider secrets must remain server-side.

## Local file handling

Local files are stored in the browser's IndexedDB. Treat these files as private
user data. They remain there until removed, but browser storage can be cleared,
lost, or made unavailable. User-facing flows must tell users to retain original
files outside StudyApp.

All save and open flows must use
`src/features/study-materials/localFilePolicy.ts`. The allowlist is PDF,
DOC/DOCX, TXT/Markdown, CSV, PNG, JPEG, WebP, and GIF. HTML/XHTML, SVG, XML,
JavaScript, executables, unsupported types, and significant
extension/MIME/content mismatches are rejected. Revalidate legacy stored blobs
before opening them. Open only safe renderable types in a new tab and download
supported non-renderable formats.

Changes touching local files should consider:

- file-size limits;
- browser storage quota;
- content validation;
- duplicate detection;
- backup/export expectations;
- deletion confirmation;
- relationships between source files and split PDFs;
- whether any extraction is local or remote;
- whether the user can inspect and reduce content before a remote AI request.

Generated split PDFs may be downloaded through the dedicated split-PDF download
helper. The helper revalidates the stored PDF, uses a sanitised filename and a
Blob URL, triggers the browser download, and revokes the URL on the next event
loop turn. Batch download must use only the outputs from the latest successful
split and must not silently include older records.

## Backup and restore

- Validate the full backup before replacement.
- Preview the effect and require explicit confirmation.
- Use one transaction for replacement.
- Do not imply that Cloud Core or AI processing provides backup or sync.
- Do not include local file blobs unless the schema and interface explicitly
  state that they are included.
- Never upload a backup to a remote service as an implementation shortcut.

## PWA updates

Do not reload an active page merely because a new service worker is waiting.
Keep the update prompt user-controlled so unfinished input, an active study
interaction, or an AI confirmation screen is not discarded.

## Reviewed release-hardening scope

The historical v1 release-hardening review covered local-only intended-use
wording, split-PDF download behaviour, backup boundaries, and the existing
upload, open, delete, split, import, and PWA-update flows. It did not review a
production AI, payment, account, or cloud-storage system.

Use this wording only for the historical personal-use scope:

> No known release-blocking security issues were found within the reviewed
> personal-use scope.

## Reporting issues

Report security or privacy concerns through a private channel to the repository
owner. Do not open public issues containing private data, credentials,
exploitable details, payment information, or provider configuration.

## Dependency maintenance

Dependencies should be updated in small PRs with the lockfile committed. Run:

```bash
npm ci
npm run typecheck
npm test
npm run build
```

Production AI, authentication, payment, parsing, or cryptography dependencies
require a focused threat and maintenance review before adoption.
