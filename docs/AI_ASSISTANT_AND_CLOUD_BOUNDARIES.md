# AI Assistant and Cloud Boundaries

_Last updated: 2026-08-16_

## Purpose

This document defines the boundary between StudyApp's local-first study workflow
and its three browser/PWA AI Assistant modes. A separately started StudyApp
Local edition has one additional, explicit local connection described below.

## Current modes

### 1. StudyApp AI Assistant — available

The StudyApp AI Assistant is a minimal external handoff:

1. StudyApp validates the configured dedicated **StudyApp AI Assistant** Custom
   GPT destination;
2. the interface renders it as a normal external link;
3. the user activates the link and works directly in ChatGPT.

The intro presents a bilingual overview of the available Assistant and the two
planned AI options. Its accessible typewriter effect runs entirely in the
browser, provides a complete static copy to assistive technology, supports
immediate completion and shows the full text without animation when reduced
motion is requested. Its deterministic character and punctuation rhythm and
the brief Start Opening/spinner/avatar state are local presentation only. The
Opening state runs alongside the anchor's immediate native new-tab navigation
and does not change the destination or data boundary.

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

The Assistant guide links to the permanent bilingual `/instructions` page for
the manual generated-file workflow. Files remain in ChatGPT or on the user's
device until the user downloads them and explicitly uses the existing StudyApp
controls. StudyApp does not receive files from ChatGPT automatically. For a new
practice-content set, the documented order is Chapters CSV first and Flashcards
CSV second.

### 2. StudyApp Local Sign in with ChatGPT — optional Windows Local edition

This is not a browser/PWA feature. The separately started StudyApp Local server
listens only on `127.0.0.1`, requests browser approval from an eligible ChatGPT
account, and stores the resulting connection encrypted with Windows DPAPI for
the current Windows user. Eligible questions use the user's ChatGPT subscription
or available ChatGPT credits. No OpenAI API key, StudyApp credit, or browser
token storage is used.

The basic chat composer sends only a question the user types and explicitly submits.
This composer does not scan, read, select, upload, or automatically include Library,
IndexedDB, progress, or study history. Answers use `store: false`, are shown
only in the active Local page session, and are not added to StudyApp data. Once
the connection is ready, StudyApp Local's Workspace may use the full AI Studio
panel as a conversation surface with a bottom composer and transient history.
It is a Local-only presentation of this same explicit-question flow; the
browser/PWA keeps its external-link and informational presentation. Disconnect
deletes the protected local connection record.

The Local ChatGPT page separately supports questions about user-selected
Library PDFs. PDF bytes are validated and text is extracted, chunked, and
searched on-device. The exact selected excerpts, document titles, and page
numbers are shown for review. Nothing from this workflow is sent until the user
explicitly approves and submits. The confirmed request includes only the
question and reviewed passages; it uses `store: false`, and the answer stays in
the active page session. The answer is instructed to cite source IDs/pages and
to state when the selected passages are insufficient. No API key, web search,
external vector store, persistent PDF index, or automatic Library scan is used.

The separately installed, per-user Windows launcher can register
`studyapp-local://open`. The browser/PWA can offer this as an opening action,
but it cannot use the protocol to query Local status or data. The handler
accepts only the exact protocol request, safely stops only a verified StudyApp
Local server, starts the packaged loopback application, waits for it, and opens
Workspace. It does not alter the explicit-question requirement, the credential
store, or the Local Host/Origin boundary.

### 3. ChatGPT App / MCP — coming soon

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

### 4. StudyApp AI — coming soon

The planned StudyApp AI will call an AI provider through Markellos Cloud Core.
The OpenAI API key must remain a server secret and must never enter the browser
bundle.

This option is visible but inactive. The current application performs no paid AI
request, credit purchase, reservation or charge.

## AI options comparison page

The bilingual `/ai-assistant-comparison` page explains four options: the StudyApp
AI Assistant (now listed as a Plugin in ChatGPT while its current StudyApp link
still uses the approved Custom GPT URL), the two planned modes, and Windows-only
Sign in with ChatGPT for eligible accounts. It is static local presentation only.
It does not:

- activate ChatGPT App / MCP or StudyApp AI;
- inspect the library, IndexedDB, progress or study history;
- send material to ChatGPT, Cloud Core or an AI provider;
- create, save or import generated content;
- change account, plan, credit or charging behaviour.

The comparison must keep **Available / Διαθέσιμο** and **Coming soon / Σύντομα**
status wording explicit so future capabilities are not presented as current.
ChatGPT account, plan and App/MCP availability statements describe the external
ChatGPT service and may need revision when OpenAI changes its product rules.

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
