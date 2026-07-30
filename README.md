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

### ChatGPT Companion — available

StudyApp prepares a prompt from text deliberately pasted by the user. The user
can copy the prompt and open ChatGPT in a separate tab.

The Companion:

- does not use the StudyApp OpenAI API key;
- does not send content automatically;
- does not access the StudyApp library or local database;
- does not charge StudyApp credits.

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
5. **AI Assistant** — Companion now; ChatGPT App/MCP and paid StudyApp AI later.

## Local-first storage and privacy

Study content, progress, settings, links and uploaded file blobs are stored in
the browser. StudyApp currently has no account, cloud storage, cloud sync,
first-party analytics, telemetry or advertising.

Local browser data can be lost. Keep original files and required copies outside
StudyApp.

The JSON backup includes progress, sessions, supported settings, imported
chapters and flashcards, and saved links. It does **not** include uploaded or
generated file blobs. See [`BACKUP_AND_DATA_SAFETY.md`](BACKUP_AND_DATA_SAFETY.md).

## Supported local files

StudyApp accepts PDF, DOC, DOCX, TXT, Markdown, CSV, PNG, JPEG, WebP and GIF after
runtime checks. HTML, SVG, XML, JavaScript, executable content and unsupported or
significantly mismatched file types are rejected.

## Current limitations

- Local file blobs are not included in the JSON backup.
- Storage capacity depends on the browser and device.
- ChatGPT Companion requires manual copy/open interaction.
- ChatGPT App / MCP is not active yet.
- StudyApp AI, real credits and payments are not active yet.
- Complete local-file export/import and broader browser tests remain future work.

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
