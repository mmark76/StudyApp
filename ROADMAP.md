# StudyApp Roadmap

_Last updated: 2026-07-28_

## v1.0.0 — Complete

The v1 roadmap ends at the release gate. Completed work includes:

1. stable review queues, quiz answer locking, and CSV header validation;
2. intentional direct source/split-PDF deletion choices and content hashing;
3. a central safe local-file policy;
4. strict previewed transactional backup restore;
5. stable content-based flashcard import IDs;
6. user-controlled PWA updates;
7. final navigation/documentation alignment and release verification.

The v1 scope remains local-first, browser-only, offline-ready, and without
accounts, a backend, analytics, telemetry, or cloud sync.

## v1.0.0 release-hardening follow-up

A focused post-gate PR adds explicit local-storage/non-backup notices and
download actions for generated split PDFs. It does not add content generation,
cloud storage, authentication, backend services, or a new data model.

## Stopping point

No additional feature or hardening work belongs in the v1 release-gate PR.
Remaining non-blocking work has moved to
[`V1_1_BACKLOG.md`](V1_1_BACKLOG.md).

Future work should select one focused backlog item per branch/PR and preserve
the data-safety and UX boundaries in [`AGENTS.md`](AGENTS.md).
