# StudyApp v1.0.0 Smoke Test

_Prepared: 2026-07-28_

## Environment

- Production bundle built locally from `release/v1-final-gate`
- Intended release version: `1.0.0`
- Test data must be disposable local browser data

## Automated precondition

| Check | Result |
| --- | --- |
| Clean `npm ci` | Pass |
| TypeScript | Pass |
| Vitest | Pass — 11 files, 84 tests |
| Production/PWA build | Pass |

## Interactive smoke record

Status: **Pending — no browser runtime was connected to the Codex session.**

The following rows must be completed in one connected browser session. Source
inspection or unit tests are not substitutes for this interaction.

| Area or behavior | Required observation | Result |
| --- | --- | --- |
| Home | Four current areas and guide open correctly; no obsolete material-management card | Pending |
| Library | Add, open, classify, and remove source material | Pending |
| Structured Study | Add/open structured material and view split output | Pending |
| Learn & Practice | Open overview and core practice routes without errors | Pending |
| Split PDF Tool | Upload and split a small valid PDF locally | Pending |
| Safe upload | A supported file is accepted and opens/downloads in the intended mode | Pending |
| Unsafe rejection | HTML/SVG or a misleading extension is rejected with clear copy | Pending |
| CSV import | Valid templates import; duplicate/invalid input gives clear feedback | Pending |
| Backup | Export, preview, confirm/restore, and cancellation wording behave correctly | Pending |
| Desktop | Navigation, cards, dialogs, and actions remain usable | Pending |
| Narrow/mobile | Layout remains usable without clipped primary actions | Pending |
| PWA reload/update | Normal reload works; a waiting update prompts and reloads only after Update now | Pending |

## Decision

**NOT YET READY — interactive smoke evidence is required.**

No functional failure is recorded here. The sole open gate is browser
availability for the required manual interaction.
