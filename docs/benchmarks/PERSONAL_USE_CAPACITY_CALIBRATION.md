# Personal-use capacity calibration: 150 chapters / 1,500 flashcards

## Final post-B-03 decision

_Owner decision recorded: 2026-08-16, after the PR #130 hardening checkpoint._

The evidence chronology is:

1. **Pre-B-03:** **DO NOT APPROVE** because the unpaginated manager exceeded
   the mounted-row, DOM, focusable-control, accessibility-tree and constrained
   long-task budgets.
2. **B-03:** replace repeated cross-filtering with O(U + F)-style projections
   and introduce bounded, accessible pagination.
3. **Post-B-03 recommendation:** **APPROVE** after all established budgets pass.
4. **Owner decision:** **APPROVED**.

| Decision field | Current status |
| --- | --- |
| Candidate | 150 chapters / 1,500 flashcards |
| Product status | **SUPPORTED PERSONAL-USE OPERATIONAL CAPACITY** |
| Production enforcement | **NOT YET IMPLEMENTED** |
| Technical/read compatibility | 10,000 chapters / 100,000 flashcards |
| Safety-maximum operational usability | **NOT CLAIMED** |
| Backup-over-10-MiB compatibility defect | **OPEN** |

The post-B-03 measurements reduce the manager from 14,894 to 731 DOM nodes,
1,650 to 75 mounted content rows, 4,956 to 233 focusable controls, and about
26,000-29,000 to about 1,500 AX nodes. Worst desktop TTI improves from 327 ms to
130 ms and worst constrained TTI from 1,150 ms to 350 ms. **All established
B-02 post-B-03 budgets pass.**

The approved capacity is a product/support target. A later task must enforce it
for new writes, additions and imports without invalidating compatible existing
data above the target or reducing the technical/read safety maxima. Full backup
round-trip support at the safety maxima is not claimed while the separate
backup-over-10-MiB defect remains open.

## Post-B-03 recalibration and recommendation

_Measured: 2026-08-16T13:44:05.043Z_

**APPROVE 150 chapters / 1,500 flashcards** for owner review as the proposed
personal-use operational capacity. B-03 does not implement that production
limit.

The manager now derives unit/card projections in O(U + F) and independently
paginates both lists at 25 chapters and 50 flashcards. Exactly 75 content rows
are mounted at once. All four named language/profile cases pass the unchanged
B-02 TTI, long-task, DOM, row, focusable, AX-tree, memory, and overflow budgets.

### Post-B-03 measurements

Timing values are median (minimum–maximum) across three samples. Other values
are medians and were invariant across each scenario's three samples.

| Profile / language | TTI | Longest long task | Cumulative long tasks | DOM | Rows | Focusables | AX nodes | Heap delta | Height | Overflow |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Desktop / English | 82 ms (69–85) | 0 ms (0–0) | 0 ms (0–0) | 731 | 25 / 50 | 233 | 1,516 | 4,024,676 B | 7,321 px | 0 px |
| Desktop / Greek | 130 ms (109–137) | 0 ms (0–0) | 0 ms (0–0) | 731 | 25 / 50 | 233 | 1,566 | 4,082,876 B | 8,682 px | 0 px |
| Constrained / English | 350 ms (306–358) | 0 ms (0–54) | 0 ms (0–54) | 731 | 25 / 50 | 233 | 1,452 | 2,762,152 B | 20,810 px | 0 px |
| Constrained / Greek | 348 ms (344–350) | 55 ms (52–61) | 55 ms (52–61) | 731 | 25 / 50 | 233 | 1,457 | 2,828,308 B | 20,884 px | 0 px |

All 12 samples navigated both pagers, changed the visible subset, retained 25
chapter/50 card rows, and focused the affected result heading. English used
pages 2/6 and 2/30; Greek exposed the equivalent localized current-page state.

| Profile | Chapter import | Flashcard import |
| --- | ---: | ---: |
| Desktop | 118 ms (105–120) | 110 ms (98–126) |
| Constrained | 267 ms (265–279) | 287 ms (262–303) |

Backup parse/read/export/serialization and exact-fixture offline reload remain
**PASS**. The serialized backup remains 458,281 UTF-8 bytes.

### Before / after

| Metric | Before B-03 | After B-03 (worst language median) |
| --- | ---: | ---: |
| Desktop TTI | 327 ms | 130 ms |
| Constrained TTI | 1,150 ms | 350 ms |
| Longest task | 113 / 583 ms | 0 / 55 ms |
| Cumulative tasks | 113 / 926 ms | 0 / 55 ms |
| Manager DOM | 14,894 | 731 |
| Mounted rows | 1,650 | 75 |
| Focusables | 4,956 | 233 |
| AX nodes | 26,047–29,186 | 1,452–1,566 |
| Manager height | 189,251–330,771 px | 7,321–20,884 px |
| Horizontal overflow | 0 px | 0 px |

### Safety-max compatibility smoke

A separate one-sample desktop smoke at 10,000 chapters / 100,000 flashcards
opened the manager in 299 ms, recorded a 99 ms longest task and 177 ms
cumulative long tasks, and mounted 731 DOM nodes, 25 chapter rows, 50 card rows,
233 focusables, and 1,516 AX nodes with zero horizontal overflow. Chapter page
2/400 and flashcard page 2/2,000 both navigated and focused correctly. This
demonstrates bounded read/projection behavior on the named host, not operational
support at the technical safety maxima. Opening an editor still intentionally
uses the existing full native chapter select; full safety-max editing was not
claimed.

**PD-CAPACITY STATUS AT RECALIBRATION: READY FOR OWNER APPROVAL**

## Pre-B-03 calibration and decision

_Measured: 2026-08-16T12:53:24.287Z_

**DO NOT APPROVE** 150 chapters / 1,500 flashcards as the current operational
personal-use limit.

The candidate is functional: it renders quickly, imports successfully, has no
horizontal overflow in either language, serializes well below the backup limit,
and remains available after an offline cached-route reload. It is not
comfortably supported by the current unpaginated manager. All four
language/profile cases mount 1,650 rows, 14,894 manager DOM nodes, and 4,956
focusable controls. The manager AX tree contains 26,047–29,186 nodes. These
figures materially exceed the unchanged B-02 budgets and make deep keyboard and
assistive-technology traversal impractical.

## Method

The existing B-02 Playwright harness ran against the production build on dirty
HEAD `22e81596b592fc4dc299479e3ef4cbf7e7a98f89`. The deterministic fixture has
150 chapters and 1,500 flashcards (ten cards per chapter) with fingerprint
`sha256:77169c7ad83a18cb7da6031c044f1e5ea5eb13d0923d569b8288e42d65d45f34`.
Each named profile received one warm-up followed by three measured English and
three measured Greek manager samples. Import timings also use three measured
samples per profile.

Host: Windows `10.0.26200`, 13th Gen Intel Core i7-13620H, 16 logical processors,
16,857,817,088 bytes RAM (5,285,564,416 bytes free at start), Node 24.16.0,
Playwright 1.62.1, headless Chromium 151.0.7922.34. The constrained profile is
390 × 844, DPR 2, touch/mobile emulation, and 4× CPU throttling. It is not a
physical low-end-device result.

## Manager measurements

Timing values are median (minimum–maximum) across three samples. Other values
are medians; invariant counts were identical in all three samples.

| Profile / language | TTI | Longest long task | Cumulative long tasks | DOM | Rows (chapter/card) | Focusables | AX nodes | Heap delta | Height | Overflow |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Desktop / English | 327 ms (315–368) | 0 ms (0–114) | 0 ms (0–114) | 14,894 | 150 / 1,500 | 4,956 | 27,686 | 16,829,148 B | 189,251 px | 0 px |
| Desktop / Greek | 292 ms (239–333) | 113 ms (0–138) | 113 ms (0–138) | 14,894 | 150 / 1,500 | 4,956 | 29,186 | 16,839,320 B | 230,079 px | 0 px |
| Constrained / English | 1,084 ms (1,071–1,131) | 570 ms (560–577) | 841 ms (824–868) | 14,894 | 150 / 1,500 | 4,956 | 26,047 | 4,393,244 B | 330,697 px | 0 px |
| Constrained / Greek | 1,150 ms (1,120–1,242) | 583 ms (577–636) | 926 ms (840–952) | 14,894 | 150 / 1,500 | 4,956 | 26,050 | 4,471,376 B | 330,771 px | 0 px |

The first manager action is focus index 1, and the bounded five-Tab sample
remained inside the manager in all 12 samples. The final manager action is focus
index 4,956 and the established `deepActionPractical` check is false in all
samples. Greek did not cause horizontal overflow or unusually worse TTI, but it
increased desktop manager height and AX-tree size.

## Import, backup, and offline evidence

| Profile | Chapter import | Flashcard import |
| --- | ---: | ---: |
| Desktop | 93 ms (85–148) | 277 ms (275–289) |
| Constrained | 350 ms (331–446) | 1,271 ms (597–1,429) |

The timing boundary remains file-input activation through committed status and
rendered count.

- Runtime parse: **PASS**.
- Persist/read: **PASS** at 150 / 1,500.
- `exportBackup()`: **PASS** with two settings.
- `serializeBackup()`: **PASS**, 458,281 UTF-8 bytes (about 4.4% of 10 MiB).
- Production service worker, cached `/#/learn`, offline reload, and exact local
  counts: **PASS**.

## B-02 budget comparison

Worst language median is used where the language results differ.

| Metric | Desktop | Constrained/mobile |
| --- | --- | --- |
| TTI | **PASS** — 327 ms ≤ 2,000 ms | **PASS** — 1,150 ms ≤ 5,000 ms |
| Longest long task | **PASS** — 113 ms ≤ 250 ms | **FAIL** — 583 ms > 500 ms |
| Cumulative long tasks | **PASS** — 113 ms ≤ 750 ms | **PASS** — 926 ms ≤ 2,000 ms |
| Mounted DOM | **FAIL** — 14,894 > 2,500 | **FAIL** — 14,894 > 2,500 |
| Mounted rows | **FAIL** — 1,650 > 100 | **FAIL** — 1,650 > 100 |
| Visible focusables | **FAIL** — 4,956 > 350 | **FAIL** — 4,956 > 350 |
| Manager AX tree | **FAIL** — 29,186 > 5,000 | **FAIL** — 26,050 > 5,000 |
| JS heap delta | **PASS** — 16,839,320 B < 100 MiB | **PASS** — 4,471,376 B < 100 MiB |

## Pre-B-03 PD-CAPACITY proposal

The proposed operational limit of 150 / 1,500 is **not ready for owner
approval** on the current manager implementation. The technical compatibility
and read-safety maxima remain 10,000 chapters / 100,000 flashcards.

If a lower pre-B-03 calibration is required, the next evidence-derived point is
**9 chapters / 90 flashcards**: it preserves the measured 1:10 mix while keeping
the combined mounted rows below the B-02 100-row budget. The current exact
three-controls-per-row relationship projects 303 focusables at that point,
below the 350 budget. This is a next measurement point, not an approved limit.
The preferable product path is to complete B-03 bounded rendering and rerun
150 / 1,500, because lowering stored personal-use capacity does not address the
manager's unbounded DOM, keyboard, and AX-tree design.

No production limit, safety maximum, schema, translation, backup validator, or
PWA behavior changed during this calibration.
