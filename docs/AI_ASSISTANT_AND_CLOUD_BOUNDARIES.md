# AI Assistant and Cloud Boundaries

_Last updated: 2026-07-31_

## Purpose

This document defines the boundary between StudyApp's local-first study workflow
and its three AI Assistant modes.

## Current modes

### 1. StudyApp AI Assistant — available

The StudyApp AI Assistant is a minimal external handoff:

1. StudyApp validates the configured dedicated **StudyApp AI Assistant** Custom
   GPT destination;
2. the interface renders it as a normal external link;
3. the user activates the link and works directly in ChatGPT.

The Custom GPT share URL is public production configuration through
`VITE_STUDYAPP_AI_ASSISTANT_URL`. It identifies the destination only; it is not an
API key, account credential or permission grant.

The StudyApp AI Assistant link does not:

- call the OpenAI API;
- use the StudyApp server-side API key;
- read the StudyApp library or IndexedDB;
- read, copy or send study material;
- use the clipboard;
- send content automatically;
- use StudyApp credits or payments;
- use `window.open` or scripted popup positioning;
- automate, embed, scrape or inspect the ChatGPT website;
- read the ChatGPT response back from the ChatGPT website.

The external ChatGPT service applies its own account, plan, privacy and sharing
rules. StudyApp accepts only the exact approved HTTPS `chatgpt.com` Custom GPT
destination without embedded credentials, a custom port, query parameters or a
fragment. The link uses `noopener noreferrer`. StudyApp does not access or zoom
the external cross-origin page.

### 2. ChatGPT App / MCP — coming soon

The planned ChatGPT App will expose approved StudyApp tools through a remote MCP
server. It is visible in the interface but inactive.

Before activation it requires:

- an approved MCP tool list;
- authentication and authorisation;
- explicit access scopes;
- read-only tools before write tools;
- confirmation before changes to StudyApp data;
- privacy and security review;
- ChatGPT platform testing.

### 3. StudyApp AI — coming soon

The planned StudyApp AI will call an AI provider through Markellos Cloud Core.
The OpenAI API key must remain a server secret and must never enter the browser
bundle.

This option is visible but inactive. The current application performs no paid AI
request, credit purchase, reservation or charge.

## Future task boundary

The current StudyApp AI Assistant leaves task selection inside ChatGPT. Future remote modes
should use a common StudyApp task model for:

- asking questions;
- creating flashcards;
- creating quizzes;
- summarising;
- explaining concepts.

Common result validation and review may be reused by future modes, but each mode
must keep its transport, availability and charging rules separate.

## Non-negotiable data boundaries

Any remote AI mode must satisfy all of the following:

- never scan or upload the library automatically;
- use only material deliberately selected or pasted by the user;
- show the material before submission;
- require explicit confirmation before content leaves the browser;
- send only the minimum required content;
- keep provider secrets server-side;
- validate remote responses before display or persistence;
- keep generated results as drafts until the user saves them;
- do not turn AI processing into hidden storage, backup or sync;
- do not log study content or secrets by default.

The current StudyApp AI Assistant is an external-link handoff. Opening its configured Custom
GPT page does not itself read or transmit StudyApp study material.

## Credits and payments

Real credits and payments are not active.

Before StudyApp AI can be enabled, the server must provide:

- server-authoritative balances;
- an immutable transaction ledger;
- idempotent purchase, reservation, settlement, release and refund operations;
- protection against duplicate charging and replay;
- clear maximum cost before confirmation;
- no-charge or refund behaviour for failed, cancelled and timed-out tasks;
- receipts, taxes, refunds and dispute handling;
- account or guest-session recovery rules;
- spending and abuse limits.

No client-side value may be treated as a real balance or price authority.

## Language and user-facing copy

The application supports English and Greek. AI mode names, availability and
confirmation text must be available in both languages.

User-facing explanations should remain brief:

- **Available / Διαθέσιμο**;
- **Coming soon / Σύντομα**;
- **No charges yet / Δεν γίνεται χρέωση ακόμη**.

Technical details belong in engineering documentation, not in the primary user
flow.

## Contributor gate

Before activating ChatGPT App/MCP or StudyApp AI:

1. define the exact request, response and permission contract;
2. document what data leaves the browser;
3. define cancellation, retry and failure behaviour;
4. complete security, privacy and legal review;
5. add unit, integration and browser tests;
6. update all living documentation;
7. run the complete repository verification gate.
