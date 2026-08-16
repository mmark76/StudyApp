# StudyApp

A bilingual, local-first personal knowledge and learning application.

## Current status

StudyApp supports English and Greek through the **EN / GR** switch in the header.
The selected language is stored locally on the device.

The core study workflow is available:

- add and organise user-provided study material;
- read source and structured material;
- split PDFs locally;
- create or import chapters and flashcards;
- practise with flashcards, review and quizzes;
- store progress in the current browser;
- export and restore a progress/settings backup.

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
CSV in Learn & Practice. No file is transferred automatically from ChatGPT.

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

1. **Library** — source books, articles, papers, notes and summaries.
2. **Structured Study** — contents, chapters, sections, concepts, references and diagrams.
3. **Learn & Practice** — flashcards, due review, quizzes and progress.
4. **Split PDF Tool** — local PDF splitting and download.
5. **AI Assistant** — StudyApp AI Assistant now; ChatGPT App/MCP and paid StudyApp AI later.

## Local-first storage and privacy

Study content, progress, settings, links and uploaded file blobs are stored in
the current browser and device. StudyApp currently has no account, cloud
storage, cloud sync, first-party analytics, telemetry or advertising.

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
