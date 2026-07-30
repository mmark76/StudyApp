# AI Assistant and Cloud Boundaries

_Last updated: 2026-07-30_

## Purpose

This document defines the boundary between StudyApp's local-first study workflow
and its three AI Assistant modes.

## Current modes

### 1. ChatGPT Companion — available

The Companion is a local handoff workflow:

1. the user chooses a task;
2. the user pastes or explicitly imports the exact study text to use;
3. StudyApp prepares a prompt locally;
4. StudyApp keeps the prepared prompt visible and copies it when browser
   permission allows;
5. StudyApp validates and opens the dedicated **StudyApp AI Assistant** Custom
   GPT in a separate browser popup;
6. if clipboard or popup access fails, StudyApp shows the independent failure
   state and a safe manual fallback;
7. the user reviews and pastes the prepared request manually.

The Custom GPT share URL is public production configuration through
`VITE_STUDYAPP_AI_ASSISTANT_URL`. It identifies the destination only; it is not an
API key, account credential or permission grant.

The Companion does not:

- call the OpenAI API;
- use the StudyApp server-side API key;
- read the StudyApp library or IndexedDB automatically;
- send content automatically;
- use StudyApp credits or payments;
- automate, embed, scrape or inspect the ChatGPT website;
- read the ChatGPT response back from the ChatGPT website.

The external ChatGPT service applies its own account, plan, privacy and sharing
rules. Browser popup settings may affect the window's size or position.
StudyApp accepts only the approved HTTPS `chatgpt.com` destination without
embedded credentials or a custom port. It does not access or zoom the external
cross-origin page.

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

## Shared task boundary

All three modes should use a common task model for:

- asking questions;
- creating flashcards;
- creating quizzes;
- summarising;
- explaining concepts.

Common result validation and review may be reused, but each mode must keep its
transport, availability and charging rules separate.

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

The current Companion remains a manual clipboard handoff. Opening its configured
Custom GPT page does not itself transmit the prepared study material.

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
