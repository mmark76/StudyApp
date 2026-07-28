# StudyApp v1.0.0 Release Checklist

_Last updated: 2026-07-28_

This is the final v1 stopping gate. It does not imply that the v1.1 backlog is
part of this release.

## Release identity

- Intended release: `1.0.0`.
- `package.json` version: `1.0.0`.
- The footer build identifier begins with `v1.0.0_` and adds the Cyprus build
  date/time and commit reference.
- Release notes: [`RELEASE_NOTES_v1.md`](RELEASE_NOTES_v1.md).
- Deferred work: [`V1_1_BACKLOG.md`](V1_1_BACKLOG.md).

## Safety acceptance

- [x] Every local-file save/open flow uses the central explicit allowlist.
- [x] Active web content, executable content, and significant type mismatches
  are rejected.
- [x] Non-renderable supported files download rather than execute in the app
  origin.
- [x] Backup input is fully validated before IndexedDB changes.
- [x] Restore shows a preview, requires confirmation, and replaces covered data
  in one transaction.
- [x] CSV row order does not determine imported flashcard IDs.
- [x] Duplicate normalized flashcards are rejected.
- [x] PWA updates wait for an explicit user action and do not force an active
  page reload.

## Automated release gate

Run from a clean dependency install:

| Check | Result |
| --- | --- |
| `npm ci` | Pass — clean lockfile install |
| `npm run typecheck` | Pass |
| `npm test` | Pass — 11 files, 84 tests |
| `npm run build` | Pass — production/PWA bundle generated |

Dependency review: `npm audit --omit=dev` reports two instances of the
high-severity React Router advisory
[GHSA-qwww-vcr4-c8h2](https://github.com/advisories/GHSA-qwww-vcr4-c8h2).
The advisory explicitly affects only unstable RSC APIs. StudyApp uses a
client-only `createHashRouter` SPA and contains no RSC APIs, server actions, or
backend, so this is documented as non-applicable to the v1 runtime rather than
resolved with an unscoped breaking dependency migration.

## Manual smoke gate

The concise interactive record must cover Home, Library, Structured Study,
Learn & Practice, Split PDF Tool, accepted and rejected uploads, CSV import,
backup export/restore, desktop and narrow layouts, and PWA reload/update
behavior.

Status: **Pending**. The completed evidence will be recorded in
[`RELEASE_SMOKE_TEST_v1.md`](RELEASE_SMOKE_TEST_v1.md).

## Documentation gate

- [x] Current navigation describes Home plus four study areas.
- [x] No current documentation presents Add / Remove Material as a standalone
  product area.
- [x] Local-first storage and JSON backup limitations are explicit.
- [x] Supported/rejected local file behavior is documented.
- [x] Remaining non-blocking work is isolated in the v1.1 backlog.

## Final decision

**PENDING FINAL SMOKE GATE**

Do not tag or merge the release-gate PR until the automated checks and manual
smoke record pass. After that decision, stop v1 development and do not begin
v1.1 work in this PR.
