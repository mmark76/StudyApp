# StudyApp v1.0.0 Release Checklist

_Last updated: 2026-08-20_

This is the v1 release gate. It does not imply that the v1.1 backlog is part of
this release.

## Current final release decision — 2026-08-20

**RELEASE VERIFIED**

The August 20 blocker-remediation release was reviewed, merged, deployed and
interactively smoke-verified in production.

| Final release check | Result |
| --- | --- |
| DATA-04 | PASS — resolved and production smoke-verified |
| WB-01 | PASS — resolved and production smoke-verified |
| WB-02 | PASS — resolved and production smoke-verified |
| WB-03 | PASS — resolved and production smoke-verified |
| Typecheck | PASS |
| Unit tests | PASS — 268/268 |
| Full E2E | PASS — 49/49 |
| Production build | PASS |
| Linux CI | PASS |
| `npm audit --omit=dev` / production dependency audit | PASS — 0 vulnerabilities |
| GitHub Pages deployment | PASS |
| Production HTTPS page/assets | PASS — HTTP 200 |
| Interactive production smoke | PASS — Chrome/Playwright |

Release identity:

- PR: `#186`;
- remediation commit: `7031f34d1c6680e960ef33b10685cfa608858317`;
- squash-merged `main` SHA: `5d94e2744014e1d87a4e65d8462ac98082d3e1ce`;
- deployed build: `v1.0.0_20260820_2202_5d94e27`;
- production URL: `https://studyapp.markellosecosystem.com/#/`;
- stable release branch: `stable/release-2026-08-20`.

The production smoke test used Google Chrome `151.0.7922.138` with Playwright
`1.62.1`. DATA-04 and WB-01/WB-02/WB-03 all passed through real interaction
against the deployed build. Temporary chapter, flashcard and progress data were
removed through the UI and reload confirmed cleanup. No runtime/React error or
critical request failure was observed. A non-material `/favicon.ico` 404
remains.

Known non-blocking follow-up items:

- DATA-02 — Low/non-blocking;
- WB-04 — Low/non-blocking;
- two high-severity advisories remain in transitive build/dev dependencies,
  while the production-only dependency audit is clean;
- Firefox, WebKit and manual screen-reader verification remain follow-up gaps.

These items do not change the current `RELEASE VERIFIED` decision.

## Historical July 28 release-hardening follow-up

The focused July 28 follow-up is recorded separately in
[`RELEASE_HARDENING_SMOKE_TEST.md`](RELEASE_HARDENING_SMOKE_TEST.md). It added
visible local-storage/data-safety notices and direct downloads for generated
split PDFs without changing the v1 data model or product scope.

| July 28 hardening check | Result at that time |
| --- | --- |
| `npm ci` | PASS on required rerun with workspace-local cache |
| `npm run typecheck` | PASS |
| `npm test` | PASS — 13 files, 99/99 tests |
| `npm run build` | PASS with the existing bundle-size warning |
| Single split-PDF download | PASS — downloaded and independently parsed |
| Latest-result `Download all` | PASS — exactly two current outputs; older output excluded |
| Critical manual View/rename/delete/source-delete flows | INCOMPLETE — runtime blocked or not tested |
| July 28 follow-up decision | **NOT READY** |

The first `npm ci` attempt failed because the sandbox could not write to the
global npm cache. A later final-gate attempt failed because two stopped
preview/build processes still held the local Rolldown native module open.
After stopping only those verified processes, the rerun used a writable
workspace cache and passed. The July production-only npm audit still exited 1
for two React Router RSC-mode findings that were outside this client-only SPA's
runtime path. The current August 20 production-only audit is clean.

## Release identity history

- Intended release: `1.0.0`.
- `package.json` version: `1.0.0`.
- Historical PR #77 was merged in `main` at
  `a4c65229f3d09384678dee8e49a928aa1fce1f99`.
- The original PR #77 commit
  `101549c3d0ef7d974dd8952a3944fbdee42fb8a3` and the merge commit were
  previously confirmed to have identical trees.
- Historical deployed build identifier:
  `v1.0.0_20260728_1756_a4c6522`.
- Current verified deployed build identifier:
  `v1.0.0_20260820_2202_5d94e27`.
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
- [x] DATA-04 remediation preserves the verified chapter/content data behavior.
- [x] WB-01/WB-02/WB-03 remediation passes interactive production behavior.

## Current automated release gate

The August 20 release gate has current passing evidence for:

- typecheck;
- production build;
- 268/268 unit tests;
- 49/49 E2E tests;
- Linux CI;
- production dependency audit with 0 vulnerabilities.

The earlier July automated-gate evidence remains part of release history but is
superseded by the current August 20 verification for the deployed release.

## Current manual smoke gate

The production interactive gate is complete for the four August release
blockers:

- DATA-04: PASS;
- WB-01: PASS;
- WB-02: PASS;
- WB-03: PASS.

The deployed build ID matched the merged SHA. Page and critical assets returned
HTTP 200. No production failure was observed during the smoke run.

Broader Firefox, WebKit and manual screen-reader coverage is still recommended
but is not represented as completed.

## Documentation gate

- [x] Current release status is recorded as `RELEASE VERIFIED`.
- [x] Current production SHA and build ID are recorded.
- [x] DATA-04 and WB-01/WB-02/WB-03 resolution is recorded.
- [x] Current automated and interactive verification evidence is recorded.
- [x] Production-only dependency audit status is distinguished from dev/build advisories.
- [x] Remaining non-blocking findings and untested browser/accessibility gaps are explicit.
- [x] Historical July release decisions remain preserved as historical evidence.

## Historical v1.0.0 decision — July 2026

**OWNER ACCEPTED FOR PERSONAL USE**

The July release was accepted with partial interactive smoke and explicit owner
waiver. That historical decision is preserved and is not rewritten as a full
pass.

## Current v1.0.0 decision — August 20, 2026

**RELEASE VERIFIED**

Production release `5d94e27` / `v1.0.0_20260820_2202_5d94e27` is fully
smoke-verified for the remediated DATA-04 and WB-01/WB-02/WB-03 release
blockers.
