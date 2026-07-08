# v1 Release Candidate Checklist

_Last updated: 2026-07-08_

This checklist tracks the final v1 release-candidate posture. It is not a claim that every future feature exists.

## Current Status

- v1 hardening complete.
- App remains local-first, browser-only and offline-ready.
- No account system, backend, analytics, advertising, remote storage or telemetry is part of v1.
- Current progress/settings backup does not include local file blobs.
- Future complete local-file export/import is designed in [`docs/LOCAL_FILE_EXPORT_DESIGN.md`](docs/LOCAL_FILE_EXPORT_DESIGN.md), but not implemented.

## Completed Hardening

- Review queue stability fixed and tested.
- Quiz duplicate-answer lock added and tested.
- CSV header validation added and tested.
- Source/split-PDF deletion behavior made intentional and tested at helper level.
- Backup/data-safety wording clarified in UI and docs.
- Local file `contentHash` support added for new files and generated split PDFs.
- CI workflow added for install, typecheck, tests and build.
- Dependabot added for npm and GitHub Actions updates.

## Required Manual Checks Before Tagging v1

- Run `npm.cmd test`.
- Run `npm.cmd run typecheck`.
- Run `npm.cmd run build`.
- Open the app locally and check the five navigation areas.
- Upload a small source PDF and confirm it appears in Library from Source.
- Split a small PDF and confirm generated chunks appear in Structured Study.
- Delete a source PDF with related split PDFs and confirm cancel/keep/delete-all choices are clear.
- Save a progress/settings backup and confirm the wording says local file blobs are not included.
- Confirm original-file guidance remains visible in Add / Remove Material and backup docs.
- Confirm no unexpected network behavior is introduced.

## Known Future Work

- Implement complete local-file export/import.
- Add PDF split progress feedback and compatibility-mode warnings.
- Replace quiz restart page reload with local React state reset.
- Add linting/formatting after agreeing on a baseline.
- Expand restore validation and preview behavior before adding broader restore modes.
