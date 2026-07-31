# AGENTS.md

## Purpose

Guidance for coding agents and automated contributors working in this repository.
The project is source-visible but proprietary. Read `LICENSE` before making
changes.

## Required reading

Before product, architecture, data, security, privacy, AI, billing or UX work,
read:

1. `VISION.md`;
2. `ARCHITECTURE.md`;
3. `SECURITY.md`;
4. `docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md` for AI, MCP, Cloud Core, credits or payments.

## Product overview

StudyApp is a bilingual English/Greek, local-first learning application built
with React, TypeScript, Vite, React Router, Dexie, PDF.js, `pdf-lib`, Vitest and
`vite-plugin-pwa`.

Core study data remains in the browser. The current product has no user account,
cloud storage, cloud sync, first-party analytics, advertising or telemetry.

## AI Assistant terminology

Use these names consistently:

- **ChatGPT Companion** — available external-link handoff;
- **ChatGPT App / MCP** — coming soon and inactive;
- **StudyApp AI** — coming soon and inactive paid/API mode;
- **StudyApp credits** — future server-authoritative credits, not active yet.

Do not describe ChatGPT App/MCP, StudyApp AI, purchases or real charges as
operational.

## Current AI invariants

### ChatGPT Companion

- renders only the approved dedicated ChatGPT destination as a normal external link;
- does not call the OpenAI API;
- does not read, copy or send study material;
- does not read IndexedDB or the library;
- does not use the clipboard or scripted popup positioning;
- does not use StudyApp credits;
- may open ChatGPT in a separate tab through a user-activated link;
- must not automate or scrape the ChatGPT website.

### ChatGPT App / MCP

Do not activate until the MCP server, permissions, authentication, privacy and
security review are complete. Introduce read-only tools before write actions.

### StudyApp AI

Do not activate until the Cloud Core task contract, server-side API key,
authentication, response validation, real credit ledger, payments and legal gates
are complete.

## User-facing language

The interface supports English and Greek.

- New primary UI must include both languages.
- Keep wording brief, clear and non-technical.
- Use **Available / Διαθέσιμο**, **Coming soon / Σύντομα**, and **No charges yet /
  Δεν γίνεται χρέωση ακόμη** consistently.
- Do not place engineering or billing design details in the primary user flow.
- The selected language is local device preference, not account data.

## UX boundaries

```text
Library             = source material
Structured Study    = material by structure and level
Learn & Practice    = flashcards, review, quiz and progress
Split PDF Tool      = local PDF utility
AI Assistant        = Companion now; MCP and paid API later
```

The AI Assistant is a supporting workflow, not a material store or replacement
for the main study areas.

## Repository structure

- `src/app/` — configuration and routing;
- `src/data/` — optional built-in study content;
- `src/features/` — feature UI and domain logic;
- `src/i18n/` — language state and shared translated labels;
- `src/infrastructure/` — IndexedDB, backup and remote-service clients;
- `src/shared/` — shared components, types and utilities;
- `src/styles/` — global and feature styles;
- `public/` — PWA assets and CSV templates;
- `tests/` — Vitest tests;
- `docs/` — design and architecture documents.

Keep logic feature-local unless it is genuinely shared. Keep provider transport
behind infrastructure or server boundaries.

## Development gate

```bash
npm ci
npm run typecheck
npm test
npm run build
```

Commit the lockfile when dependencies change. Avoid unnecessary dependencies.

## Coding expectations

- Keep TypeScript strict and avoid `any`.
- Use named domain types where applicable.
- Prefer small focused functions and React function components.
- Do not mutate React state directly.
- Prevent duplicate asynchronous submissions.
- Handle IndexedDB and network failures with short useful messages.
- Do not silently discard, overwrite, upload or save user data.
- Use transactions for related or destructive writes.
- Validate external input and responses at runtime.
- Preserve keyboard access and visible focus.

## Data integrity

Before changing imports, backups, migrations, deletion, generated-content save or
progress tracking:

1. define whether the operation creates, merges, replaces or deletes;
2. validate all external data;
3. check identifiers and relationships;
4. use transactions where several writes must succeed together;
5. confirm destructive actions;
6. preserve schema compatibility through migrations;
7. test malformed, duplicated, oversized and interrupted input;
8. keep generated AI output in review until explicitly saved.

Do not change the IndexedDB name or schema without a migration plan.

## Privacy and security

- Keep the core application local-first.
- Never scan the library automatically for remote use.
- Do not send study data remotely without an approved, explicit and confirmed feature.
- Send only the minimum required content.
- Do not add analytics, tracking, accounts, remote storage or sync without owner approval.
- Never render user-controlled or model-generated HTML.
- Keep external links protected with `noopener noreferrer`.
- Never commit secrets, tokens, private URLs, backups, local database exports or payment credentials.
- Provider API keys and payment secrets must remain server-side.
- Vite environment variables are public configuration, not secret storage.

## Remote AI gate

Before any remote AI activation, define and test:

- request and response schemas;
- exact selected content and metadata;
- confirmation and cancellation;
- timeout, retry and duplicate-submission behaviour;
- prompt-injection and untrusted-document handling;
- output limits and validation;
- retention, deletion, logging and redaction;
- rate and cost limits;
- privacy, legal and bilingual user wording.

A service health check is not proof that an AI task or payment succeeded.

## Credits and payments

Real credits are not active. Before activation:

- balances and ledgers must be server-authoritative;
- purchase, reservation, settlement, release and refund must be idempotent;
- maximum estimated cost must be shown before confirmation;
- duplicate charges, replay, negative balances and client tampering must be prevented;
- failed, cancelled and timed-out task rules must be explicit;
- receipts, taxes, refunds, disputes and recovery must be defined.

Never reintroduce a browser-local wallet as a real financial record.

## Local files and PDF processing

- Use the central file allowlist for save and open flows.
- Reject executable or active web content.
- Revalidate stored blobs before opening or downloading.
- Respect file-size and browser-storage limits.
- Preserve source/split-PDF relationships.
- Keep PDF splitting local unless a separately approved remote extraction feature is introduced.

## Backup and restore

- Validate the complete backup before replacement.
- Show a preview and require confirmation.
- Use one transaction for replacement.
- Keep local file blobs excluded unless the UI and schema explicitly say otherwise.
- Do not imply that AI or Cloud Core provides backup or sync.

## Study sessions

- Record actual start and completion separately.
- Prevent duplicate answers and session records.
- Advance UI only after required persistence succeeds.
- Keep scheduling deterministic in tests.

## Accessibility

- Use semantic HTML before ARIA.
- Label every input.
- Keep all controls keyboard accessible.
- Restore and manage focus for dialogs.
- Announce important asynchronous changes.
- Test narrow layouts and 200% zoom.
- Never communicate availability or payment state by colour alone.

## Documentation

Historical v1 release files may retain their original scope. Living documents
must describe current behaviour and distinguish available, coming-soon and future
paid capabilities.

Update README, architecture, security, privacy and AI boundary documentation in
the same PR as any user-visible AI, language, remote-data or billing change.
