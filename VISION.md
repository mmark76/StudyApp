# StudyApp Vision

_Last updated: 2026-07-30_

## One-sentence vision

StudyApp is intended to become a **local-first personal knowledge and learning
system**: a private workspace where a user can add study material, read it from
source, study it through structure, practise it through active recall, retrieve
knowledge through meaningful filters, and optionally request clearly controlled
AI assistance for material the user deliberately selects.

It should not be understood only as a flashcards app or as an AI chat interface.
Flashcards, quizzes, review queues, spaced repetition, source reading,
structured study, and optional AI assistance are tools inside a broader system
for organising, understanding, remembering, and recalling knowledge.

## Current product reality

StudyApp currently has two deliberately separated layers.

### Local-first study workflow

The released study workflow runs in the browser. Study material, local files,
links, progress, sessions, and settings remain local by default. There is no
user account, cloud storage, cloud sync, analytics, advertising, or telemetry.
Browser storage is not permanent storage or a complete backup, so users must
retain original files and required copies outside StudyApp.

### AI Assistant preview

The current AI Assistant is a test-mode workflow preview. It demonstrates task
selection, material selection, service availability, estimated cost,
confirmation, result review, and a local-save decision. It uses mock results and
test credits. It does not currently send study content to an AI model, perform a
real AI request, or make a real charge.

StudyApp may check Markellos Cloud Core readiness so the interface can show
whether future AI services appear available. That operational request is not
cloud sync and must not contain study material or other user study data.

The intended production AI model is documented in
[`docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md`](docs/AI_ASSISTANT_AND_CLOUD_BOUNDARIES.md).

## Product direction

The long-term product remains **local-first, private by default, and
user-controlled**. Optional cloud-assisted AI may help the user transform or
understand selected material, but it must not quietly become a general cloud
learning platform, automatic library scanner, cloud backup, or remote content
store.

The user, not the assistant, controls:

- which task is requested;
- which text, document, chapter, or pasted content is used;
- whether the request is sent;
- whether the result is trusted, edited, discarded, or saved;
- whether any future paid credit is spent.

## Current navigation model

The product interface has Home plus four clear study areas. Material is added or
removed at the destination where it will be read, while each area keeps a
distinct learning purpose.

```text
Library from Source   = add, read, classify, and remove original/source material
Structured Study      = add, read, classify, and remove material by structure and level
Learn & Practice      = practise and consolidate knowledge
Split PDF Tool        = upload a PDF as direct input and split it in the browser
AI Assistant preview  = support selected study work without becoming a material store
```

### Library from Source

Purpose: **manage and read source material**.

This area is for primary and reference material, such as:

- Books;
- Articles;
- Papers;
- Source or external notes;
- My Notes;
- Summaries.

Source files and links are added, classified, opened, corrected, and removed
here so their management remains beside their final reading destination.

### Structured Study

Purpose: **read and understand material through structure**.

This area is for studying material through levels such as:

- Contents;
- Chapters;
- Sections / Paragraphs;
- Key Concepts;
- Bibliography / References;
- Images / Diagrams.

It stays focused on structured reading and understanding. Structured files and
links may be added, classified, opened, corrected, and removed here.

### Learn & Practice

Purpose: **practise and consolidate**.

This area is for:

- Flashcards;
- Due review;
- Quizzes;
- Practice;
- Progress.

It transforms studied material into recall, review, testing, and measurable
learning.

### Split PDF Tool

Purpose: **PDF utility only**, with direct PDF input for splitting.

It must not become a general material manager or add non-PDF uploads, cloud-link
uploads, or general remove/manage workflows.

### AI Assistant

Purpose: **optional assistance on material the user chooses**.

The assistant may eventually help the user:

- ask questions about selected material;
- create draft flashcards;
- create draft quizzes;
- summarise selected material;
- explain difficult concepts;
- suggest connections, examples, comparisons, or study prompts.

It must not automatically read the full library, silently save its output,
replace source reading, hide uncertainty, or make irreversible study or payment
decisions for the user.

## Machine-readable summary

```yaml
project_identity:
  name: StudyApp
  category: local-first personal knowledge and learning system
  primary_user_goal: understand, organise, remember, review, and retrieve knowledge from study material
  not_only:
    - flashcards_app
    - ai_chat_interface
  privacy_model: local-first and private by default
  current_account_system: none
  current_cloud_storage: none
  current_cloud_sync: none

current_capability_layers:
  local_study:
    status: released
    storage: browser_indexeddb
    offline_ready: true
  ai_assistant:
    status: preview_test_mode
    results: mock
    credits: test_only
    real_ai_request: false
    real_payment: false
  cloud_core_readiness:
    status: operational_health_check
    may_send_study_content: false

current_navigation_areas:
  library_from_source:
    purpose: manage and read original/source material
  structured_study:
    purpose: manage, read, and understand material by structure and level
  learn_and_practice:
    purpose: practise and consolidate knowledge
  split_pdf_tool:
    purpose: split local PDFs in browser

future_ai_principles:
  - explicit_task_selection
  - explicit_material_selection
  - explicit_confirmation
  - data_minimisation
  - visible_cost_before_start
  - review_before_local_save
  - no_hidden_sync
  - no_automatic_library_scan
  - failure_without_silent_charge
```

## Core product model

```text
Source Material
├── Library from Source
│   └── Add, read, classify, and remove original/source material
└── Structured Study
    ├── Contents
    ├── Chapters
    ├── Sections / Paragraphs
    ├── Images / Diagrams
    ├── Bibliography / References
    └── Key Concepts
        └── Learn & Practice
            ├── Flashcards
            ├── Quiz items
            ├── Review history
            └── Progress

Split PDF Tool
└── Upload PDF for direct split input
    └── Split PDF into local PDF files

Optional AI Assistant
└── User selects task and exact material
    └── User reviews scope and estimated cost
        └── User confirms remote task
            └── User reviews result
                └── User chooses whether to save locally
```

Source material is not only stored. It should become structured knowledge that
can be studied, tested, connected, reviewed, and recalled. AI assistance may
accelerate selected transformations, but it must preserve source traceability
and user judgement.

## What the user should be able to do

The application should help the user study a topic deeply and systematically.
The user should be able to add or save PDFs, Word documents, links, images,
diagrams, charts, notes, bibliographic items, and references.

The user should then be able to:

1. read original/source material in **Library from Source**;
2. read and understand the same material through structure in
   **Structured Study**;
3. practise and consolidate knowledge in **Learn & Practice**;
4. add or remove source material in **Library from Source**;
5. add or remove structured material in **Structured Study**;
6. upload and split a PDF directly in **Split PDF Tool**;
7. optionally ask for AI assistance on deliberately selected material;
8. review AI output before deciding whether it becomes local study content;
9. understand the maximum estimated cost before any future paid task starts.

## Cognitive learning goal

StudyApp should support more than passive reading. The learning workflow should
use:

- attention — helping the user focus on what matters;
- perception — using text, images, diagrams, charts, and visual structure;
- comprehension — moving from source reading to structured reading and practice;
- memory encoding — creating meaningful concepts, associations, examples, and
  summaries;
- active recall — requiring retrieval before showing the answer;
- spaced repetition — revisiting material at the right time;
- classification — organising knowledge by source, chapter, concept, and type;
- metacognition — showing what is known, weak, forgotten, due, or improving;
- application — turning knowledge into questions, problems, examples, and
  practice;
- critical judgement — reviewing generated suggestions rather than accepting
  them automatically.

## Design principles

1. **Local-first and private by default**  
   Core study data remains local unless the user deliberately chooses an
   approved remote action. Local browser storage is not permanent storage or a
   complete backup.

2. **Clear separation of app areas**  
   Library manages source material, Structured Study manages material by
   structure, Learn & Practice supports active learning, and Split PDF Tool is a
   PDF-only utility. AI Assistant supports selected work without becoming a new
   material store.

3. **Explicit remote use**  
   A future AI request must use only material the user selects and confirms.
   Opening a document, visiting a page, or checking service health is not
   consent to upload content.

4. **Source material remains primary**  
   AI output must not replace source reading or remove traceability to the
   original material.

5. **Multiple depths of reading**  
   Support movement from source material to contents, chapters, sections,
   concepts, references, diagrams, and practice.

6. **Structured knowledge over scattered notes**  
   Decompose books and topics into meaningful units and relationships.

7. **Active learning over passive storage**  
   The final purpose is recall, review, quiz, repetition, understanding, and
   long-term retention.

8. **Traceability to sources**  
   Flashcards, notes, summaries, concepts, and AI-assisted drafts should point
   back to their source where practical.

9. **Review before persistence**  
   Generated content remains a draft until the user reviews and saves it.

10. **Data integrity before feature speed**  
    Imports, backups, restores, migrations, deletion, remote tasks, and progress
    tracking must protect user data from silent loss or corruption.

11. **Transparent cost and failure**  
    A future paid task must show its maximum estimated cost before confirmation
    and must not silently charge after failure or cancellation.

12. **Progress reflects real learning**  
    Statistics should reveal knowledge strength, weak areas, due reviews,
    forgotten material, and improvement—not merely activity volume.

## Feature alignment

A feature is aligned when it helps the user:

- add, classify, read, or remove useful material at the correct destination;
- understand material through structure;
- connect concepts to sources, examples, diagrams, or references;
- create or improve active recall;
- schedule review at the right time;
- identify weak knowledge;
- retrieve information through useful filters;
- protect local data and privacy;
- request optional assistance with explicit scope and control;
- review generated output critically before saving it.

A feature is probably not aligned when it:

- makes the main study areas overlap without a clear reason;
- turns StudyApp into a generic cloud learning platform;
- treats uploaded material as dead storage;
- makes accounts, backend storage, analytics, or telemetry mandatory for core
  study use;
- scans or uploads study material automatically;
- hides what content is sent remotely;
- saves AI output without review;
- optimises only for content quantity;
- hides source traceability or uncertainty;
- risks silent data loss or duplicate charging;
- makes the learning model less understandable.

## Alignment checklist

Before significant changes, contributors should ask:

1. Does the change preserve the separation of the four study areas?
2. Does material management stay at its reading destination?
3. Does it support the broader knowledge-and-learning vision?
4. Does it preserve local-first privacy for core use?
5. Does it help movement between source, structure, concept, and recall?
6. Does it protect imported material, progress, and backups?
7. Does it keep source material usable and traceable?
8. For remote work, is the selected data exact, minimal, visible, and confirmed?
9. Is generated output reviewed before local save?
10. Are cost, failure, cancellation, and retry semantics understandable?
11. Does the system remain understandable to the user?

When an answer is unclear, document the assumption before implementation.
