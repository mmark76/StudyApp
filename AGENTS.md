<!-- BEGIN SHARED GLOBAL CODEX RULES v1.0.0 -->

# Global Codex Working Rules

Global Codex Rules Version: 1.0.0

## 1. Scope

These are my default working rules for Codex across all repositories and projects.

They define general Git safety, protection of existing work, change discipline, verification, security, and completion behavior.

Repository-specific and more deeply nested instructions may specialize or override these defaults when they conflict.

Do not place project-specific architecture, domain rules, product requirements, engineering assumptions, UI rules, or repository-specific commands in this global ruleset.

## 2. Instruction Priority

Apply instructions according to authority and specificity.

In general:

1. Direct system, developer, and user instructions for the current task.
2. The most specific applicable nested project instructions.
3. Repository-specific instructions.
4. These shared global defaults.

A more specific valid instruction overrides a broader default when they conflict.

Do not silently resolve a material ambiguity involving safety, scope, user work, data, or destructive operations.

If the correct action remains materially ambiguous, stop and report `NEEDS_DECISION`.

## 3. Git Synchronization Preflight

Before modifying files in a Git repository, determine the actual Git state.

When a remote is available:

1. Identify the repository path.
2. Identify the current branch.
3. Record the current `HEAD`.
4. Run `git fetch` for the relevant remote, normally `origin`.
5. Identify the relevant remote-tracking branch and SHA.
6. Inspect the working tree for:
   - modified files,
   - staged files,
   - untracked files.
7. Determine whether the relevant local branch is:
   - synchronized,
   - ahead,
   - behind,
   - diverged,
   - or has no usable upstream.

Never assume the local checkout is current.

`git fetch` updates remote-tracking information only.
It is not authorization to modify, merge, discard, or rewrite local work.

## 4. Git State Handling

### Clean and synchronized

Proceed normally.

### Clean but behind

Do not automatically merge or rebase simply because the local branch is behind.

Use the correct verified task base.

Where practical, prefer isolated task work based on the intended current remote state rather than modifying unrelated local history.

### Ahead / unpushed commits

Preserve existing commits.

Do not discard, rewrite, hide, or overwrite them.

Determine whether they belong to the current task before proceeding.

### Dirty working tree

Preserve all modified, staged, and untracked user work.

Do not assume existing changes belong to the current task.

If safe isolation is practical, use an isolated branch or worktree.

If the requested work overlaps existing changes or safe isolation is not possible, stop and report the situation.

### Diverged history

Do not automatically reconcile diverged history.

Do not automatically merge, rebase, reset, or force-update.

Stop and report unless repository-specific instructions explicitly define an approved procedure.

### Remote unavailable

Do not claim synchronization was verified.

Report that remote state could not be checked.

Continue only when the requested work can safely proceed from the known state.

## 5. Protection of Existing Work

Preserving existing user work has priority over convenience.

Never perform destructive or potentially destructive operations on existing work without clear authorization.

Unless specifically authorized, do not:

- run `git reset --hard`,
- discard working-tree changes,
- delete untracked user files,
- overwrite local changes with checkout/restore operations,
- destructively delete branches,
- force push,
- rewrite published history,
- automatically stash and later drop user work,
- rebase existing user commits,
- overwrite local work merely to match the remote.

When uncertain whether data or work is disposable, treat it as valuable.

## 6. Branch and Pull Request Discipline

For significant repository changes:

- start from the correct verified base,
- use a dedicated task branch,
- keep the branch focused on one coherent task,
- use a Pull Request when the repository workflow supports it.

Do not directly modify the default branch for significant work unless explicitly authorized or repository-specific rules allow it.

Do not merge a Pull Request unless the current task explicitly authorizes the merge.

Do not force-push unless explicitly authorized.

## 7. Scope Discipline

Implement the smallest coherent change that satisfies the requested task.

Do not automatically introduce:

- unrelated refactoring,
- speculative improvements,
- architecture rewrites,
- unrelated dependency upgrades,
- mass formatting changes,
- optional features,
- opportunistic cleanup,
- unrequested redesigns,
- future-proofing without a concrete requirement.

If useful unrelated work is discovered, report or record it separately.

Do not silently expand scope.

## 8. Repository Authority

Before significant work, inspect the repository's applicable instructions and source-of-truth documents.

Preserve established:

- architecture,
- terminology,
- workflows,
- conventions,
- project decisions,
- requirement status,
- documented assumptions,

unless the task explicitly requires changing them.

Do not silently reconcile conflicting repository documents.

Report material conflicts.

Repository-specific rules may override these global defaults.

## 9. Change Quality

Prefer:

- small understandable changes,
- clear responsibilities,
- readable code and documentation,
- existing repository patterns,
- root-cause fixes,
- existing approved tools,
- minimal complexity.

Do not introduce complexity merely to make a solution appear more sophisticated.

## 10. Commits

When committing changes:

- keep commits logically focused,
- use descriptive commit messages,
- do not mix unrelated changes,
- inspect staged content before committing,
- do not include local-only or generated files unless required.

Do not claim a commit contains only a particular scope without checking it.

## 11. Verification

Never claim that a command, test, build, lint, typecheck, scan, synchronization check, deployment, or other verification passed unless it was actually executed successfully.

Before declaring significant work complete:

1. inspect the final diff,
2. run relevant repository-defined checks,
3. verify affected behavior where practical,
4. inspect for unintended changes,
5. report any checks that could not be run.

If no relevant automated checks exist, state that explicitly.

Do not replace missing verification with assumptions.

## 12. Security and Secrets

Never intentionally commit or expose:

- passwords,
- API keys,
- access tokens,
- private keys,
- credentials,
- authentication cookies,
- secret environment values.

Use approved secret-management mechanisms.

Do not weaken security controls merely to make a task pass.

If sensitive information is discovered, avoid reproducing it unnecessarily and report the issue safely.

## 13. Dependencies and Tooling

Do not introduce a new dependency, framework, build system, service, or external tool when the task can be completed cleanly with the repository's existing stack.

When a new dependency is genuinely necessary:

- justify it,
- keep it minimal,
- prefer maintained and established options,
- follow repository-specific dependency policies.

## 14. External and Consequential Actions

Repository modification does not automatically authorize unrelated consequential external actions.

Do not assume authorization for actions such as:

- production deployment,
- DNS changes,
- cloud-resource deletion,
- production database migration,
- Pull Request merge,
- release publication,
- force push.

Perform such actions only when clearly authorized by the current task or applicable repository-specific instructions.

## 15. Truthfulness and Uncertainty

Never invent:

- command results,
- Git state,
- test results,
- deployment state,
- external-system state,
- project data,
- approvals,
- requirements.

Distinguish clearly between:

- observed facts,
- repository-defined facts,
- assumptions,
- inferences,
- unavailable information.

When uncertainty materially affects correctness or safety, report it.

## 16. Completion

Before declaring `COMPLETE`, verify that:

- requested scope is implemented,
- relevant checks passed or their absence is reported,
- the final diff was reviewed,
- no known existing user work was overwritten,
- no unresolved blocker prevents the requested outcome,
- no unrelated work was silently introduced.

If work cannot safely continue, use:

- `BLOCKED`, or
- `NEEDS_DECISION`

as appropriate.

Do not present partial or unverified work as complete.

## 17. Final Report

For significant tasks, report concisely:

- starting state / verified base,
- branch used,
- files changed,
- verification performed,
- known limitations,
- blockers or decisions required,
- Pull Request status where applicable,
- deployment status where applicable,
- final state.

Never hide failed checks, uncertainty, conflicts, or deviations.

<!-- END SHARED GLOBAL CODEX RULES -->

Repository-specific instructions below specialize these shared defaults and take precedence when they conflict. More deeply nested applicable Codex instruction files remain more specific.

# AGENTS.md

## Purpose

Guidance for coding agents and automated contributors working in this repository.
The project is source-visible but proprietary. Read `LICENSE` before making
changes.

## Required reading

Before product, architecture, data, security, privacy, AI, billing or UX work,
read:

1. `VISION.md`;
2. `ARCHITECTURE.md`;
3. `SECURITY.md`;
4. `docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md` for AI, MCP, Cloud Core, credits or payments.

## Product overview

StudyApp is a bilingual English/Greek, local-first learning application built
with React, TypeScript, Vite, React Router, Dexie, PDF.js, `pdf-lib`, Vitest and
`vite-plugin-pwa`.

Core study data remains in the browser. The current product has no user account,
cloud storage, cloud sync, first-party analytics, advertising or telemetry.

The owner-approved stable top-level UI model is:

```text
Home → Sources → Practice → AI Studio
```

`Split PDF Tool` and `Important Info` are secondary navigation. `Sources` groups
the existing Library and Structured Study areas; `Practice` groups flashcards,
review, quiz, progress and practice-content management; `AI Studio` is the
current entry point for the available StudyApp AI Assistant and planned AI modes.

## Stable UI baseline and Workspace BETA

The completed stable UI baseline is preserved at:

- branch: `stable/ui-final-2026-08-19`;
- commit: `e705086af2f393e70a345f2159689446f2e41871`.

Treat that checkpoint as the reference version for the current StudyApp UI/UX.
Do not redesign the stable Home, header or top-level information architecture as
part of unrelated work. Changes to the stable experience should be limited to
approved feature work, defects, accessibility fixes or explicitly requested UX
changes.

`Workspace BETA` is a separate experimental direction. Its initial purpose is
to test a simultaneous multi-panel workspace visually and ergonomically before
connecting the panels. Unless a later task explicitly expands scope:

- keep the existing stable routes and workflows intact;
- build the beta behind a separate route and focused branch/PR;
- start with UI/UX structure only;
- do not add cross-panel data flow, IndexedDB changes, remote AI calls, MCP,
  automatic source scanning or new persistence merely to make the prototype look
  functional;
- placeholders and clearly labelled beta/coming-soon actions are acceptable;
- do not treat the beta as a replacement for the stable UI until the owner
  explicitly approves that transition.

The intended first-pass desktop concept is three simultaneous panels, broadly
`Sources | Workspace/Practice | AI Studio`. Exact labels, proportions,
collapsing/resizing behaviour and mobile adaptation remain design decisions to
be validated in the beta.

## AI Assistant terminology

Use these names consistently:

- **StudyApp AI Assistant** — available external-link handoff to the dedicated Custom GPT;
- **ChatGPT App / MCP** — coming soon and inactive;
- **StudyApp AI** — coming soon and inactive paid/API mode;
- **StudyApp credits** — future server-authoritative credits, not active yet.

Do not describe ChatGPT App/MCP, StudyApp AI, purchases or real charges as
operational.

## Current AI invariants

### StudyApp AI Assistant

- renders only the approved dedicated ChatGPT destination as a normal external link;
- does not call the OpenAI API;
- does not read, copy or send study material;
- does not read IndexedDB or the library;
- does not use the clipboard or scripted popup positioning;
- does not use StudyApp credits;
- may open ChatGPT in a separate tab through a user-activated link;
- must not automate or scrape the ChatGPT website.

### ChatGPT App / MCP

Do not activate until the MCP server, permissions, authentication, privacy and
security review are complete. Introduce read-only tools before write actions.

### StudyApp AI

Do not activate until the Cloud Core task contract, server-side API key,
authentication, response validation, real credit ledger, payments and legal gates
are complete.

## User-facing language

The interface supports English and Greek.

- New primary UI must include both languages.
- Keep wording brief, clear and non-technical.
- Use **Available / Διαθέσιμο**, **Coming soon / Σύντομα**, and **No charges yet /
  Δεν γίνεται χρέωση ακόμη** consistently.
- Do not place engineering or billing design details in the primary user flow.
- The selected language is local device preference, not account data.

## UX boundaries

```text
Sources             = hub for Library source files and Structured Study
Library             = source books, articles, papers, notes and summaries
Structured Study    = material by structure and level
Practice            = flashcards, review, quiz, progress and practice content
AI Studio           = StudyApp AI Assistant now; MCP and paid API later
Split PDF Tool      = local PDF utility
Important Info      = supporting product, privacy and usage information
```

The AI Assistant is a supporting workflow, not a material store or replacement
for the main study areas.

## Repository structure

- `src/app/` — configuration and routing;
- `src/data/` — optional built-in study content;
- `src/features/` — feature UI and domain logic;
- `src/i18n/` — language state and shared translated labels;
- `src/infrastructure/` — IndexedDB, backup and remote-service clients;
- `src/shared/` — shared components, types and utilities;
- `src/styles/` — global and feature styles;
- `public/` — PWA assets and CSV templates;
- `tests/` — Vitest tests;
- `docs/` — design and architecture documents.

Keep logic feature-local unless it is genuinely shared. Keep provider transport
behind infrastructure or server boundaries.

## Development gate

```bash
npm ci
npm run typecheck
npm test
npm run build
```

Commit the lockfile when dependencies change. Avoid unnecessary dependencies.

Required CI failures must be investigated. Do not bypass or weaken a required
check merely to merge. Prefer semantic UX assertions over unjustified exact
pixel values when legitimate browser reflow differs across platforms.

## Coding expectations

- Keep TypeScript strict and avoid `any`.
- Use named domain types where applicable.
- Prefer small focused functions and React function components.
- Do not mutate React state directly.
- Prevent duplicate asynchronous submissions.
- Handle IndexedDB and network failures with short useful messages.
- Do not silently discard, overwrite, upload or save user data.
- Use transactions for related or destructive writes.
- Validate external input and responses at runtime.
- Preserve keyboard access and visible focus.

## Data integrity

Before changing imports, backups, migrations, deletion, generated-content save or
progress tracking:

1. define whether the operation creates, merges, replaces or deletes;
2. validate all external data;
3. check identifiers and relationships;
4. use transactions where several writes must succeed together;
5. confirm destructive actions;
6. preserve schema compatibility through migrations;
7. test malformed, duplicated, oversized and interrupted input;
8. keep generated AI output in review until explicitly saved.

Do not change the IndexedDB name or schema without a migration plan.

## Capacity and bounded rendering

Distinguish supported operational capacity from technical/read compatibility
safety maxima:

- the owner-approved personal-use operational capacity target is 150 chapters
  and 1,500 flashcards;
- production enforcement of that target is not implemented yet;
- future operational enforcement must apply to new writes, additions and
  imports without invalidating existing compatible data above the target;
- the technical/read compatibility safety maxima remain 10,000 chapters and
  100,000 flashcards and must not be silently reduced;
- do not claim that every safety-maximum collection can round-trip through a
  backup while the separate backup-over-10-MiB defect remains open.

Capacity decisions must be evidence-based. Measure storage, import, rendering
and accessibility behaviour before introducing or lowering operational limits;
do not lower a limit merely because the current interface renders poorly.
Distinguish storage/read capability from mounted UI capacity and use benchmark
evidence when changing supported capacity.

Large stored collections must not imply unbounded mounted UI. The current
manager uses O(U + F)-style projections and bounded pagination: 25 chapter rows
and 50 flashcard rows per page, with at most 75 content rows mounted. Those exact
page sizes may change when evidence supports it, but bounded rendering,
keyboard access and a bounded accessibility tree must be preserved.

## Privacy and security

- Keep the core application local-first.
- Never scan the library automatically for remote use.
- Do not send study data remotely without an approved, explicit and confirmed feature.
- Send only the minimum required content.
- Do not add analytics, tracking, accounts, remote storage or sync without owner approval.
- Never render user-controlled or model-generated HTML.
- Keep external links protected with `noopener noreferrer`.
- Never commit secrets, tokens, private URLs, backups, local database exports or payment credentials.
- Provider API keys and payment secrets must remain server-side.
- Vite environment variables are public configuration, not secret storage.

## Remote AI gate

Before any remote AI activation, define and test:

- request and response schemas;
- exact selected content and metadata;
- confirmation and cancellation;
- timeout, retry and duplicate-submission behaviour;
- prompt-injection and untrusted-document handling;
- output limits and validation;
- retention, deletion, logging and redaction;
- rate and cost limits;
- privacy, legal and bilingual user wording.

A service health check is not proof that an AI task or payment succeeded.

## Credits and payments

Real credits are not active. Before activation:

- balances and ledgers must be server-authoritative;
- purchase, reservation, settlement, release and refund must be idempotent;
- maximum estimated cost must be shown before confirmation;
- duplicate charges, replay, negative balances and client tampering must be prevented;
- failed, cancelled and timed-out task rules must be explicit;
- receipts, taxes, refunds, disputes and recovery must be defined.

Never reintroduce a browser-local wallet as a real financial record.

## Local files and PDF processing

- Use the central file allowlist for save and open flows.
- Reject executable or active web content.
- Revalidate stored blobs before opening or downloading.
- Respect file-size and browser-storage limits.
- Preserve source/split-PDF relationships.
- Keep PDF splitting local unless a separately approved remote extraction feature is introduced.

## Backup and restore

- Validate the complete backup before replacement.
- Show a preview and require confirmation.
- Use one transaction for replacement.
- Keep local file blobs excluded unless the UI and schema explicitly say otherwise.
- Do not imply that AI or Cloud Core provides backup or sync.

## Study sessions

- Record actual start and completion separately.
- Prevent duplicate answers and session records.
- Advance UI only after required persistence succeeds.
- Keep scheduling deterministic in tests.

## Accessibility

- Use semantic HTML before ARIA.
- Label every input.
- Keep all controls keyboard accessible.
- Restore and manage focus for dialogs.
- Announce important asynchronous changes.
- Test narrow layouts and 200% zoom.
- Keep critical content-management views usable at narrow widths and 200% text
  without horizontal document overflow.
- Treat cross-platform browser results as material: a local Windows pass does
  not override a Linux CI failure.
- Fix the responsible layout constraint; do not conceal defects with broad
  page-level overflow clipping.
- Never communicate availability or payment state by colour alone.

## Documentation

Historical v1 release files may retain their original scope. Living documents
must describe current behaviour and distinguish available, coming-soon and future
paid capabilities.

Update README, architecture, security, privacy and AI boundary documentation in
the same PR as any user-visible AI, language, remote-data or billing change.
