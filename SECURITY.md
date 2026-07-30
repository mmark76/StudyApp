# Security Policy

_Last updated: 2026-07-30_

## Current security model

StudyApp is a bilingual, local-first browser application. Core study content,
files, links, progress, sessions and settings remain in the current browser.

The AI Assistant has three modes:

- ChatGPT Companion — active local prompt handoff to the dedicated StudyApp AI Assistant Custom GPT;
- ChatGPT App / MCP — inactive and marked Coming soon;
- StudyApp AI — inactive and marked Coming soon.

No real AI request, credit purchase or charge is currently enabled.

## General boundaries

- Keep core study data local by default.
- Do not upload study material without explicit selection and confirmation.
- Do not add analytics, tracking, accounts, storage or sync without owner approval.
- Treat files, imported data, remote responses and generated content as untrusted.
- Do not render user-controlled or model-generated HTML.
- Allow only approved URL protocols.
- Keep external links protected with `noopener noreferrer`.
- Never commit secrets, tokens, private URLs, backups, database exports or payment credentials.
- Provider and payment secrets must remain server-side.
- Vite environment variables are public configuration and must not contain secrets.

## ChatGPT Companion

The Companion may:

- use text pasted or explicitly imported by the user;
- prepare a prompt locally;
- copy the prompt to the clipboard;
- open the dedicated StudyApp AI Assistant Custom GPT in a separate browser popup.

The Companion must not:

- call the OpenAI API;
- read the StudyApp library or IndexedDB automatically;
- send content automatically;
- automate, scrape, embed or inspect the ChatGPT website;
- read the user's ChatGPT session or response;
- use or simulate a real StudyApp balance.

The Custom GPT URL is public configuration through
`VITE_STUDYAPP_AI_ASSISTANT_URL`. It must be an approved HTTPS ChatGPT share URL
and must not contain credentials, tokens or private query data. Runtime
validation rejects other protocols, hostnames, embedded credentials and custom
ports before `window.open` is called.

Clipboard and popup failures must be handled with short user-facing messages.
Their outcomes remain independent: neither clipboard success nor popup success
may imply the other. The prepared prompt remains visible for manual copying, and
blocked or invalid popup destinations retain a safe fallback link. The user
remains responsible for reviewing and pasting the prepared request into ChatGPT.

## ChatGPT App / MCP security gate

Before activation, define and test:

- authentication and authorisation;
- exact tool permissions;
- least-privilege read scopes;
- cross-user isolation;
- token expiry, rotation and revocation;
- confirmation for write actions;
- strict tool input and output schemas;
- rate and concurrency limits;
- prompt-injection and malicious-document handling;
- logging, retention and deletion;
- incident response.

Read-only tools should be introduced before tools that change StudyApp data.

## StudyApp AI security gate

The OpenAI API key is a server secret. It must never be exposed in the React
bundle, Vite client variables, logs or browser storage.

Before StudyApp AI activation, define and test:

### User control

- exact task selection;
- exact material selection;
- review of the content to be sent;
- explicit confirmation;
- cancellation before submission where practical;
- no automatic library scan;
- no hidden backup or sync.

### Request safety

- authentication and least privilege;
- request-size and content limits;
- prompt separation between policy, user instruction and source text;
- untrusted-document handling;
- idempotency and replay protection;
- rate, concurrency and spending limits.

### Response safety

- separate runtime schemas for answers, summaries, flashcards and quizzes;
- maximum lengths and item counts;
- rejection of malformed output;
- no execution of generated HTML, code, URLs or instructions;
- user review before local persistence;
- transactional creation of related local records;
- source traceability and uncertainty presentation.

### Logging and retention

- exclude study content and secrets from logs by default;
- redact tokens, payment data and personal content;
- document provider and first-party retention;
- provide deletion and incident-response procedures;
- restrict operational log access.

## Credits and payments

Real credits are inactive.

Before activation:

- balances and history must be server-authoritative;
- purchase, reservation, settlement, release and refund must be idempotent;
- client-provided prices or balances must not be trusted;
- maximum estimated cost must be shown before confirmation;
- failed, cancelled and timed-out tasks need explicit settlement rules;
- duplicate charging, replay, negative balances and race conditions must be tested;
- payment webhooks must be authenticated and replay-safe;
- receipts, taxes, refunds, disputes and recovery must be defined;
- payment and provider secrets must remain server-side.

## Language and consent

Security, privacy, availability and charging statements must communicate the same
facts in English and Greek. Translated copy should remain brief, but must not omit
a material warning or consent requirement.

## Local file handling

All file save and open flows must use the central local-file policy. Supported
formats are PDF, DOC/DOCX, TXT/Markdown, CSV, PNG, JPEG, WebP and GIF. Active web
content, executable content, unsupported formats and significant mismatches are
rejected.

Revalidate stored blobs before opening or downloading. Keep original-file and
browser-storage warnings visible.

## Backup and restore

- Validate the complete backup before replacement.
- Preview the effect and require confirmation.
- Use one transaction for replacement.
- Do not imply that AI or Cloud Core provides backup or sync.
- Do not include local file blobs unless the schema and interface say so.
- Never upload a backup as an AI implementation shortcut.

## Study progress integrity

- Card progress, session counters and idempotency records must be written in one
  IndexedDB transaction.
- Stable operation IDs must make retries safe after ambiguous client results.
- Completion UI must follow a committed result, never an optimistic counter.
- Failed writes must preserve the last committed progress and active session.

## PWA updates

Do not reload an active page automatically. Keep the update prompt under user
control so unfinished input or AI prompt preparation is not discarded.

## Dependency and verification gate

Run:

```bash
npm ci
npm run typecheck
npm test
npm run build
```

AI, authentication, payments, parsing and cryptography dependencies require a
focused security and maintenance review.

## Reporting

Report security or privacy concerns privately to the repository owner. Do not
open public issues containing credentials, private data, payment information or
exploitable details.
