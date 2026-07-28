# StudyApp v1.0.0 Release Checklist

_Last updated: 2026-07-28_

This is the final v1 stopping gate. It does not imply that the v1.1 backlog is
part of this release.

## Current release-hardening follow-up

The focused July 28 follow-up is recorded separately in
[`RELEASE_HARDENING_SMOKE_TEST.md`](RELEASE_HARDENING_SMOKE_TEST.md). It adds
visible local-storage/data-safety notices and direct downloads for generated
split PDFs without changing the v1 data model or product scope.

| Current hardening check | Result |
| --- | --- |
| `npm ci` | PASS on required rerun with workspace-local cache |
| `npm run typecheck` | PASS |
| `npm test` | PASS — 13 files, 99/99 tests |
| `npm run build` | PASS with the existing bundle-size warning |
| Single split-PDF download | PASS — downloaded and independently parsed |
| Latest-result `Download all` | PASS — exactly two current outputs; older output excluded |
| Critical manual View/rename/delete/source-delete flows | INCOMPLETE — runtime blocked or not tested |
| Current follow-up decision | **NOT READY** |

The first `npm ci` attempt failed because the sandbox could not write to the
global npm cache. A later final-gate attempt failed because two stopped
preview/build processes still held the local Rolldown native module open.
After stopping only those verified processes, the rerun used a writable
workspace cache and passed. The production-only npm audit still exits 1 for
the two known React Router RSC-mode findings, which are outside this
client-only SPA's runtime path and have no available fix in the installed
major.

## Release identity

- Intended release: `1.0.0`.
- `package.json` version: `1.0.0`.
- PR #77 is merged in `main` at
  `a4c65229f3d09384678dee8e49a928aa1fce1f99`.
- The original PR commit
  `101549c3d0ef7d974dd8952a3944fbdee42fb8a3` and the merge commit were
  previously confirmed to have identical trees.
- Production URL:
  `https://studyapp.markellosecosystem.com/#/`.
- Visible deployed build identifier: `v1.0.0_20260728_1756_a4c6522`.
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
| `npm ci` | PASS — clean lockfile install |
| `npm run typecheck` | PASS |
| `npm test` | PASS — 11 files, 84/84 tests |
| `npm run build` | PASS — production/PWA bundle generated |
| Bundle-size warning | Observed and accepted |
| Local production preview | PASS — returned HTTP 200 and was stopped normally |
| `npm audit --omit=dev --audit-level=high` | REVIEWED EXCEPTION — not a passing command |

The audit exited with code 1 and reported two high-severity React Router
findings affecting unused unstable RSC APIs. StudyApp uses a client-only
`createHashRouter` SPA and contains no RSC APIs, server actions, or backend. No
dependency migration was performed. The repository owner reviewed and accepted
this exception for the personal-use release.

## Manual smoke gate

The full interactive smoke test did **not** pass. Directly observed results are
recorded in [`RELEASE_SMOKE_TEST_v1.md`](RELEASE_SMOKE_TEST_v1.md):

- PASS: Home, Guide, desktop layout.
- PARTIAL PASS: Library, safe upload, responsive layout at `718 × 608`.
- PARTIAL / DISPLAY VERIFIED: Structured Study.
- NOT TESTED: Learn & Practice, a new PDF split, unsafe rejection, CSV import,
  backup/restore, the required `390 × 844` viewport, and the waiting
  service-worker Update now / Later flow.
- Runtime restriction: the connected Codex browser blocked blob-preview
  navigation under its own security policy.
- Minor known console issue: one non-blocking `404` for `/favicon.ico`.

Status: **OWNER-WAIVED FOR PERSONAL USE**. The repository owner explicitly
accepts the remaining unexecuted interactive checks. They are not represented
as passing.

## Documentation gate

- [x] Current navigation describes Home plus four study areas.
- [x] No current documentation presents Add / Remove Material as a standalone
  product area.
- [x] Local-first storage and JSON backup limitations are explicit.
- [x] Supported/rejected local file behavior is documented.
- [x] Remaining non-blocking work is isolated in the v1.1 backlog.
- [x] Partial smoke evidence, untested checks, runtime limitations, and the
  owner’s risk acceptance are recorded without changing release history.

## Historical v1.0.0 decision

**OWNER ACCEPTED FOR PERSONAL USE**

**ACCEPTED FOR PERSONAL USE — partial interactive smoke completed; remaining manual checks waived by the repository owner.**

This owner acceptance is not equivalent to a complete production-grade release
certification. PR #77 was merged before the interactive smoke record was
completed; this documentation follow-up records the later evidence and waiver
without asserting that the full manual gate passed.

## Current hardening PR decision

**NOT READY**

The new download flows and automated checks pass, but the connected browser
runtime did not complete all critical manual flows. No waiver is inferred for
this follow-up. See
[`RELEASE_HARDENING_SMOKE_TEST.md`](RELEASE_HARDENING_SMOKE_TEST.md) for exact
evidence.
