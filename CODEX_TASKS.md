# Codex Task Queue

_Last updated: 2026-07-28_

## v1 status

The v1 task queue is closed. The completed release sequence was:

1. secure local file handling;
2. safe backup restore;
3. stable flashcard IDs;
4. final v1 release gate.

Do not add further work to the v1 release branch or combine v1.1 improvements
with the release gate.

## Future task source

All remaining work is listed in
[`V1_1_BACKLOG.md`](V1_1_BACKLOG.md). When v1.1 work is explicitly started:

1. read `LICENSE`, `AGENTS.md`, `VISION.md`, and the selected backlog item;
2. use one focused branch and PR;
3. document data-safety impact;
4. add focused regression tests;
5. run:

```bash
npm ci
npm run typecheck
npm test
npm run build
```
