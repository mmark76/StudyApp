# StudyApp v1.0.0 Smoke Test

_Prepared: 2026-07-28_

## Status

**ACCEPTED FOR PERSONAL USE — partial interactive smoke completed; remaining manual checks waived by the repository owner.**

This records a personal-use risk acceptance, not a complete production-grade
release certification. PR #77 was merged before this interactive smoke record
was completed; this follow-up records the evidence gathered afterward without
rewriting release history or claiming that untested checks passed.

## Release identity and environment

- Repository: `https://github.com/mmark76/StudyApp`
- PR #77: merged
- Tested `main` merge commit:
  `a4c65229f3d09384678dee8e49a928aa1fce1f99`
- Original PR commit:
  `101549c3d0ef7d974dd8952a3944fbdee42fb8a3`
- The original PR commit and merge commit were previously confirmed to have
  identical trees.
- Intended release version: `1.0.0`
- Production URL tested:
  `https://studyapp.markellosecosystem.com/#/`
- Visible deployed build identifier: `v1.0.0_20260728_1756_a4c6522`
- Browser: Google Chrome 150.0.7871.187, Official Build, 64-bit
- Test date and local system time: `2026-07-28 18:40`
- Timezone: not captured in the evidence
- Responsive viewport directly confirmed through
  `window.innerWidth × window.innerHeight`: `718 × 608`
- Required `390 × 844` viewport: **NOT TESTED**
- Test data: disposable local browser data

## Automated precondition

| Check | Result |
| --- | --- |
| Clean `npm ci` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | PASS — 11 files, 84/84 tests |
| `npm run build` | PASS — production/PWA bundle generated |
| Bundle-size warning | Observed and accepted |
| Local production preview | PASS — returned HTTP 200 and was stopped normally |
| `npm audit --omit=dev --audit-level=high` | REVIEWED EXCEPTION — exit code 1; two high-severity React Router findings affecting unused unstable RSC APIs; owner accepted for this personal-use release; no dependency migration performed |

## Browser runtime limitation

The Codex in-app browser was connected and supported direct DOM/Playwright
interaction. It successfully interacted with Home, Guide, and the safe upload
flow. Its security policy blocked blob-preview navigation and prohibited
switching to a workaround browser surface. This is recorded as a test-runtime
restriction, not as an observed StudyApp failure.

## Interactive smoke record

| Area or behavior | Result | Direct observation |
| --- | --- | --- |
| Home | **PASS** | Production Home loaded. Library, Structured Study, Learn & Practice, and Split PDF Tool were present; the guide card was present; no obsolete standalone material-management card appeared. |
| Guide | **PASS** | The guide opened and closed correctly through direct browser interaction. |
| Library | **PARTIAL PASS** | A safe TXT file was uploaded, classified as Book, and appeared correctly. Existing production data also showed a 4.50 MB PDF in Books with View and Delete controls. View was not completed because the Codex browser blocked blob-preview navigation; opening and removal were not fully tested. |
| Structured Study | **PARTIAL / DISPLAY VERIFIED** | A PDF appeared under Contents. Multiple generated PDF extracts appeared under Chapters. View, Remove, and Rename controls were displayed; the actions were not all executed. |
| Learn & Practice | **NOT TESTED** | The overview and core practice routes were not exercised during this smoke session. |
| Split PDF Tool | **NOT TESTED** | Existing generated extracts were visible, but no new PDF split operation was completed during this smoke session. |
| Safe upload | **PARTIAL PASS** | Safe TXT upload and classification worked. Safe blob preview was not tested because the Codex browser blocked the navigation under its security policy. |
| Unsafe rejection | **NOT TESTED** | HTML, SVG, misleading-extension, and MIME-mismatch rejection were not exercised. |
| CSV import | **NOT TESTED** | Valid templates, invalid headers, and normalized duplicate rejection were not exercised. |
| Backup and restore | **NOT TESTED** | Export, restore preview, cancellation, confirmed restore, and validation-failure preservation were not exercised. |
| Desktop layout | **PASS** | Header, navigation, cards, buttons, and footer were visible without clipping or overlap at the tested desktop size. |
| Narrow responsive layout | **PARTIAL PASS** | At 718 × 608, navigation wrapped correctly, content changed to a single column, primary controls remained visible, and no horizontal clipping or overlapping controls were observed. The required 390 × 844 viewport was not tested. |
| PWA reload/update | **NOT TESTED** | A real waiting service-worker update was not produced. The Update now / Later interaction was not directly observed. |

## Console observation

One non-blocking request returned `404` for `/favicon.ico`. This is recorded as
a minor known issue; the browser console was not completely clean.

## Owner waiver and decision

The repository owner explicitly accepts the remaining unexecuted interactive
smoke-test risk for this personal-use application. Untested and partially
tested rows above remain recorded as such and are not treated as passing.

**ACCEPTED FOR PERSONAL USE — partial interactive smoke completed; remaining manual checks waived by the repository owner.**
