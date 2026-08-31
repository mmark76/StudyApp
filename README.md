# StudyApp

A bilingual, local-first personal knowledge and learning application.

## Current status

StudyApp v1.0.0 is **release verified** in production as of 2026-08-20.

- production `main` SHA: `5d94e2744014e1d87a4e65d8462ac98082d3e1ce`;
- deployed build: `v1.0.0_20260820_2202_5d94e27`;
- stable release branch: `stable/release-2026-08-20`;
- DATA-04, WB-01, WB-02 and WB-03: resolved and production smoke-verified;
- Linux CI: typecheck, production build, 268/268 unit tests and 49/49 E2E tests passed;
- production dependency audit: 0 vulnerabilities;
- interactive Chrome production smoke verification: PASS for DATA-04 and WB-01/WB-02/WB-03.

StudyApp supports English and Greek through the **EN / GR** switch in the header.
The selected language is stored locally on the device.

The stable top-level navigation is:

**Home · Sources · Practice · AI Studio**

with **Split PDF Tool** and **Important Info** as secondary navigation.

The core study workflow is available:

- add and organise user-provided study material;
- read source and structured material through Sources;
- split PDFs locally;
- create or import chapters and flashcards;
- practise with flashcards, review and quizzes;
- store progress in the current browser;
- export and restore a progress/settings backup.

## Stable release checkpoints

The current verified release is preserved at:

- branch: `stable/release-2026-08-20`;
- verified production source commit: `5d94e2744014e1d87a4e65d8462ac98082d3e1ce`.

The earlier approved UI-only checkpoint remains available for historical reference at:

- branch: `stable/ui-final-2026-08-19`;
- commit: `e705086af2f393e70a345f2159689446f2e41871`.

The August 20 release keeps the approved product model while incorporating the
verified DATA-04 and Workspace blocker fixes. Documentation-only commits on the
stable release branch do not change the application code represented by the
verified production release.

## Workspace BETA — active experiment

Workspace BETA is an implemented multi-panel UX experiment that remains
separate from the stable top-level product model. Its blocker-remediation paths
for WB-01, WB-02 and WB-03 were verified in production on 2026-08-20, including
interactive pointer/focus and layout behavior.

The workspace is still treated as beta. It does not by itself redefine the
stable navigation, data ownership model, local-first persistence boundary, MCP,
remote AI behavior or automatic source transfer.

## AI Assistant

The AI Assistant presents three clearly separated options.

The bilingual `/#/ai-assistant-comparison` page compares the current Custom GPT handoff with the planned ChatGPT App / MCP and StudyApp AI modes. It is informational only and does not activate a remote AI mode, read study data or change charging behaviour.

### StudyApp AI Assistant — available

StudyApp provides a normal external link to the dedicated **StudyApp AI
Assistant** Custom GPT. The link opens in a new browser tab. The user chooses and
shares any study material directly in ChatGPT.

The permanent bilingual `/#/instructions` page explains how to add files created
by the Assistant to StudyApp. The user downloads each file to their device and
then manually adds the PDF to Library or imports Chapters CSV before Flashcards
CSV through Practice. No file is transferred automatically from ChatGPT.

The bilingual intro explains the available assistant and planned AI options
through an accessible typewriter presentation. The full message is available
immediately to assistive technology, can be revealed on demand and appears
without animation when reduced motion is requested. Deterministic word and
punctuation pauses give the visual typing a calmer rhythm. Activating Start
briefly shows a local Opening state while the unchanged native external link
opens immediately in a new tab.

The available StudyApp AI Assistant link:

- does not use the StudyApp OpenAI API key;
- does not read, copy or send study content;
- does not access the StudyApp library or local database;
- does not use the clipboard;
- does not charge StudyApp credits;
- validates the public production configuration against the exact approved
  HTTPS ChatGPT destination;
- does not automate, position, scrape or inspect the ChatGPT tab.

### ChatGPT App / MCP — coming soon

The planned ChatGPT App will connect ChatGPT with approved StudyApp tools through
an MCP server. This option is visible but inactive.

### StudyApp AI — coming soon

The planned StudyApp AI will provide automatic results inside StudyApp through
Markellos Cloud Core and the server-side OpenAI API key.

This option is visible but inactive. No real OpenAI request, credit purchase or
charge is currently enabled.

See [`docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md`](docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md).

## Product areas

1. **Sources** — hub for source material and structured study.
   - **Library** — books, articles, papers, notes, summaries and supported local files.
   - **Structured Study** — contents, chapters, sections, concepts, references and diagrams.
2. **Practice** — practice-content management, flashcards, due review, quizzes and progress.
3. **AI Studio** — StudyApp AI Assistant now; ChatGPT App/MCP and paid StudyApp AI later.
4. **Split PDF Tool** — secondary local PDF splitting and download utility.
5. **Important Info** — secondary product, usage, privacy and supporting information.

## Local-first storage and privacy

Study content, progress, settings, links and uploaded file blobs are stored in
the current browser and device. StudyApp currently has no account, cloud
storage, cloud sync, advertising or study-content telemetry. Production uses
minimal website traffic measurement: cookieless Plausible for aggregate traffic
and optional Google Analytics only after consent. Both receive sanitized page
routes and general traffic metadata, never study content, IndexedDB records,
file names, uploads, downloads, searches, form entries or click events. The
analytics choices page also allows the current browser to be excluded from all
future measurement.

Local browser data can be lost if site data is cleared or the browser or device
fails. StudyApp is not a permanent-storage service or a complete backup
service. Keep original files and required copies outside StudyApp. Available
storage depends on the browser and device.

The JSON backup includes progress, sessions, supported settings, imported
chapters and flashcards, and saved links. It does **not** include uploaded or
generated file blobs. See [`BACKUP_AND_DATA_SAFETY.md`](BACKUP_AND_DATA_SAFETY.md).

Flashcard and review progress, session counters and their internal idempotency
records are committed together in IndexedDB transactions. A failed write leaves
the last successfully committed study state available for retry.

Chapter and flashcard creation report success only after the local IndexedDB
write completes. While a write is pending, duplicate submission is disabled; if
it fails, the entered values remain in the form with a bilingual error message.
Appearance settings likewise distinguish saving, saved and failed states, and
retain the latest visible selection after a failed write.

## PWA updates

When a newer service worker is ready, StudyApp shows a compact bilingual update
toast. The user explicitly chooses **Update / Ενημέρωση** or **Later /
Αργότερα**; StudyApp does not install the update or reload active work
automatically. Update failures remain retryable and follow the currently
selected interface language.

## Supported local files

StudyApp accepts PDF, DOC, DOCX, TXT, Markdown, CSV, PNG, JPEG, WebP and GIF after
runtime checks. HTML, SVG, XML, JavaScript, executable content and unsupported or
significantly mismatched file types are rejected.

## Current limitations

- Local file blobs are not included in the JSON backup.
- Browser and device storage capacity and availability are not guaranteed.
- StudyApp AI Assistant opens an external ChatGPT page; ChatGPT applies its own
  account, plan, privacy and sharing rules.
- ChatGPT App / MCP is not active yet.
- StudyApp AI, real credits and payments are not active yet.
- Workspace remains a beta UX area even though its current release-blocking
  interaction defects are resolved.
- DATA-02 and WB-04 remain documented low/non-blocking findings.
- Two high-severity advisories remain in transitive build/dev dependencies;
  the production-only dependency audit is clean.
- Firefox, WebKit and manual screen-reader verification remain follow-up gaps.
- Complete local-file export/import and broader cross-browser coverage remain
  future work.

## Project guidance

- [`VISION.md`](VISION.md) — product direction.
- [`AGENTS.md`](AGENTS.md) — repository rules.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — application architecture.
- [`DATA_MODEL.md`](DATA_MODEL.md) — persisted data.
- [`SECURITY.md`](SECURITY.md) — security and privacy boundaries.
- [`docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md`](docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md)
  — AI modes and production gates.
- [`V1_1_BACKLOG.md`](V1_1_BACKLOG.md) — deferred work.

## Development

```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

The production build reads the public `VITE_STUDYAPP_AI_ASSISTANT_URL` setting
from `.env.production` for the dedicated StudyApp Custom GPT link. Runtime
validation falls back to the exact approved HTTPS destination if the setting is
missing or changed. Vite environment variables are public configuration and
must never contain secrets.
