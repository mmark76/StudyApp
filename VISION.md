# StudyApp Vision

_Last updated: 2026-08-22_

## Vision

StudyApp is a **local-first personal knowledge and learning system** where a user
can add material, read it from source, study it through structure, practise it
through active recall and optionally use controlled AI assistance.

It is not only a flashcards app and it is not intended to become a general AI
chat interface.

The product should remain **simple on the surface and powerful underneath**. The
main experience should make the natural learning flow obvious without exposing
technical architecture to the user.

## Current product

The released study workflow runs in the browser. Study material, files, links,
progress, sessions and settings remain local by default. There is no user
account, cloud storage, cloud sync, advertising or study-content telemetry. The
owner-approved production traffic measurement is cookieless Plausible for
aggregate human traffic and consented Google Analytics for a smaller comparison
set. Neither service receives study content, local file information or study
actions.

The interface supports English and Greek. Language should be easy to change and
user-facing explanations should remain short and clear.

The approved stable top-level model is:

```text
Home → Sources → Practice → AI Studio
```

with `Split PDF Tool` and `Important Info` as secondary navigation.

The completed stable UI reference is preserved at branch
`stable/ui-final-2026-08-19`, commit
`e705086af2f393e70a345f2159689446f2e41871`.

## Product areas

```text
Sources             = Library source material + Structured Study
Practice            = practice content, flashcards, review, quiz and progress
AI Studio           = StudyApp AI Assistant now; MCP and paid API later
Split PDF Tool      = local PDF utility
Important Info      = supporting product, privacy and usage information
```

Library and Structured Study remain meaningful subareas inside Sources rather
than peer top-level destinations.

## Workspace direction

A separate **Workspace BETA** may test whether StudyApp becomes easier to use
when related work is visible simultaneously instead of spread across page
changes.

The initial concept is broadly:

```text
Sources | Workspace / Practice | AI Studio
```

The first beta should validate the interaction model before connecting the
panels. It should start as a UI/UX prototype with no automatic source transfer,
new persistence, data-model migration, MCP or remote AI activation. The stable
StudyApp remains the reference experience until the owner explicitly approves a
replacement.

If the multi-panel model is retained, its purpose is to reduce navigation and
keep source context, learning actions and generated outputs close together — not
to copy another product's visual design or increase visible complexity.

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

## Long-term principles

- local-first and private by default;
- bilingual user experience;
- simple on the surface, powerful underneath;
- source material remains central to the learning flow;
- clear separation between AI modes;
- explicit material selection;
- no automatic content upload;
- review before saving generated content;
- no hidden sync;
- no silent or duplicate charge;
- provider secrets remain server-side;
- technical complexity stays out of the main user flow;
- experimental UI must prove its value before replacing the stable experience.
