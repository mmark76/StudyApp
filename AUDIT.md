# StudyApp Release and Main-Branch Assessment

_Last updated: 2026-08-21_

## Current assessment

The August 21, 2026 deployment is the latest production-attested checkpoint:

**RELEASE VERIFIED**

- verified `main` SHA: `9ab9ab11c443fb1f3dcdbc759063b9301e2a3461`;
- deployed build: `v1.0.0_20260821_1405_9ab9ab1`;
- production URL: `https://studyapp.markellosecosystem.com/`;
- release-governance PR: `#197` — merged;
- main-branch CI: `#366` — PASS;
- GitHub Pages deployment: `#435` — PASS.

Repository inspection immediately before this documentation update confirmed
that `9ab9ab11c443fb1f3dcdbc759063b9301e2a3461` is still the current `main`
SHA. `main` has not advanced beyond the production-smoke checkpoint.

The exact deployed build matched `main`, and the focused production smoke
completed successfully against the production URL.

| August 21 production check | Result |
| --- | --- |
| Current `main` SHA | PASS — `9ab9ab11c443fb1f3dcdbc759063b9301e2a3461` |
| Deployed build | PASS — `v1.0.0_20260821_1405_9ab9ab1`, matches `main` |
| Production URL | PASS — `https://studyapp.markellosecosystem.com/` |
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
data was changed during the production smoke. Only temporary local test data was
created, verified and removed through the normal UI.

## Release-governance hardening — 2026-08-21

PR #197 hardened the deployment pipeline so production deployment follows
successful full CI on `main` instead of starting independently from the same
push:

```text
push/merge to main
→ CI on exact main SHA
→ typecheck
→ unit tests
→ Playwright E2E
→ production build
→ successful CI workflow completion
→ Pages build of the exact CI head SHA
→ deploy
```

The Pages workflow checks out `workflow_run.head_sha`, so the deployed source is
the same commit that passed the main-branch CI run. For the current checkpoint,
CI #366 and Pages deployment #435 both passed for the release-governance state
merged through PR #197.

Repository branch metadata inspected during the August 21 audit did not expose
required status checks as enforced classic branch-protection checks. GitHub
Rulesets may be configured separately and are not asserted here. Repository
settings should continue to require the CI gate before merges to `main` where
supported.

## Historical verified checkpoint — 2026-08-20

The previous production-attested checkpoint remains preserved as historical
verification evidence:

- verified `main` SHA: `5d94e2744014e1d87a4e65d8462ac98082d3e1ce`;
- verified build: `v1.0.0_20260820_2202_5d94e27`;
- production URL at verification: `https://studyapp.markellosecosystem.com/#/`;
- stable release branch: `stable/release-2026-08-20`.

That exact checkpoint remains **RELEASE VERIFIED** for its reviewed historical
scope. Its evidence is not replaced or rewritten by the later August 21
verification.

### Historical August 20 blocker outcome

#### DATA-04 — RESOLVED

The affected practice/content data behavior was corrected and protected by
regression coverage. Production smoke verification exercised creation/import,
persistence, reload/reopen behavior, repeated operation and cleanup through the
normal UI. The test data was removed and cleanup was confirmed after reload.

#### WB-01 — RESOLVED

The affected Workspace behavior was corrected and verified through repeated
real browser interaction in production.

#### WB-02 — RESOLVED

Pointer/focus behavior was corrected and verified interactively, including
repeated focus transitions and Workspace/frame interaction.

#### WB-03 — RESOLVED

The affected Workspace layout behavior was corrected and verified against the
deployed build, including interactive use after layout/viewport changes.

### Verified August 20 evidence

The exact August 20 remediation state passed:

- typecheck;
- production build;
- 268/268 unit tests;
- 49/49 E2E tests;
- Linux CI;
- production dependency audit with 0 vulnerabilities.

The August 20 production smoke verification used Google Chrome `151.0.7922.138`
with Playwright `1.62.1`. No runtime/React errors or critical request failures
were observed. The only noted browser/network issue was a non-material
`/favicon.ico` 404.

## Non-blocking observations and follow-ups

- Two `No HydrateFallback element provided` warnings were observed during the
  August 21 console diagnostics. No console errors were observed, and the
  warnings did not affect the smoke result.
- The documented non-material `/favicon.ico` 404 was observed; critical page and
  application resources loaded successfully.
- The production-only dependency audit recorded for the verified August 20
  release is clean, while two high-severity advisories remain in transitive
  build/dev dependencies.
- The production build reports JavaScript chunks larger than 500 kB after
  minification. Route-level/code splitting remains a performance and
  maintainability follow-up, not a functional blocker.
- Playwright E2E and the August 21 production smoke used Chromium/Chrome.
  Firefox and WebKit interactive verification remain follow-up gaps.
- Manual screen-reader verification remains a follow-up gap.
- User-saved study-material links currently support HTTP and HTTPS. The v1.1
  backlog retains the decision about an HTTPS-only policy for new links and
  compatibility with existing HTTP records.
- DATA-02 and WB-04 remain Low/non-blocking historical findings.

These observations do not overturn the August 21 `RELEASE VERIFIED` decision
for the reviewed personal-use scope. Firefox, WebKit and manual screen-reader
verification are not claimed as completed.

## Historical July assessment

The July 2026 v1 release gate concentrated on three user-data blockers and one
release-time PWA risk:

- executable local content opening under the StudyApp origin;
- insufficiently validated destructive restore;
- CSV row-position-based flashcard identity;
- automatic PWA reload while a user may have unfinished input.

Those blockers were resolved with focused policies, transactional behavior and
regression tests. The July 28 release-hardening follow-up additionally reviewed
the intended-use scope, visible browser-storage notices, progress/settings
backup wording and direct download of generated split PDFs.

That earlier evidence and its partial manual-gate limitations remain part of the
historical record. The August 20 verification remains the previous verified
checkpoint, and the August 21 verification is the latest production assessment.

## Accepted v1 boundaries

StudyApp remains local-first and browser-only. JSON backup does not include local
file blobs. Browser storage has finite capacity. Complete local-file export,
recursive nested split-PDF graph handling and other deferred work are not
silently treated as complete.

Release behavior and limitations are recorded in
[`RELEASE_NOTES_v1.md`](RELEASE_NOTES_v1.md); final execution evidence and the
current release decision are recorded in
[`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md).

Within this reviewed personal-use scope, no known release-blocking security or
functional issue remains for the verified August 21 production release. This is
a scoped assessment, not a claim that the application has no possible security,
accessibility, performance or cross-browser gaps.
