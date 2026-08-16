# StudyApp practical-capacity contract

Status: **B-02 baseline retained; B-03 evidence and owner decision recorded**
Finding: the `PERF-001` manager render/work portion is **REMEDIATED AND
VERIFIED**. The broader finding remains open while B-04 is outstanding.

The measurements below preserve the pre-B-03 unpaginated baseline. The
post-B-03 150/1,500 result, safety-max compatibility smoke, and owner decision
are recorded in `PERSONAL_USE_CAPACITY_CALIBRATION.md`. The separate B-04
spreadsheet identity-generation/import-throughput scope is not implemented
here.

## Post-B-03 operational-capacity decision

_Status recorded: 2026-08-16, after the PR #130 hardening checkpoint._

B-02 demonstrated that the unpaginated manager failed practical rendering and
accessibility budgets well below the technical safety maxima. B-03 replaced the
repeated cross-filtering path with O(U + F)-style derived projections and added
independent bounded pagination. The manager now mounts 25 chapter rows and 50
flashcard rows, for at most 75 content rows at one time.

The post-B-03 150-chapter/1,500-flashcard recalibration passes every established
B-02 engineering budget on the named desktop and constrained profiles. Based on
that evidence, the owner has **APPROVED 150 chapters and 1,500 flashcards as the
supported personal-use operational capacity**.

This is product and support policy, not current production enforcement.
Enforcement for new writes, additions and imports remains to be implemented.
Existing compatible data above the operational target must remain readable up
to the unchanged technical/read compatibility safety maxima of 10,000 chapters
and 100,000 flashcards.

### Headline before/after evidence at 150 / 1,500

| Metric | Before B-03 | After B-03 |
| --- | ---: | ---: |
| Manager DOM | 14,894 | 731 |
| Mounted content rows | 1,650 | 75 |
| Focusable controls | 4,956 | 233 |
| Manager AX tree | about 26,000-29,000 nodes | about 1,500 nodes |
| Worst desktop TTI | 327 ms | 130 ms |
| Worst constrained TTI | 1,150 ms | 350 ms |

**All established B-02 post-B-03 budgets: PASS.** Safety-maximum operational
usability is not claimed. The separate backup-over-10-MiB round-trip defect
remains open, so full backup portability at the safety maxima is also not
claimed.

## Historical B-02 scope and decision boundary

The B-02 contract separated three different concepts:

1. **Current safety maximum** — the largest collection accepted by the
   parser/read boundary.
2. **Observed B-02 baseline** — measurements from the then-current unpaginated
   manager on the named profiles below.
3. **Proposed operational budget** — an engineering target for B-03. At this
   stage it was not approved product policy or a universal browser/device
   threshold.

No parser/import limit was lowered by B-02. Existing valid content remained
subject to the production validators. The later owner-approved operational
capacity still requires a separate enforcement task and bilingual product copy.

## Authoritative safety maximum

| Collection | Production constant | Value |
| --- | --- | ---: |
| Practice chapters | `MAX_IMPORTED_UNITS` | 10,000 |
| Flashcards | `MAX_IMPORTED_FLASHCARDS` | 100,000 |

Both constants come from
`src/features/content-import/importedContent.ts`. Backup aliases import those
same constants; the generator also imports them directly. The permanent drift
test deliberately asserts the current numerical contract once and fails if the
production values change unexpectedly.

B-01 enforcement is unchanged. Exact maxima remain accepted and maximum plus
one remains rejected by the existing repository/backup tests.

## Reproduction commands

```bash
npm run benchmark:capacity:smoke
npm run benchmark:capacity
```

The smoke command verifies instrumentation with 25% desktop/English and
constrained/Greek manager scenarios, a 25% supported import, and the offline
PWA procedure. The baseline command runs the complete named-profile matrix.
Neither command runs in ordinary `npm test` or `npm run test:e2e`.

The per-scenario watchdog defaults to 30,000 ms and can be changed explicitly:

```text
CAPACITY_BENCHMARK_WATCHDOG_MS=<positive milliseconds>
```

Machine-readable results are generated under the ignored
`test-results/capacity-benchmark/` directory. Large fixtures are generated in
memory or in an explicitly supplied temporary directory and are not committed.

## Deterministic fixtures

Generator version: `1.0.0`.

| Fixture | 25% | 50% | 100% |
| --- | --- | --- | --- |
| Chapter-heavy | 2,500 chapters / 2,500 cards | 5,000 / 5,000 | 10,000 / 10,000 |
| Flashcard-heavy | 100 chapters / 25,000 cards | 100 / 50,000 | 100 / 100,000 |
| Mixed | 2,500 chapters / 25,000 cards | 5,000 / 50,000 | 10,000 / 100,000 |

IDs, ordering, strings, and card-to-unit distribution are stable and contain no
wall-clock or random input. Each manifest records the shape, percentage,
counts, generator version, safety maxima, and a SHA-256 semantic fingerprint.
The accepted 100% mixed fixture fingerprint for this run was:

```text
sha256:9b6771e1d13b5a219be3c6ef5aa8d6bb17e06f033fa7ccfeefaf709be7fe58c8
```

## Named environment and profiles

Accepted baseline timestamp: `2026-08-16T11:58:07.351Z` (artifact timestamp;
UTC).

Host metadata captured by the harness:

- OS: Windows (`win32 10.0.26200`)
- CPU: 13th Gen Intel(R) Core(TM) i7-13620H
- Logical processors: 16
- RAM: 16,857,817,088 bytes (about 15.7 GiB)
- Free RAM at baseline start: 4,881,620,992 bytes
- Node: 24.16.0
- npm: 11.13.0
- Playwright: 1.62.1
- Chromium: 151.0.7922.34
- Mode: headless

### `desktop-reference`

- 1280 × 900 viewport
- device scale factor 1
- no CPU throttle
- no touch/mobile emulation

### `constrained-mobile-emulation`

- 390 × 844 viewport
- device scale factor 2
- 4× Chromium CPU throttling
- touch and mobile emulation enabled
- no memory limit emulated

This is CPU-throttled desktop Chromium, **not a physical low-end/mobile device**.
Physical-device and physical screen-reader validation remain separate.

## Measurement methodology

- **Warm-up:** a 10-chapter/100-card render precedes each named profile.
- **Manager timing start:** immediately before HashRouter navigation to
  `/#/learn`.
- **First meaningful render:** first insertion of the manager region.
- **First action insertion:** first enabled manager action appearing in the DOM.
- **Time to interaction (TTI):** expected chapter/card counts are mounted, an
  enabled manager action is visible, and two animation frames have completed.
  This is the first point at which the inserted action is treated as usable.
- **Import time:** actual CSV file-input activation through repository commit,
  visible success status, and the new mounted count. Fixture generation is
  outside the timing boundary.
- **Long tasks:** `PerformanceObserver` entries of type `longtask` between route
  start and TTI. Unsupported runtimes report `UNSUPPORTED`.
- **DOM:** all nodes under `#practice-content`, chapter/card rows, and visible
  focusable controls.
- **Memory:** JS heap before/after via Chromium CDP
  `Performance.getMetrics`. It is a point-in-time JS-heap delta, not a peak or
  an emulated device memory limit.
- **Keyboard:** deterministic focusable-control count, one-based index to the
  first and last actions, plus an actual bounded five-Tab sample.
- **Accessibility:** automated Chromium CDP
  `Accessibility.queryAXTree` evidence for the manager subtree. It is not an
  assistive-technology certification.
- **Offline:** production build and real service-worker control, online route
  entry, context switched offline, cached route reload, and IndexedDB count
  verification.
- **Samples:** mixed 25% and 50% use three samples per profile; 100% uses one
  sample because it is extremely expensive; heavy-shape and import cases use
  two samples. Representative Greek cases use one sample per profile. A timeout
  is retained as evidence rather than retried with a longer limit.

## Observed B-02 unpaginated baseline

### Mixed manager matrix — English

| Profile | Scale | Samples | Result | TTI median (min–max) | Longest task median | DOM nodes | Focusable controls | AX nodes | JS heap delta median |
| --- | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: |
| Desktop | 25% | 3 | Measured | 9,091 ms (8,570–9,388) | 5,333 ms | 247,544 | 82,506 | 460,086 | 201,106,064 B |
| Desktop | 50% | 3 | Timeout | >30,000 ms in all samples | unavailable | unavailable | unavailable | unavailable | unavailable |
| Desktop | 100% | 1 | Timeout | >30,000 ms | unavailable | unavailable | unavailable | unavailable | unavailable |
| Constrained/mobile | 25% | 3 | Measured | 22,999 ms (20,951–26,087) | 11,645 ms | 247,544 | 82,506 | 434,098 | 218,232,288 B |
| Constrained/mobile | 50% | 3 | Timeout | >30,000 ms in all samples | unavailable | unavailable | unavailable | unavailable | unavailable |
| Constrained/mobile | 100% | 1 | Timeout | >30,000 ms | unavailable | unavailable | unavailable | unavailable | unavailable |

At 25%, the first manager/action nodes were inserted early, but the action was
not treated as usable until the multi-second main-thread work and two frames
completed. This distinction prevents DOM insertion from being mislabeled as
interaction readiness.

### Scaling-source comparison — English, 25%

| Profile | Fixture | Samples | TTI median (min–max) | Longest task | DOM | Focusables | AX nodes | Heap delta |
| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Desktop | Chapter-heavy | 2 | 956 ms (924–989) | 275 ms | 45,044 | 15,006 | 95,086 | 44,863,538 B |
| Desktop | Flashcard-heavy | 2 | 3,877 ms (3,289–4,466) | 2,214 ms | 225,944 | 75,306 | 402,486 | 171,619,986 B |
| Constrained/mobile | Chapter-heavy | 2 | 4,219 ms (3,692–4,747) | 1,385 ms | 45,044 | 15,006 | 91,598 | 18,862,370 B |
| Constrained/mobile | Flashcard-heavy | 2 | 18,275 ms (12,615–23,935) | 13,670 ms | 225,944 | 75,306 | 377,397 | 191,034,714 B |

Both dimensions matter. Flashcard row creation dominates at 25,000 cards;
mixed data adds repeated per-chapter full-card filtering and further increases
TTI and long-task burden.

### Supported CSV import path — 25%

| Profile | Fixture | Samples | Chapter import | Flashcard import |
| --- | --- | ---: | --- | --- |
| Desktop | Chapter-heavy (2,500/2,500) | 2 | 453–547 ms (median 500) | 492–521 ms (median 507) |
| Desktop | Flashcard-heavy (100/25,000) | 2 | 160–200 ms (median 180) | 4,893–5,642 ms (median 5,268) |
| Constrained/mobile | Chapter-heavy (2,500/2,500) | 2 | 2,217–2,708 ms (median 2,463) | 3,165–3,450 ms (median 3,308) |
| Constrained/mobile | Flashcard-heavy (100/25,000) | 2 | 445 ms for the completed sample | 23,330 ms for one sample; second sample timed out |

Import measurements include CSV parsing, sequential card hashing, IndexedDB
commit, success status, and the current unbounded manager rerender.

### English/Greek and narrow layout

- Desktop Greek mixed 25%: 7,914 ms TTI, 485,086 AX nodes, 82,506
  focusables (one representative sample).
- Constrained/mobile Greek mixed 25% baseline: 28,041 ms TTI, 434,101 AX
  nodes, 82,506 focusables (one representative sample).
- Repeated smoke narrow/Greek check: 26,981 ms TTI, zero horizontal overflow,
  manager height 5,529,593 px in an 844 px viewport.
- Repeated smoke desktop/English check: zero horizontal overflow and manager
  height 3,139,970 px in a 900 px viewport.

The languages produce the same row/control burden. Greek text changes tree and
layout size but does not change the underlying unbounded work. No translation
was changed.

## Safety-maximum correctness observation

The 100% mixed fixture produced this result:

| Check | Result |
| --- | --- |
| Runtime parser accepts 10,000/100,000 | PASS |
| Persisted settings can be read and parsed | PASS |
| `exportBackup()` returns a validated in-memory backup | PASS |
| `serializeBackup()` produces a user-downloadable backup | **FAIL** |

`serializeBackup()` rejected the backup as larger than the 10 MB limit. Even
compact JSON was 18,259,179 bytes; the production serializer uses indented JSON
and therefore cannot represent this valid 100% fixture within 10 MB.

This is a newly observed correctness/contract inconsistency, not a performance
timeout. B-02 does **not** weaken the backup validator or change either limit.
Read/export compatibility at safety maximum is therefore only partial, and a
separate remediation decision is required before claiming full backup
portability at the parser maxima.

## Offline/cached-route evidence

Result: **PASS** on the named desktop environment.

The harness served the production PWA, waited for a real installed and
controlling service worker, stored a valid 10-chapter/100-card fixture, opened
`/#/learn` online, switched the browser context offline, reloaded the cached
route, and verified both the app shell and IndexedDB counts. This does not test
update activation/reload safety (`PWA-001`) and does not redesign the PWA.

## Accessibility-capacity evidence

The actual five-Tab sample remained within the manager, so ordinary keyboard
movement still functions. That does not make deep content reachable in
practice: the representative final action is at focus index 82,506 for mixed
25%, 75,306 for card-heavy 25%, and 15,006 for chapter-heavy 25%.

Automated AX-tree evidence likewise reaches hundreds of thousands of nodes at
mixed 25%. No physical screen reader was used. Therefore:

- automated accessibility-tree evidence: **MEASURED**;
- bounded keyboard behavior: **MEASURED**;
- deep keyboard/screen-reader traversal at 25%: **OPERATIONALLY IMPRACTICAL**;
- physical screen-reader validation: **NOT PERFORMED**.

## Observed B-02 practical capacity

- **Desktop reference:** none of the measured mixed 25/50/100 levels meets a
  practical interaction/accessibility contract. Mixed 25% eventually renders,
  but 9.091-second median TTI, a 5.333-second long task, 247,544 DOM nodes, and
  82,506 focusables are not operationally supportable.
- **Constrained/mobile emulation:** none of the measured mixed levels is
  practical. Mixed 25% takes a 22.999-second median and has an 11.645-second
  median longest task; 50% and 100% time out.
- **StudyApp-wide recommendation:** practical mixed capacity is **below 25% of
  the current safety maxima**, but this matrix does not justify guessing an
  exact lower number. B-03 should first bound mounted work, then rerun the same
  matrix plus lower-scale calibration.

Technically rendering a fixture is not sufficient for supported capacity;
keyboard and accessibility-tree burden are part of this conclusion.

## Established B-03 engineering budgets (defined during B-02)

These named-profile targets were derived from the B-02 baseline and required
owner sign-off at that stage. They must not be added as host-sensitive
assertions to ordinary CI.

| Metric | Desktop target | Constrained/mobile target | Basis |
| --- | ---: | ---: | --- |
| Manager TTI | ≤2,000 ms | ≤5,000 ms | Material improvement over 9.1/23.0 s while retaining margin above small warm-up behavior |
| Longest long task | ≤250 ms | ≤500 ms | Eliminates the observed multi-second lockups; engineering target, not a universal perception claim |
| Cumulative long tasks | ≤750 ms | ≤2,000 ms | Bounds blocked time during route entry |
| Mounted manager DOM | ≤2,500 nodes | ≤2,500 nodes | About 1% of current mixed-25 DOM and feasible with bounded pages |
| Mounted rows | ≤100 combined | ≤100 combined | 50 chapter + 50 card rows is a concrete pagination target |
| Visible focusables | ≤350 | ≤350 | Keeps the current three-actions-per-row design within a bounded keyboard path |
| Manager AX tree | ≤5,000 nodes | ≤5,000 nodes | Roughly bounds automated tree size after pagination; still requires physical AT validation |
| JS heap delta | ≤100 MiB | ≤100 MiB | Less than half the observed mixed-25 delta; CDP point-in-time metric only |
| 2,500/2,500 import phase | ≤2,000 ms | ≤5,000 ms | Current measured chapter-heavy path demonstrates feasibility |
| 100/25,000 card import | ≤8,000 ms | ≤15,000 ms | Desktop currently fits; constrained path needs manager/hash improvement |
| Offline route entry | Shell and local content reachable; same TTI budget | Same | Preserves measured local-first PWA behavior |

The DOM, row, focusable, and AX budgets are the central B-03 contract. Import
hashing may require a later separately scoped task if pagination alone cannot
meet the import target.

## Historical B-02 PD-CAPACITY recommendation

The recommendation and status below record the B-02 decision boundary before
B-03 and the later owner decision. They are retained as historical evidence.

- Safety maximum: retain 10,000 chapters / 100,000 flashcards for parser/read
  compatibility; do not present it as supported operational capacity.
- Recommended operational capacity now: no measured mixed level at or above
  25% is supportable; exact lower capacity remains **NOT DETERMINED**.
- Recommended future import cap: none yet. Do not lower imports in B-02/B-03
  without a lower-scale post-B-03 benchmark and explicit owner approval.
- Compatibility: preserve existing valid data reads and in-memory export;
  separately resolve the 10 MB serialization incompatibility.
- Confidence: high for this host/current Chromium and current implementation;
  moderate for constrained-device inference.
- Limitations: no physical mobile device, memory-limited environment, Firefox,
  WebKit, physical screen reader, or peak-process-memory measurement.

**PD-CAPACITY STATUS: READY FOR OWNER SIGN-OFF**

## Historical B-02 required next validation

The 150/1,500 recalibration and safety-max smoke requested after B-02 have been
completed; their results and the owner decision are recorded at the top of this
document. The historical full-matrix request below is retained and is not used
to claim safety-maximum operational usability.

After B-03, rerun both commands unchanged. The 25/50/100 mixed matrix must be
measured again against the approved budgets, with lower-scale calibration if an
exact operational capacity or future import cap is desired. `PERF-001` remains
open until that work and owner review are complete.
