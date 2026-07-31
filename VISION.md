# StudyApp Vision

_Last updated: 2026-07-31_

## Vision

StudyApp is a **local-first personal knowledge and learning system** where a user
can add material, read it from source, study it through structure, practise it
through active recall and optionally use controlled AI assistance.

It is not only a flashcards app and it is not intended to become a general AI
chat interface.

## Current product

The released study workflow runs in the browser. Study material, files, links,
progress, sessions and settings remain local by default. There is no user
account, cloud storage, cloud sync, first-party analytics, advertising or
telemetry.

The interface supports English and Greek. Language should be easy to change and
user-facing explanations should remain short and clear.

## AI direction

The AI Assistant has three modes with distinct purposes.

### StudyApp AI Assistant

Available now. It provides a normal external link to the dedicated StudyApp AI
Assistant in ChatGPT. StudyApp does not read, copy or send study material for
this handoff, and it does not use StudyApp credits.

### ChatGPT App / MCP

Coming soon. It will allow ChatGPT to use explicitly approved StudyApp tools.
Read-only access should be introduced before any write action.

### StudyApp AI

Coming soon. It will provide automatic AI results inside StudyApp through
Markellos Cloud Core. Real credits and charges must remain disabled until the
security, privacy, billing and legal gates are complete.

## User control

The user controls:

- the task;
- the material used;
- whether content is sent remotely;
- whether a result is edited, discarded or saved;
- whether any future paid credit is spent.

AI must never automatically scan the full library, silently save results, become
hidden cloud storage or make payment decisions without confirmation.

## Product areas

```text
Library             = source material
Structured Study    = material by structure and level
Learn & Practice    = flashcards, review, quiz and progress
Split PDF Tool      = local PDF utility
AI Assistant        = StudyApp AI Assistant now; MCP and paid API later
```

## Long-term principles

- local-first and private by default;
- bilingual user experience;
- clear separation between AI modes;
- explicit material selection;
- no automatic content upload;
- review before saving generated content;
- no hidden sync;
- no silent or duplicate charge;
- provider secrets remain server-side;
- technical complexity stays out of the main user flow.
