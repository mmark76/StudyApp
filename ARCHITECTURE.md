# Architecture

_Last updated: 2026-07-31_

## Summary

StudyApp is a bilingual, local-first React single-page application. Core study
features run in the browser and store data in IndexedDB.

The AI Assistant now exposes three separate modes:

- StudyApp AI Assistant — active external link to the dedicated Custom GPT;
- ChatGPT App / MCP — visible but inactive;
- StudyApp AI — visible but inactive paid/API mode.

No production AI request, real credit operation or payment is currently enabled.

## Technology stack

- React 19 and TypeScript;
- Vite and React Router hash routing;
- Dexie over IndexedDB;
- PDF.js and `pdf-lib`;
- Vitest;
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

### AI Assistant presentation layer

`src/features/assistant/AssistantPanel.tsx` owns a two-screen dialog: the
ChatGPT entry screen and the other-AI-options screen. The dialog traps focus,
makes its application-shell siblings inert while open, closes with Escape and
restores focus to the launcher.

`src/features/assistant/TypewriterWelcome.tsx` owns the intro-message
presentation. It reserves the complete responsive text layout, exposes one
static full copy to assistive technology and animates only an `aria-hidden`
visual copy. Its deterministic timer is cancelled on completion or unmount;
reduced motion displays the complete text without starting the typewriter.

#### StudyApp AI Assistant

```text
User activates normal external link → dedicated StudyApp AI Assistant Custom GPT tab
```

The application renders the public Custom GPT destination as an anchor with
`target="_blank"` and `rel="noopener noreferrer"`. It does not build or copy a
prompt, inspect IndexedDB, send study data, call `window.open`, automate ChatGPT
or read the ChatGPT response. The user chooses and shares material directly in
ChatGPT.

The production URL is public Vite configuration in `.env.production`; it is not a
secret and must not contain credentials or tokens. Runtime validation accepts
the exact approved HTTPS Custom GPT URL without credentials, a custom port,
query parameters or a fragment. Missing or changed configuration falls back to
that approved destination.

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

- `/` — Home;
- `/library` — Library;
- `/study/theory` — Structured Study;
- `/learn` — Learn & Practice;
- `/flashcards`, `/review`, `/quiz`, `/progress` — practice flows;
- `/import` — content import;
- `/tools` — Split PDF Tool;
- `/appearance` — appearance settings;
- `/ai-assistant-guide` — AI mode guide;
- `/legal/*` — legal information.

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

No study material is read or sent by StudyApp. Opening the configured
ChatGPT page is a normal external navigation controlled by the user.

### Future remote AI flow

```text
Explicit selection → review → confirmation → remote task → validated draft
```

No automatic library scan and no automatic result save are allowed.

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

Playwright Chromium tests cover the two Assistant screens, exact link
attributes, English and Greek copy, focus trapping/restoration, inert
background, Escape handling, absence of clipboard/scripted-popup behaviour and
transaction failure/retry behaviour for flashcards, quizzes and review. They
also inject deterministic local-write delay/failure states for chapter,
flashcard and appearance-setting persistence. PWA coverage verifies the compact
desktop and mobile update toast, explicit Update/Later actions, pending-state
duplicate prevention and live error retranslation.

Assistant coverage includes:

- language selection and persistence;
- English and Greek mode labels;
- deterministic bilingual welcome typing, completion and reduced motion;
- a static full screen-reader copy and stable action layout while typing;
- exact approved StudyApp AI Assistant destination;
- no clipboard or scripted popup call from the Assistant link;
- inactive Coming soon modes;
- keyboard operation and focus behaviour.

Future MCP and paid API work requires separate integration and browser tests.
