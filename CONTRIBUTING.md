# Contributing

StudyApp is source-visible but proprietary. Public visibility does not grant permission to reuse, redistribute, relicense, or copy the project outside this repository.

## Working model

Use small, focused branches and PRs.

Recommended branch names:

- `fix/review-queue`
- `fix/quiz-answer-lock`
- `docs/backup-safety`
- `ci/add-github-actions`
- `feature/file-hashing`

## Before starting

Read:

- `README.md`
- `VISION.md`
- `AGENTS.md`
- `AUDIT.md`
- `ROADMAP.md`
- `BACKUP_AND_DATA_SAFETY.md` when touching backups, files, or storage
- `DATA_MODEL.md` when touching persistence, imports, review progress, or local files

## Pull request rules

- One issue or roadmap item per PR.
- Avoid unrelated refactors.
- Keep UI copy consistent with the local-first model.
- Do not introduce backend services, accounts, analytics, telemetry, or cloud sync without explicit owner approval.
- Add tests for bug fixes and parser/data-model changes where practical.
- Update documentation when behavior changes.

## Required checks

Run these before requesting review when practical:

```bash
npm test
npm run typecheck
npm run build
```

If a PR is documentation-only, note that tests were not run.

## Data-safety checklist

For changes touching IndexedDB, backup, restore, file upload, deletion, imports, or review progress, answer these in the PR:

- Does this merge, replace, or delete user data?
- Is there a confirmation before destructive action?
- Is runtime validation included for external data?
- Are identifiers and relationships checked?
- Are multi-record writes wrapped in a transaction where needed?
- Does backup/export wording match actual behavior?

## Review expectations

A reviewer should check:

- scope control;
- local-first and privacy boundaries;
- data lifecycle and deletion behavior;
- accessibility of changed UI;
- tests and command results;
- documentation updates when required.
