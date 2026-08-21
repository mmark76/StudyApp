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
is the current entry point for the available StudyApp AI Assistant and the two
planned AI modes.

The completed stable UI baseline is preserved at branch
`stable/ui-final-2026-08-19`, commit
`e705086af2f393e70a345f2159689446f2e41871`.

The AI Assistant exposes three separate modes:

- StudyApp AI Assistant — active external link to the dedicated Custom GPT;
- ChatGPT App / MCP — visible but inactive;
- StudyApp AI — visible but inactive paid/API mode.

No production AI request, real credit operation or payment is currently enabled.

## Workspace BETA boundary

Workspace BETA is an active, separate UX experiment rather than a replacement
for the stable application shell. It is isolated at `/workspace-beta` while the
stable routes remain intact.

The current desktop workspace presents four independent StudyApp areas:

```text
Sources | Core Knowledge | Practice | AI Studio
```

The default desktop proportions are 22/22/34/22 and adjacent panels can be
resized. On narrow/mobile viewports below 760px the responsive shell changes to
single-panel navigation: Sources, Knowledge, Practice and AI are activated one
at a time instead of keeping a horizontally scrolling four-panel canvas.

The beta reuses existing StudyApp capabilities and local state, but it does not
introduce a new IndexedDB schema, automatic source transfer between panels,
production remote AI calls, MCP, real credits or payment behavior. New
cross-panel data flow, persistence, data-model migration or remote-service
behavior requires separate explicit design and review.

The current beta has focused browser coverage for desktop proportions and
resizing, independent panel scrolling, focus behavior, bilingual presentation,
theme behavior, compact UI, secondary information/modals, PWA update placement,
narrow panels and the mobile single-panel shell. The stable application remains
the production reference while the Workspace interaction model is evaluated.

## Technology stack

- React 19 and TypeScript;
- Vite and React Router hash routing;
- Dexie over IndexedDB;
- PDF.js and `pdf-lib`;
- Vitest;
- Playwright Chromium for E2E;
- `vite-plugin-pwa`.

## Runtime layers

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

### Stable application shell

`src/shared/components/AppLayout.tsx` owns the stable header, primary and
secondary navigation, main content outlet, PWA update toast and fixed footer.

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
read-only comparison of the available StudyApp AI Assistant and the two planned
AI modes. It links from the AI mode guide, does not activate a remote mode, does
not inspect local study data and does not change account, plan or charging
behaviour.

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
`mcr.microsoft.com/playwright:v1.62.1-noble`:

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

- independent functional desktop panels and default 22/22/34/22 proportions;
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
