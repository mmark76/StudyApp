# StudyApp Vision

## One-sentence vision

StudyApp is intended to become a **local-first personal knowledge and learning system**: a private workspace where a user can add study material, read it from source, study it through structure, practise it through active recall, and retrieve knowledge through meaningful filters.

It should not be understood only as a flashcards app. Flashcards, quizzes, review queues, and spaced repetition are learning tools inside a broader system for organising, understanding, remembering, and recalling knowledge.

## Current navigation model

The current product interface has Home plus four clear study areas. Material is
added or removed at the destination where it will be read, while each area keeps
a distinct learning purpose.

```text
Library from Source   = add, read, classify, and remove original/source material
Structured Study      = add, read, classify, and remove material by structure and level
Learn & Practice      = practise and consolidate knowledge
Split PDF Tool        = upload a PDF as direct input and split it in the browser
```

### Library from Source

Purpose: **manage and read source material**.

This area is for reading primary/source material and reference material, such as:

- Books
- Articles
- Papers
- Source or external notes
- My Notes
- Summaries

Source files and links are added, classified, opened, corrected, and removed
here so their management remains beside their final reading destination.

### Structured Study

Purpose: **read and understand material through structure**.

This area is for studying the same source material by levels and structures, such as:

- Contents
- Chapters
- Sections / Paragraphs
- Key Concepts
- Bibliography / References
- Images / Diagrams

It stays focused on structured reading and understanding. Structured files and
links may be added, classified, opened, corrected, and removed here.

### Learn & Practice

Purpose: **practise and consolidate**.

This area is for active learning and memory work:

- Flashcards
- Due review
- Quizzes
- Practice
- Progress

This area transforms studied material into recall, review and testing.

### Split PDF Tool

Purpose: **PDF utility only**, with one explicit exception.

This area contains the local browser-only PDF splitting tool. Its **Upload PDF**
action uploads a PDF directly as input for splitting. It should not become a
general material manager and should not add support for non-PDF uploads, cloud
links, or general remove/manage workflows.

## Machine-readable summary

```yaml
project_identity:
  name: StudyApp
  category: local-first personal knowledge and learning system
  primary_user_goal: understand, organise, remember, review, and retrieve knowledge from study material
  not_only: flashcards app
  privacy_model: local-first, offline-ready, no account, no backend by default

current_navigation_areas:
  library_from_source:
    purpose: manage and read original/source material
    allowed_actions:
      - add_source_material
      - read
      - classify_source_material
      - remove_source_material
  structured_study:
    purpose: manage, read, and understand material by structure and level
    allowed_actions:
      - add_structured_material
      - read
      - study_by_structure
      - classify_structured_material
      - remove_structured_material
  learn_and_practice:
    purpose: practise and consolidate knowledge
    allowed_actions:
      - flashcards
      - review
      - quiz
      - progress
  split_pdf_tool:
    purpose: split local PDFs in browser
    allowed_actions:
      - upload_pdf_for_splitting
      - split_pdf
    not_for:
      - add_non_pdf_material
      - add_cloud_link
      - remove_material
      - manage_general_material

source_material_types:
  - pdf
  - word_document
  - text_file
  - csv
  - image
  - diagram
  - chart
  - web_link
  - cloud_link
  - bibliography
  - reference

structured_study_levels:
  - source
  - table_of_contents
  - chapter
  - section
  - paragraph
  - concept
  - image
  - diagram
  - chart
  - bibliography_item
  - reference

learning_methods:
  - active_recall
  - spaced_repetition
  - flashcards
  - quizzes
  - summaries
  - concept_mapping
  - comparison
  - classification
  - visual_learning
  - metacognitive_review
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
```

This means source material is not only stored. It should become structured knowledge that can be studied, tested, connected, reviewed, and recalled.

## What the user wants to be able to do

The application should help the user study a topic deeply and systematically.

The user should be able to add or save anything that may help with a subject, including PDFs, Word documents, links, images, diagrams, charts, notes, bibliographic items, and references.

The user should then be able to:

1. read original/source material in **Library from Source**;
2. read and understand the same material through structure in **Structured Study**;
3. practise and consolidate knowledge in **Learn & Practice**;
4. add or remove source material in **Library from Source**;
5. add or remove structured material in **Structured Study**;
6. upload and split a PDF directly in **Split PDF Tool** when needed.

## Cognitive learning goal

StudyApp should support more than passive reading. The learning workflow should use many cognitive functions, including:

- attention: helping the user focus on what matters;
- perception: using text, images, diagrams, charts, and visual structure;
- comprehension: moving from source reading to structured reading and then to practice;
- memory encoding: creating meaningful concepts, associations, examples, and summaries;
- active recall: requiring the user to retrieve knowledge before seeing the answer;
- spaced repetition: revisiting material at the right time;
- classification: organising knowledge by source, chapter, concept and type;
- metacognition: showing what is known, weak, forgotten, due, or improving;
- application: turning knowledge into questions, problems, examples, and practice.

## Design principles

1. **Local-first and private by default**  
   User content, progress, study files, and settings should remain local unless the user explicitly exports or chooses another behaviour.

2. **Clear separation of app areas**  
   Library from Source manages and reads source material. Structured Study
   manages and reads material by structure. Learn & Practice is for active
   learning. Split PDF Tool is a PDF-only splitting utility.

3. **Source material must remain useful after import**  
   It is not enough to upload a file or save a link. The user must be able to find it, open it, read it, structure it, connect it to concepts, and use it for study.

4. **Multiple depths of reading**  
   The app should support movement from source material to structured levels such as contents, chapters, sections, concepts, references and diagrams.

5. **Structured knowledge over scattered notes**  
   Books and topics should be decomposed into meaningful units: chapters, sections, concepts, examples, images, diagrams, bibliography, and references.

6. **Active learning over passive storage**  
   The final purpose of stored material is learning: recall, review, quiz, repetition, understanding, and long-term retention.

7. **Traceability to sources**  
   Flashcards, notes, summaries, and concepts should be able to point back to the source material, chapter, page, paragraph, image, or reference where practical.

8. **Data integrity before feature speed**  
   Imports, backups, restores, migrations, deletion, and progress tracking must protect user data from silent loss or corruption.

9. **Progress should reflect real learning**  
   Statistics should not only count activity. They should help the user see knowledge strength, weak areas, due reviews, forgotten material, and improvement over time.

## Feature implications

A feature is aligned with the product vision if it helps the user do at least one of these:

- add or remove useful study material at its Library or Structured Study destination;
- upload a PDF directly inside Split PDF Tool only for immediate split use;
- read source material where its classification and lifecycle remain visible;
- understand material at a deeper or clearer level through structure;
- connect concepts to sources, examples, diagrams, or references;
- create or improve active recall;
- schedule review at the right time;
- identify weak knowledge;
- retrieve information through useful filters;
- protect local data and privacy.

A feature is probably not aligned if it:

- makes the five main areas overlap in purpose beyond the explicit Upload PDF exception in Split PDF Tool;
- turns the app into a generic cloud learning platform;
- treats uploaded material as dead file storage;
- makes the app depend on accounts, backend storage, analytics, or telemetry by default;
- optimises only for flashcard quantity without preserving source structure and understanding;
- hides source traceability;
- risks silent data loss;
- makes the learning model less understandable to the user.

## Agent alignment checklist

Before making significant changes, human contributors and AI agents should ask:

1. Does this change preserve the separation between Library from Source, Structured Study, Learn & Practice, and Split PDF Tool?
2. Does material management stay at its reading destination, with only PDF input in Split PDF Tool?
3. Does it support the broader knowledge-and-learning vision, not only a narrow UI task?
4. Does it preserve local-first privacy?
5. Does it help the user move between source reading, structure, concept, and recall?
6. Does it protect imported material, progress, and backups from silent loss?
7. Does it keep source material usable after import?
8. Does it keep the system understandable to the user?

If the answer to these questions is unclear, prefer documenting the assumption before implementing the change.
