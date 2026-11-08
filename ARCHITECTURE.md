# Architecture

_Last updated: 2026-08-21_

## Summary

StudyApp is a bilingual, local-first React single-page application. Core study
features run in the browser and store data in IndexedDB.

The owner-approved stable top-level information architecture is:

```text
Home → Sources → Practice → AI Studio
```

`Split PDF Tool` and `Important Info` are secondary navigation. `Sources` is a
hub over the existing Library and Structured Study areas. `Practice` groups
practice-content management, flashcards, review, quiz and progress. `AI Studio`
is the current entry point for the available StudyApp AI Assistant, an optional
StudyApp Local ChatGPT-plan connection, and the two planned AI modes.

The completed stable UI baseline is preserved at branch
`stable/ui-final-2026-08-19`, commit
`e705086af2f393e70a345f2159689446f2e41871`.

The browser/PWA AI Assistant exposes three separate modes:

- StudyApp AI Assistant — active external link to the dedicated Custom GPT;
- ChatGPT App / MCP — visible but inactive;
- StudyApp AI — visible but inactive paid/API mode.

The separately started StudyApp Local edition provides a fourth, explicit
ChatGPT-plan connection. It is not part of the browser/PWA transport: a
loopback-only Windows companion keeps DPAPI-protected credentials outside the
browser and sends only a user-submitted question with `store: false`. It never
reads or includes Library/IndexedDB material automatically.

Its optional per-user Windows launcher registers fixed `studyapp-local://open` and `studyapp-local://stop` requests. The native handler validates them. Open starts the packaged server; Stop checks the listener and requests confirmation before stopping a verified server or, separately, an eligible identified same-user process. The protocol is not a browser API,
does not expose Local connection state, credentials, or data, and does not
change the loopback Host/Origin checks.

No PWA production AI request, real credit operation or payment is enabled.

## Workspace BETA boundary

Workspace BETA is the only user-facing application. The root URL opens BETA,
and normal builds redirect legacy Standard routes to it. The former Standard
shell remains in the repository as historical reference and is available only
in the dedicated E2E build mode. Legal pages remain directly reachable without
showing the historical shell.

Phase 1 of the approved Workspace BETA refactor presents three persistent desktop areas:

```text
Sources & Materials | AI Studio - Workspace | AI-Assisted Tools
```

Their initial desktop width ratio is **20% / 60% / 20%**. Users can resize the
columns independently of the internal Workspace/AI Agent height split; buttons
and card text reflow within the available column width.
The central height split defaults to 90% Workspace / 10% AI Agent while
disconnected (including Web/PWA). Once an approved Local ChatGPT connection is
active, it defaults to 50% / 50%; connecting or disconnecting resets the split
to its corresponding default. Users can still drag or keyboard-resize it and
double-click the divider to reset it for the current connection state.

Sources retains Library and Structured Study. Structured Study exposes Manual
Import (including the existing local Split PDF Tool) and an explicitly inactive
AI-Assisted Structuring path. The central Workspace starts with four connection
cards and replaces those cards with the selected existing mode or study tool;
it does not clear stored data or Local ChatGPT session state when views change.
The right-side tools grid selects Learning Goals, Key Points, Important Terms,
Summary & Main Points, Flashcards, Review, Quiz or Progress for the central
upper Workspace. That region presents results and empty states rather than
setup machinery. Summary creation and Progress backup, restore and archive
remain available through focused Workspace modals and retain their existing
data and validation behavior.
When the Windows Local connection is available, a selected study/practice tool
uses a visually separate lower conversation region; browser/PWA builds do not
mount an in-app conversation surface. On narrow/mobile viewports below 760px,
the responsive shell activates Sources, Workspace or Tools one at a time.

The beta reuses existing StudyApp capabilities and local state, but it does not
introduce a new IndexedDB schema, automatic source transfer between panels,
production remote AI calls, MCP, real credits or payment behavior. New
cross-panel data flow, persistence, data-model migration or remote-service
behavior requires separate explicit design and review.

The current beta has focused browser coverage for desktop proportions and
resizing, independent panel scrolling, focus behavior, bilingual presentation,
theme behavior, compact UI, secondary information/modals, PWA update placement,
narrow panels and the mobile single-panel shell. This workspace is the active
production experience; the former Standard shell is retained as historical
source and E2E-only coverage.

## Technology stack

- React 19 and TypeScript;
- Vite and React Router hash routing;
- Dexie over IndexedDB;
- PDF.js and `pdf-lib`;
- Vitest;
- Playwright Chromium for E2E;
- `vite-plugin-pwa`.

## Runtime layers

The Practice Summary and Main Points route reads explicitly selected local
`studyFiles` and imported chapter text. It saves reviewed results as TXT
`studyFiles` with the existing `summary` material type, without a schema change.
StudyApp Local extracts and tracks all readable pages or sections and partitions
them into bounded chunks. Any extraction gap is shown and blocks AI generation.
After explicit consent for multi-request transfer, the separate loopback
`summarize-parts` path processes every chunk and combines the intermediate
summaries hierarchically. RAG-based targeted questions, including the former
`ask-with-sources` path, are under construction and unavailable. Summary does
not save an AI draft automatically; downloads remain client-side.

### Browser application

IndexedDB contains:

- `cardProgress` — spaced-repetition state;
- `studySessions` — active and completed study and quiz sessions;
- `studyOperations` — internal idempotency records for committed study actions;
- `settings` — appearance, imported content and saved links;
- `studyFiles` — local file metadata and blobs.

The progress/settings JSON backup does not contain `studyFiles` blobs.

### Language layer

`src/i18n/` contains the application language context and shared translated
labels. The current language is English or Greek and is stored in browser local
storage. It does not change the IndexedDB schema or create an account preference.

New primary user interface must support both languages. Feature data supplied by
the user is not translated automatically.

### Historical Standard application shell

`src/shared/components/AppLayout.tsx` retains the former header, primary and
secondary navigation, main content outlet, PWA update toast and fixed footer.
Normal builds redirect these routes to Workspace BETA. Workspace iframe routes
and legal pages use a minimal embedded shell.

Primary navigation:

```text
Home | Sources | Practice | AI Studio
```

Secondary navigation:

```text
Split PDF Tool | Important Info
```

The lower navigation is intentionally link-like rather than pill-button UI. The
stable shell remains the production reference while Workspace BETA is evaluated
separately.

### Workspace BETA shell

`src/features/workspace-beta/WorkspaceBetaResponsivePage.tsx` selects the
responsive Workspace presentation. Desktop retains the four-panel Workspace
layout; mobile uses the compact header, menu and one-active-panel navigation.

`src/features/workspace-beta/WorkspaceBetaPage.tsx` owns the functional desktop
Workspace composition and the shared panel content used by the responsive
presentation. Workspace-specific helpers manage pointer/focus behavior, Info
menu auto-close behavior and modal document interactions.

In StudyApp Local only, the Workspace checks the loopback connection status. If
the current Windows user has approved ChatGPT-plan use, the fourth AI Studio
panel replaces its informational iframe with `WorkspaceLocalChat`. That feature
keeps the conversation only in React state for the active page, sends each
explicitly submitted question through the local companion with `store: false`,
and does not read or include Library/IndexedDB data. The browser/PWA edition
does not mount this conversation surface.
The Windows companion loads displayable models from the selected account's
`/v1/models` catalog using the protected OAuth token. The models endpoint sends
only names and slugs to the Local UI; the connection status carries a random,
non-secret connection identifier so account changes remount the picker. The
companion rechecks the selected slug against the live catalog before a Responses
request.
RAG retrieval is temporarily unavailable while it is being redesigned. The
active Workspace Local composer provides direct ChatGPT questions only, shows
that RAG is under construction, and does not expose file attachment, passage
selection, or source-review controls. The companion rejects its former
`ask-with-sources` route, so a legacy client cannot send passages while RAG is
unavailable. No persistent index or automatic Library scan is used.

Workspace presentation styles remain separate from the stable shell at the CSS
module/file level even though they are currently imported from the application
entry point. Route-level code/style splitting remains a maintainability and
bundle-size follow-up.

### AI Assistant presentation layer

`src/features/assistant/AssistantPanel.tsx` owns a two-screen dialog: the
ChatGPT entry screen and the other-AI-options screen. The dialog traps focus,
makes its application-shell siblings inert while open, closes with Escape and
restores focus to the launcher.

`src/features/assistant/AssistantComparisonPage.tsx` provides a bilingual,
read-only comparison of four AI options: the StudyApp AI Assistant (listed as a
Plugin in ChatGPT; its current StudyApp link still targets the approved Custom
GPT), Windows-only Sign in with ChatGPT through StudyApp Local, and the two
planned AI modes. It links from the AI mode guide, does not activate a remote
mode, does not inspect local study data and does not change account, plan or
charging behaviour.

`src/features/assistant/TypewriterWelcome.tsx` owns the intro-message
presentation. It reserves the complete responsive text layout, exposes one
static full copy to assistive technology and animates only an `aria-hidden`
visual copy. Its deterministic timing distinguishes the initial pause,
ordinary characters, spaces, clause punctuation and sentence punctuation. The
timer is cancelled on completion or unmount; reduced motion displays the
complete text without starting the typewriter.

#### StudyApp AI Assistant

```text
User activates normal external link → dedicated StudyApp AI Assistant Custom GPT tab
```

The application renders the public Custom GPT destination as an anchor with
`target="_blank"` and `rel="noopener noreferrer"`. It does not build or copy a
prompt, inspect IndexedDB, send study data, call `window.open`, automate ChatGPT
or read the ChatGPT response. The user chooses and shares material directly in
ChatGPT. Selecting Start also begins a short local-only Opening label, spinner
and hero-avatar effect. This presentation runs in parallel with the anchor's
immediate native navigation, does not close the panel and does not control or
delay the new tab.

The production URL is public Vite configuration in `.env.production`; it is not a
secret and must not contain credentials or tokens. Runtime validation accepts
the exact approved HTTPS Custom GPT URL without credentials, a custom port,
query parameters or a fragment. Missing or changed configuration falls back to
that approved destination.

`src/features/instructions/StudyAppInstructionsPage.tsx` provides permanent
bilingual documentation for the manual return path. It does not inspect
ChatGPT, read StudyApp data or perform imports. The user downloads generated
files to their device, adds a PDF through Library when applicable, and manually
imports Chapters CSV before Flashcards CSV through Practice.

#### ChatGPT App / MCP

Inactive. Its future boundary is:

```text
ChatGPT → authenticated StudyApp MCP server → approved tools
```

Read-only tools should precede write tools. Every write action requires explicit
confirmation and server-side authorisation.

#### StudyApp AI

Inactive. Its future boundary is:

```text
Selected material
→ review and maximum-cost confirmation
→ authenticated Cloud Core task
→ AI provider through server-side secret
→ validated draft result
→ user review and optional local save
```

The frontend must never contain an OpenAI API key, payment secret or authoritative
credit balance.

### Cloud Core client

The repository may retain provider-neutral Cloud Core client code for future use,
but the application shell no longer performs automatic readiness polling. A
future active remote mode must own its availability checks and must distinguish
service health from task success.

### PWA update presentation

`src/app/pwaUpdate.ts` keeps service-worker update availability, applying state
and a language-neutral failure code in a small external store.
`src/shared/components/PwaUpdateToast.tsx` renders that state as a fixed,
responsive English/Greek notification. Update installation remains an explicit
user action; choosing Later only dismisses the current notification. The
service-worker registration and caching strategy remain owned by `src/main.tsx`.

## Routing

Current stable routes include:

- `/` — Home;
- `/sources` — Sources hub;
- `/library` — Library;
- `/study` and `/study/theory` — Structured Study flows;
- `/units` — structured units;
- `/learn` — Practice hub;
- `/flashcards`, `/review`, `/quiz`, `/progress` — practice flows;
- `/import` — practice-content import;
- `/tools` — Split PDF Tool;
- `/important-info` — Important Info;
- `/appearance` — appearance settings;
- `/ai-assistant-guide` — AI Studio / AI mode guide;
- `/ai-assistant-comparison` — bilingual comparison of current and planned AI modes;
- `/instructions` — manual AI-generated file instructions;
- `/legal/*` — legal information.

Workspace BETA has the separate active route:

- `/workspace-beta` — responsive Workspace BETA shell.

Keeping Workspace on a separate route preserves the stable shell and workflows
while the prototype is evaluated.

## Data-flow boundaries

### Local file flow

```text
User file → runtime validation → IndexedDB blob → safe open or download
```

### Backup flow

```text
Supported IndexedDB records → validated JSON export
Valid backup JSON → preview → confirmation → one IndexedDB replacement transaction
```

Internal `studyOperations` records are not exported. Restore clears them inside
the same replacement transaction so restored progress and sessions cannot be
matched to stale operation IDs.

### Study-operation flow

```text
Stable operation ID
→ one Dexie transaction
→ progress + active/completed session + idempotency record
→ committed result returned to the UI
```

Retries reuse the operation ID. Existing committed operations return their
stored logical result without applying scheduling or quiz counters again.

### Local form-write flow

```text
Validated chapter, flashcard or appearance change
→ synchronous pending lock
→ awaited IndexedDB write
→ success message and form reset only after commit
```

A failed write retains the user's form values or latest appearance selection
and exposes a bilingual error state. Pending controls prevent rapid duplicate
submissions from producing duplicate writes or success messages.

### StudyApp AI Assistant link flow

```text
User activates external link → browser opens approved Custom GPT in a new tab
→ user works directly in ChatGPT
```

No study material is read or sent by StudyApp. Opening the configured ChatGPT
page is a normal external navigation controlled by the user.

### Manual generated-file return flow

```text
User downloads files in ChatGPT
→ user opens StudyApp
→ user manually adds the PDF to Library when applicable
→ user manually imports Chapters CSV before Flashcards CSV through Practice
```

The instructions page documents this flow only. It does not receive, discover,
upload or import files automatically.

### Future remote AI flow

```text
Explicit selection → review → confirmation → remote task → validated draft
```

No automatic library scan and no automatic result save are allowed.

## CI and deployment

The full CI workflow runs for pull requests, direct `main` updates and explicit
manual CI dispatches. It executes in the pinned Playwright container
`mcr.microsoft.com/playwright:v1.64.1-noble`:

```text
npm ci → typecheck → unit tests → Playwright E2E → production build
```

GitHub Pages no longer deploys independently from a `main` push. Deployment is
triggered by successful completion of the `CI` workflow on `main`:

```text
main update
→ full CI on exact SHA
→ successful CI workflow_run
→ checkout workflow_run.head_sha
→ npm ci
→ production build
→ upload
→ deploy
```

This preserves separation between verification and publishing while ensuring
that Pages rebuilds and deploys the exact commit that passed the full
main-branch CI gate.

The Web/PWA-only Workspace BETA release archive is an on-demand public metadata
view. Opening it fetches the public GitHub releases endpoint, validates each
release tag and expected official ZIP asset URL in the browser, and renders no
study content or local state. It is absent from the Windows Local interface.

Repository settings should additionally require the CI gate for merges to
`main` where supported. Workflow-level gating does not replace branch/ruleset
protection against bypassing review or required checks.

## Safety boundaries

- External input is validated at runtime.
- Local file save and open flows share an allowlist.
- Restore validates before one transactional replacement.
- Generated content remains a draft until explicitly saved.
- Provider secrets remain server-side.
- Real credits and ledgers must be server-authoritative and idempotent.
- Mode availability must be represented independently.
- English and Greek wording must communicate the same material facts.
- The StudyApp AI Assistant link does not inspect, automate or embed the ChatGPT website.
- The AI options comparison page is static local presentation and does not itself access or transmit study data.
- Workspace BETA must not silently gain new persistence, automatic cross-panel transfer or remote-service behaviour without explicit review.

## High-risk areas

- IndexedDB migrations and restore;
- browser storage quota and large PDF processing;
- nested split-PDF relationships;
- study-session persistence;
- PWA updates;
- MCP permissions and cross-user isolation;
- prompt injection and untrusted documents;
- remote AI response validation;
- authentication and authorisation;
- credit reservation, settlement, release and refunds;
- privacy and legal alignment when content leaves the browser.

## Testing strategy

Existing unit and IndexedDB tests cover local study logic, files, imports,
backups and updates.

Playwright Chromium tests cover navigation, key study flows, Assistant behaviour,
exact external-link attributes, English and Greek copy, focus
trapping/restoration, inert background, Escape handling, absence of
clipboard/scripted-popup behaviour and transaction failure/retry behaviour for
flashcards, quizzes and review. They also inject deterministic local-write
delay/failure states for chapter, flashcard and appearance-setting persistence.
PWA coverage verifies the compact desktop and mobile update toast, explicit
Update/Later actions, pending-state duplicate prevention and live error
retranslation.

Assistant coverage includes:

- language selection and persistence;
- English and Greek mode labels;
- deterministic bilingual welcome typing, completion and reduced motion;
- a static full screen-reader copy and stable action layout while typing;
- a brief bilingual Start activation state that preserves native link behaviour;
- exact approved StudyApp AI Assistant destination;
- no clipboard or scripted popup call from the Assistant link;
- inactive Coming soon modes;
- keyboard operation and focus behaviour;
- comparison-page content, availability labels and user-cost row ordering.

Workspace BETA browser coverage includes:

- three-column Sources, Workspace and Tools presentation with an explicit tools hide/show control;
- four AI connection cards, inactive future modes, and selected-mode Back to AI options behavior;
- divider resizing and reset;
- wheel scrolling and pointer/focus behavior;
- compact Core Knowledge, Sources and AI presentation;
- dark/light themes and narrow-panel containment;
- secondary information and modal actions;
- PWA update presentation inside the Workspace modal host;
- compact mobile header/menu behavior;
- one-active-panel mobile navigation at 360px, 390px and 412px widths;
- language synchronization when mobile panels activate;
- desktop regression coverage while the mobile shell is enabled responsively.

Firefox, WebKit and manual screen-reader verification remain follow-up gaps.
Future MCP and paid API work requires separate integration and browser tests.
