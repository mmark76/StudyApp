# StudyApp v1.0.0 Release Checklist

_Last updated: 2026-08-21_

This is the v1 release gate. It does not imply that the v1.1 backlog is part of
this release.

## Current production checkpoint — 2026-08-21

**RELEASE VERIFIED**

The release-governance state merged through PR #197 passed the exact-SHA
main-branch CI gate, deployed successfully, and passed focused interactive
production smoke verification.

Repository inspection immediately before this documentation update confirmed
that `main` remains at the verified checkpoint SHA. If `main` advances later,
that later SHA will require its own deployment and production verification
before receiving `RELEASE VERIFIED` status.

Current verified production identity:

- `main` SHA: `9ab9ab11c443fb1f3dcdbc759063b9301e2a3461`;
- deployed build: `v1.0.0_20260821_1405_9ab9ab1`;
- production URL: `https://studyapp.markellosecosystem.com/`;
- release-governance PR: `#197` — merged;
- main-branch CI: `#366` — PASS;
- GitHub Pages deployment: `#435` — PASS.

| August 21 release check | Result |
| --- | --- |
| Current `main` SHA | PASS — `9ab9ab11c443fb1f3dcdbc759063b9301e2a3461` |
| Deployed build | PASS — `v1.0.0_20260821_1405_9ab9ab1`, matches `main` |
| Production URL | PASS — `https://studyapp.markellosecosystem.com/` |
| Release-governance PR #197 | PASS — merged |
| CI #366 | PASS |
| Pages deployment #435 | PASS |
| Desktop smoke | PASS |
| Workspace BETA desktop | PASS — four panels, 22/22/34/22 proportions, keyboard/pointer resizing and reset |
| Mobile 360px | PASS — single-panel Workspace navigation, no overflow |
| Mobile 390px | PASS — single-panel navigation and modal controls |
| Mobile 412px | PASS — single-panel Workspace navigation, no overflow |
| Local persistence | PASS — temporary chapter survived refresh |
| Cleanup | PASS — temporary chapter removed; count returned from 14 to 13 |
| Refresh/routing | PASS — direct routes, refresh, back and forward |
| Console diagnostics | PASS — no errors; two non-blocking hydration warnings |
| Network diagnostics | PASS — critical resources loaded successfully; only the documented non-material `/favicon.ico` 404 |

No repository code, GitHub settings, production configuration or existing user
data was changed during the smoke test. The temporary local chapter used for the
persistence check was removed through the normal UI, and cleanup was confirmed.

### Current non-blocking observations

- Two `No HydrateFallback element provided` warnings were observed during
  console diagnostics. No console errors were observed.
- The documented non-material `/favicon.ico` 404 remains; critical resources
  loaded successfully.
- Two high-severity advisories remain in transitive build/dev dependencies,
  while the previously recorded production-only dependency audit is clean.
- The production build still reports chunks larger than 500 kB after
  minification.
- Firefox and WebKit interactive verification remain follow-up gaps.
- Manual screen-reader verification remains a follow-up gap.

These observations do not change the August 21 `RELEASE VERIFIED` decision.
Firefox, WebKit and manual screen-reader verification are not represented as
completed.

## Historical verified production checkpoint — 2026-08-20

**RELEASE VERIFIED**

The previous August 20 blocker-remediation release was reviewed, merged,
deployed and interactively smoke-verified in production. This history is
preserved as evidence for that exact checkpoint and is not overwritten by the
August 21 verification.

| Historical August 20 release check | Result |
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

Historical August 20 release identity:

- PR: `#186`;
- remediation commit: `7031f34d1c6680e960ef33b10685cfa608858317`;
- squash-merged `main` SHA: `5d94e2744014e1d87a4e65d8462ac98082d3e1ce`;
- deployed build: `v1.0.0_20260820_2202_5d94e27`;
- production URL at verification: `https://studyapp.markellosecosystem.com/#/`;
- stable release branch: `stable/release-2026-08-20`.

The August 20 production smoke test used Google Chrome `151.0.7922.138` with
Playwright `1.62.1`. DATA-04 and WB-01/WB-02/WB-03 all passed through real
interaction against the deployed build. Temporary chapter, flashcard and
progress data were removed through the UI and reload confirmed cleanup. No
runtime/React error or critical request failure was observed. A non-material
`/favicon.ico` 404 was recorded.

Historical non-blocking follow-up items included:

- DATA-02 — Low/non-blocking;
- WB-04 — Low/non-blocking;
- two high-severity advisories in transitive build/dev dependencies, while the
  production-only dependency audit was clean;
- the production bundle-size warning;
- Firefox, WebKit and manual screen-reader verification gaps.

These items did not change the August 20 `RELEASE VERIFIED` decision for that
exact historical checkpoint.

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
runtime path. The August 20 production-only audit was clean.

## Release identity history

- Intended release: `1.0.0`.
- `package.json` version: `1.0.0`.
- Historical PR #77 was merged in `main` at
  `a4c65229f3d09384678dee8e49a928aa1fce1f99`.
- The original PR #77 commit
  `101549c3d0ef7d974dd8952a3944fbdee42fb8a3` and the merge commit were
  previously confirmed to have identical trees.
- Historical July deployed build identifier:
  `v1.0.0_20260728_1756_a4c6522`.
- Previous verified deployed build identifier:
  `v1.0.0_20260820_2202_5d94e27`.
- Latest verified deployed build identifier:
  `v1.0.0_20260821_1405_9ab9ab1`.
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
- [x] The August 21 production smoke preserved existing user data and removed
  its temporary local test record.

## Automated release gate

The latest August 21 production checkpoint has passing evidence for:

- merged release-governance PR #197;
- exact-SHA main-branch CI #366;
- 268/268 unit tests;
- 61/61 Playwright E2E tests;
- production build;
- GitHub Pages deployment #435.

The CI/deployment chain required successful full CI on the exact `main` SHA
before the Pages deployment workflow published that SHA. The deployed build ID
matched the successful main-branch checkpoint.

The previous August 20 checkpoint retains its separate automated evidence:
typecheck, production build, 268/268 unit tests, 49/49 E2E tests, Linux CI and a
production dependency audit with 0 vulnerabilities.

## Current manual smoke gate

The August 21 production interactive gate is complete:

- desktop smoke: PASS;
- Workspace BETA desktop: PASS;
- mobile 360px, 390px and 412px: PASS;
- local persistence and cleanup: PASS;
- refresh/routing: PASS;
- console/network diagnostics: PASS.

The exact deployed build matched `main`. Critical resources loaded successfully,
no console errors were observed, and temporary test data was removed. The two
hydration warnings and documented `/favicon.ico` 404 are non-blocking
observations.

Broader Firefox, WebKit and manual screen-reader coverage remains recommended
but is not represented as completed.

## Documentation gate

- [x] Latest production status is recorded as `RELEASE VERIFIED` for exact SHA
  `9ab9ab11c443fb1f3dcdbc759063b9301e2a3461`.
- [x] Latest deployed build ID and production URL are recorded.
- [x] CI #366 and Pages deployment #435 are recorded as PASS.
- [x] Desktop, Workspace desktop and 360/390/412 mobile smoke results are
  recorded.
- [x] Local persistence, cleanup, refresh/routing and diagnostics are recorded.
- [x] Hydration warnings and `/favicon.ico` 404 are recorded as non-blocking.
- [x] Production-only dependency audit status is distinguished from dev/build
  advisories.
- [x] Firefox, WebKit and manual screen-reader gaps remain explicit and are not
  claimed as completed.
- [x] The August 20 and July release decisions remain preserved as historical
  evidence.

## Historical v1.0.0 decision — July 2026

**OWNER ACCEPTED FOR PERSONAL USE**

The July release was accepted with partial interactive smoke and explicit owner
waiver. That historical decision is preserved and is not rewritten as a full
pass.

## Previous v1.0.0 verified production decision — August 20, 2026

**RELEASE VERIFIED**

Production release `5d94e27` / `v1.0.0_20260820_2202_5d94e27` remains fully
smoke-verified for the remediated DATA-04 and WB-01/WB-02/WB-03 release blockers
as historical evidence for that exact checkpoint.

## Current v1.0.0 verified production decision — August 21, 2026

**RELEASE VERIFIED**

Production release `9ab9ab1` / `v1.0.0_20260821_1405_9ab9ab1` is the latest
verified checkpoint. It passed exact-SHA CI, Pages deployment and the focused
desktop, Workspace, mobile, persistence/cleanup, routing and diagnostics smoke
scope recorded above.
