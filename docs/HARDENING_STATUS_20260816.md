# StudyApp hardening status — 2026-08-16

## Checkpoint

- Baseline: `c213ec23fa0c11546862c98c1311a8ee4fa863c5`
- PR #130: merged
- Scope completed through: B-03 and its cross-platform responsive CI remediation

## Completed work

- A-01
- A-02
- A-03
- B-01
- navigation scroll/focus fix
- B-02 practical-capacity contract
- personal-use capacity calibration and owner decision
- B-03 indexed projections and bounded accessible pagination
- cross-platform narrow/200%-text overflow remediation

## Validated baseline

- TypeScript: PASS
- Unit tests: 267/267 PASS
- E2E tests: 28/28 PASS
- Linux CI: PASS, including 28/28 E2E
- Production build: PASS (known large-chunk warning only)
- `git diff --check`: PASS

## Capacity decision

The owner-approved supported personal-use operational capacity is 150 chapters
and 1,500 flashcards. Production enforcement is **not yet implemented**.

Technical/read compatibility safety maxima remain 10,000 chapters and 100,000
flashcards. Safety-maximum operational usability and full backup portability at
those maxima are not claimed.

## Open work

- Implement operational enforcement for new writes, additions and imports at
  150 chapters / 1,500 flashcards while preserving compatible existing data.
- Resolve the open backup-over-10-MiB serialization/import compatibility defect.
- Complete B-04; the broader `PERF-001` finding is not fully closed while this
  import-throughput scope remains outstanding.
- Complete C-01 and C-02.
- Run the next focused re-audit/checkpoint.

## Planned order

1. Operational write/import enforcement for 150 / 1,500 with compatibility.
2. Backup serialization/import compatibility reconciliation.
3. B-04.
4. C-01.
5. C-02.
6. Focused re-audit/checkpoint.

This file is a current-state checkpoint, not a replacement remediation plan.
