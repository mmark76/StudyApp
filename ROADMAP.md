# StudyApp Roadmap

_Last updated: 2026-08-19_

## v1.0.0 — Complete

The v1 roadmap ended at the release gate. Completed work includes:

1. stable review queues, quiz answer locking, and CSV header validation;
2. intentional direct source/split-PDF deletion choices and content hashing;
3. a central safe local-file policy;
4. strict previewed transactional backup restore;
5. stable content-based flashcard import IDs;
6. user-controlled PWA updates;
7. final navigation/documentation alignment and release verification.

The released v1 study workflow is local-first, browser-based, offline-ready, and
without accounts, cloud storage, cloud sync, analytics, advertising, or
telemetry.

## v1.0.0 release-hardening follow-up — Complete

A focused post-gate follow-up added explicit local-storage/non-backup notices and
download actions for generated split PDFs. It did not add content generation,
cloud storage, authentication, billing, or a new persisted data model.

## Post-v1 UI consolidation — Stable baseline

The current production information architecture has been simplified to:

```text
Home → Sources → Practice → AI Studio
```

with `Split PDF Tool` and `Important Info` as secondary navigation.

`Sources` groups the existing Library and Structured Study areas. `Practice`
groups practice-content management, flashcards, review, quiz and progress. `AI
Studio` is the entry point for the available StudyApp AI Assistant and planned
AI modes.

The owner-approved completed UI/UX baseline is preserved at:

- branch: `stable/ui-final-2026-08-19`;
- commit: `e705086af2f393e70a345f2159689446f2e41871`.

This checkpoint is the reference stable experience while new UX directions are
tested separately.

## Post-v1 AI Assistant simplification — Current stable behaviour

The repository includes a two-screen AI Assistant:

1. **Study with ChatGPT** opens the approved dedicated StudyApp AI Assistant
   Custom GPT through a normal external link;
2. **Other AI options** shows the same available link and keeps ChatGPT App /
   MCP and integrated StudyApp AI visibly inactive.

StudyApp does not prepare or copy a prompt, read the Library or IndexedDB, import
files into the Assistant, transfer local study material, make an OpenAI API or
Cloud Core request, operate credits, or charge the user. The user chooses and
shares material directly in ChatGPT.

The current and future boundary is defined in
[`docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md`](docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md).

## Next roadmap phase

Future work should proceed through separate, focused branches and PRs. The stable
UI baseline should remain recoverable while experiments are evaluated.

### Track A — Local-first reliability

Continue the existing v1.1 backlog for:

- recursive split-PDF relationship safety;
- storage quota, large-PDF, duplication, and cancellation handling;
- accurate study-session lifecycle;
- persistence-failure recovery;
- complete local-file export/import;
- browser integration and accessibility coverage;
- deterministic build and deployment hardening.

### Track B — AI Assistant handoff quality

Continue focused quality work for the current external handoff:

- test screen-reader output, 200% zoom, narrow layouts, and PWA updates while
  the dialog is open;
- keep the approved destination validation and safe external-link attributes
  covered by automated tests;
- preserve concise, equivalent English and Greek availability and privacy copy;
- keep future remote modes visibly distinct and inactive.

### Track C — Production Cloud Core and AI design

Production AI must begin as a separately reviewed feature, not as an
incremental activation of retained client code. First complete design and review
for:

- authentication and authorisation;
- exact request/response contracts;
- user-selected and confirmed payloads;
- prompt-injection and malicious-document handling;
- provider abstraction and secrets management;
- rate, size, concurrency, and cost limits;
- task idempotency, cancellation, timeout, and retry semantics;
- logging, retention, deletion, and incident response;
- legal and privacy updates;
- server-authoritative credit and payment design.

### Track D — Real credits and payments

Real billing is a separate high-risk workstream. It requires:

- a legal seller and payment processor;
- server-authoritative balances and immutable ledger entries;
- idempotent purchase, reservation, settlement, release, refund, and
  reconciliation;
- maximum-cost disclosure before confirmation;
- explicit treatment of failed, timed-out, cancelled, and partial tasks;
- receipts, taxes, refunds, disputes, account recovery, and device transfer;
- security and privacy review plus browser-to-service integration tests.

### Track E — Workspace BETA UX experiment

Workspace BETA is the next distinct UI/UX experiment. It should not be built by
rewriting the stable shell in place.

#### Phase E1 — UI/UX prototype only

Create a separate beta route and evaluate a simultaneous three-panel workspace,
broadly:

```text
Sources | Workspace / Practice | AI Studio
```

The first phase should focus on:

- panel proportions and visual hierarchy;
- compact header treatment and whether the beta needs a footer at all;
- scrolling and viewport use;
- panel collapse/expand or resizing behaviour;
- laptop, tablet and mobile adaptation;
- keyboard order, focus visibility and 200% zoom;
- whether the side-by-side model is genuinely easier and faster to use.

Phase E1 must remain presentation-first: no new cross-panel data flow, no data
migration, no automatic source transfer, no remote AI activation and no MCP merely
to make the prototype appear functional. Placeholders and clearly labelled beta
states are acceptable.

#### Phase E2 — selective local connectivity

Only after Phase E1 is explicitly approved, connect one panel interaction at a
time to existing local StudyApp state. Preserve the existing storage model unless
a separate data-model proposal is approved. Each connection should have focused
behaviour and accessibility tests.

#### Phase E3 — source-grounded AI workspace

Only after the local workspace interaction model is proven should remote AI,
source-grounded generated outputs, citations or MCP be considered. Those remain
subject to the separate security, privacy, authentication, cost and AI gates in
`AGENTS.md` and the AI boundary document.

## Historical-document rule

Historical release documents such as `RELEASE_NOTES_v1.md`,
`RELEASE_CHECKLIST.md`, and `AUDIT.md` may preserve the facts and scope of the v1
release gate. Living documents must describe current `main` and distinguish:

1. the released local-first workflow;
2. the stable Sources / Practice / AI Studio information architecture;
3. the current external StudyApp AI Assistant handoff;
4. Workspace BETA as a separate experiment;
5. planned production cloud-assisted capabilities.

## Work selection rule

Remaining reliability work is tracked in [`V1_1_BACKLOG.md`](V1_1_BACKLOG.md).
Select one focused item per branch/PR, document data-safety and privacy impact,
and preserve the boundaries in [`AGENTS.md`](AGENTS.md). Workspace BETA work
should use separate focused branches/PRs and must not silently expand from UI/UX
prototype into persistence or remote-service work.
