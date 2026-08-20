# StudyApp v1 Release Assessment

_Last updated: 2026-08-20_

## Current assessment

The August 20, 2026 release-blocker verification identified four release
blockers:

- DATA-04;
- WB-01;
- WB-02;
- WB-03.

All four were remediated, independently re-verified, merged through PR #186,
deployed to GitHub Pages and then exercised interactively against the real
production build.

Current result:

**RELEASE VERIFIED**

Verified production identity:

- `main` SHA: `5d94e2744014e1d87a4e65d8462ac98082d3e1ce`;
- build: `v1.0.0_20260820_2202_5d94e27`;
- production URL: `https://studyapp.markellosecosystem.com/#/`;
- stable release branch: `stable/release-2026-08-20`.

## August 20 blocker outcome

### DATA-04 — RESOLVED

The affected practice/content data behavior was corrected and protected by
regression coverage. Production smoke verification exercised creation/import,
persistence, reload/reopen behavior, repeated operation and cleanup through the
normal UI. The test data was removed and cleanup was confirmed after reload.

### WB-01 — RESOLVED

The affected Workspace behavior was corrected and verified through repeated
real browser interaction in production.

### WB-02 — RESOLVED

Pointer/focus behavior was corrected and verified interactively, including
repeated focus transitions and Workspace/frame interaction.

### WB-03 — RESOLVED

The affected Workspace layout behavior was corrected and verified against the
deployed build, including interactive use after layout/viewport changes.

## Verification evidence

The exact remediation state passed:

- typecheck;
- production build;
- 268/268 unit tests;
- 49/49 E2E tests;
- Linux CI;
- production dependency audit with 0 vulnerabilities.

The production smoke verification used Google Chrome `151.0.7922.138` with
Playwright `1.62.1`. No runtime/React errors or critical request failures were
observed. The only noted browser/network issue was a non-material
`/favicon.ico` 404.

## Remaining non-blocking findings

- DATA-02 remains Low/non-blocking.
- WB-04 remains Low/non-blocking.
- Two high-severity advisories remain in transitive build/dev dependencies;
  the production-only dependency audit is clean.
- Firefox and WebKit interactive verification remain follow-up gaps.
- Manual screen-reader verification remains a follow-up gap.

These items are documented residual risks and do not currently overturn the
release decision.

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
historical record. The August 20 verification is the current release assessment
for the deployed build.

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
functional issue remains for the verified August 20 production release. This is
a scoped assessment, not a claim that the application has no possible security,
accessibility or cross-browser gaps.
