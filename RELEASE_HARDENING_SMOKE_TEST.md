# StudyApp Release-Hardening Smoke Test

_Tested: 2026-07-28_

## Decision

**NOT READY**

The automated release gate passes and the new split-PDF download behavior
created valid files with correct page counts. The connected browser runtime
could not complete the PDF Blob preview or the native prompt/confirmation flows
for rename and deletion. Those critical manual checks are recorded as blocked,
not passed, so this PR does not meet the stated `READY` conditions.

## Reviewed personal-use scope

StudyApp is a local browser tool for using and studying content provided by the
user. It has no backend upload, account, remote storage, or automatic
educational-content generation. It is not a permanent-storage, archive, or
backup service. Uploaded and generated file blobs remain in IndexedDB until
removed, but browser data can be lost; users must retain original files and
required copies outside StudyApp.

## Environment

- Branch: `agent/release-hardening-local-data-downloads`
- Base commit: `592ac2c`
- Production preview: `http://127.0.0.1:4173/`
- Browser: Codex in-app browser
- Loaded build after PWA update: `v1.0.0_20260728_2047_local`
- Source fixture: `studyapp-smoke-6-pages.pdf`, 6 pages, 2,402 bytes
- Responsive override requested: `390 × 844`
- Browser-reported CSS viewport under device scaling: `582 × 1259`
- Browser-reported document width: `560` CSS pixels, with no horizontal
  overflow at the tested responsive breakpoint

## Automated gate

| Check | Result |
| --- | --- |
| `npm ci` | PASS on the required rerun with a workspace-local npm cache |
| `npm run typecheck` | PASS |
| `npm test` | PASS — 13 files, 99/99 tests |
| `npm run build` | PASS — production and PWA assets generated |
| Build warning | Existing bundle-size warning observed; not hidden |
| `npm audit --omit=dev --audit-level=high` | REVIEWED EXCEPTION — exit 1, two high-severity React Router findings for unused RSC mode; no fix available in the installed major |

The first `npm ci` attempt failed because the sandbox could not write to the
global npm cache. A later final-gate attempt also failed with `EPERM` because
two stopped preview/build processes still had the local Rolldown native module
open. Only those two processes, verified by their loaded module path, were
stopped; the required rerun with a writable workspace cache then passed. These
environmental failures are not represented as passing runs. The successful
install reported four high-severity findings across all dependencies; the
production-only audit above narrows this to the two known React Router RSC
findings already documented for this client-only hash-routed SPA.

## Interactive smoke results

| # | Flow | Result | Direct observation |
| --- | --- | --- | --- |
| 1 | Upload a normal PDF | **PASS** | The 6-page fixture was added to Library as a Book. Status: “A local copy was added to Library in this browser.” |
| 2 | View the source PDF | **BLOCKED BY TEST RUNTIME** | The View action was located and invoked, but the connected browser rejected Blob-URL navigation under its security policy. No workaround or alternate browser surface was used. |
| 3 | Split into one chunk | **PASS** | Created `studyapp-smoke-6-pages-pages-1.pdf` from page 1. |
| 4 | Split into multiple chunks | **PASS** | Created pages 1–3 and 4–6 as two separate PDF records linked to the source. |
| 5 | Download one split PDF | **PASS** | The individual Download action wrote `studyapp-smoke-6-pages-pages-1.pdf` to the device Downloads folder. |
| 6 | Download all | **PASS** | The latest-result action started exactly two downloads and wrote only `...pages-1-3.pdf` and `...pages-4-6.pdf`; the older single-page output was not included. |
| 7 | Open a downloaded PDF outside StudyApp | **PARTIAL / INTERACTIVE OPEN BLOCKED** | Local/Blob browser navigation was blocked by the runtime. The downloaded files were independently opened and parsed outside StudyApp by `pdf-lib`, but no interactive external viewer was completed. |
| 8 | Verify downloaded page counts | **PASS** | Independent parsing reported 1 page for `...pages-1.pdf`, 3 pages for `...pages-1-3.pdf`, and 3 pages for `...pages-4-6.pdf`. |
| 9 | Rename a split PDF | **BLOCKED BY TEST RUNTIME** | The native prompt could not be handled reliably: the click timed out and the driver exposed an unexpected native-dialog state. No rename was claimed as complete. |
| 10 | Delete a split PDF | **BLOCKED BY TEST RUNTIME** | Keyboard activation did not open the confirmation; a direct visible-DOM activation caused the browser driver to time out on the native dialog. No deletion was accepted or claimed. |
| 11 | Delete the source PDF with related-split choices | **NOT TESTED** | This path also depends on native prompt/confirmation handling. It was not attempted after the repeated driver failures above. |
| 12 | Import and use flashcards | **PASS** | Imported one chapter and two flashcards from the repository CSV templates, opened Flashcards, and revealed the first imported answer. |
| 13 | Reload and verify local behavior | **PASS** | After reload, the imported flashcard remained available from IndexedDB and the session returned to the question side. |
| 14 | Notices at desktop and mobile width | **PASS** | Home, Library upload, Structured Study upload, Content Import, PDF Splitter, and Progress/Backup notices were directly observed. The mobile responsive override showed the central notice with no horizontal overflow. |
| 15 | PWA update flow | **PASS** | A real waiting update banner appeared. The old build remained active until **Update now** was selected; the page then reloaded into build `v1.0.0_20260728_2047_local` with the new central notice. |

## Download evidence

| Filename | Size | Verified pages |
| --- | ---: | ---: |
| `studyapp-smoke-6-pages-pages-1.pdf` | 956 bytes | 1 |
| `studyapp-smoke-6-pages-pages-1-3.pdf` | 1,539 bytes | 3 |
| `studyapp-smoke-6-pages-pages-4-6.pdf` | 1,540 bytes | 3 |

Downloading did not remove the IndexedDB records, change their display names,
or change their `sourceFileId` relationships. Structured Study displayed View,
Download, Rename, and Remove controls beside all three split PDFs.

## Screenshots

- [PWA update waiting for user action](docs/screenshots/release-hardening/01-pwa-update-ready.png)
- [Home storage notice — desktop](docs/screenshots/release-hardening/02-home-storage-notice-desktop.png)
- [PDF Splitter latest-result Download and Download all controls](docs/screenshots/release-hardening/03-splitter-download-controls.png)
- [Structured Study notice and per-file Download controls](docs/screenshots/release-hardening/04-structured-study-notice-and-downloads.png)
- [Home storage notice — mobile responsive override](docs/screenshots/release-hardening/05-home-storage-notice-mobile-390x844.png)

The in-app browser's full-page capture repeated the viewport in some of the
PNG files. This is a screenshot-tool artifact; the linked images are retained
as evidence of the visible states and controls rather than presented as
pixel-perfect marketing captures.

## Remaining known limitations

- The progress/settings JSON backup does not include uploaded or generated file
  blobs.
- Browser storage capacity, persistence, and data retention remain
  browser/device dependent.
- Browsers may require permission for multiple automatic downloads.
- Nested split-PDF descendant relationships are not traversed recursively
  during source deletion.
- Interactive Blob preview and native prompt/confirmation flows remain
  unverified in this test runtime.
- The existing production React Router advisory affects unused RSC APIs; this
  application has no RSC mode, server actions, or backend.

## Final rationale

All identified release-blocking implementation findings for the intended
personal-use scope have been addressed or documented. However, the requested
release decision can be `READY` only after the critical manual View,
rename/delete, source-deletion-choice, and external-viewer checks complete in a
browser environment that permits those flows. Until then, the accurate result
is **NOT READY**.
