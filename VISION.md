# StudyApp Vision

## One-sentence vision

StudyApp is intended to become a **local-first personal knowledge and learning system**: a private workspace where a user can collect study material, understand it at multiple depths, transform it into active learning, and retrieve knowledge through meaningful filters.

It should not be understood only as a flashcards app. Flashcards, quizzes, review queues, and spaced repetition are learning tools inside a broader system for organising, understanding, remembering, and recalling knowledge.

## Machine-readable summary

```yaml
project_identity:
  name: StudyApp
  category: local-first personal knowledge and learning system
  primary_user_goal: understand, organise, remember, review, and retrieve knowledge from study material
  not_only: flashcards app
  privacy_model: local-first, offline-ready, no account, no backend by default

core_capabilities:
  - ingest_study_material
  - read_material_at_multiple_depths
  - structure_books_and_topics
  - classify_knowledge_by_perspective
  - generate_or_manage_flashcards
  - learn_with_spaced_repetition
  - practise_with_quizzes
  - support_multiple_cognitive_functions
  - retrieve_information_with_filters
  - track_progress_and_weak_areas

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

knowledge_levels:
  - subject
  - source
  - table_of_contents
  - chapter
  - section
  - heading
  - subheading
  - paragraph
  - concept
  - example
  - image
  - diagram
  - chart
  - bibliography_item
  - reference

perspective_layers:
  - historical
  - scientific
  - theoretical
  - practical
  - philosophical
  - technical
  - methodological

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

retrieval_filters:
  - source
  - book
  - chapter
  - section
  - concept
  - perspective
  - material_type
  - difficulty
  - due_status
  - review_history
  - bibliography
  - reference
```

## What the user wants to be able to do

The application should help the user study a topic deeply and systematically.

The user should be able to import or save anything that may help with a subject, including PDFs, Word documents, links, images, diagrams, charts, notes, bibliographic items, and references.

The user should be able to read and explore a book or topic at many different levels of depth:

- as a general overview;
- as a table of contents;
- by chapter;
- by heading and subheading;
- by paragraph and full text;
- by concept;
- through diagrams, charts, images, examples, bibliography, and references.

The user should also be able to divide and understand the same source through different knowledge perspectives, such as historical, scientific, theoretical, practical, philosophical, technical, or methodological perspectives.

The application should then help transform that material into active learning through repetition, flashcards, quizzes, due reviews, self-testing, and recall from memory.

The user should be able to store and retrieve information in many forms and through many filters, for example by chapter, concept, source, material type, perspective, difficulty, due date, progress state, bibliography, or reference.

## Core product model

The long-term product model is:

```text
Source Material
└── Structured Reading Layers
    ├── Table of contents
    ├── Chapters
    ├── Sections
    ├── Headings and subheadings
    ├── Paragraphs
    ├── Images, diagrams and charts
    ├── Bibliography and references
    └── Concepts
        ├── Notes and summaries
        ├── Questions
        ├── Flashcards
        ├── Quiz items
        ├── Review history
        └── Retrieval filters
```

This means source material is not only stored. It should become structured knowledge that can be studied, tested, connected, reviewed, and recalled.

## Cognitive learning goal

StudyApp should support more than passive reading. The learning workflow should use many cognitive functions, including:

- attention: helping the user focus on what matters;
- perception: using text, images, diagrams, charts, and visual structure;
- comprehension: moving from overview to details and from details back to overview;
- memory encoding: creating meaningful concepts, associations, examples, and summaries;
- active recall: requiring the user to retrieve knowledge before seeing the answer;
- spaced repetition: revisiting material at the right time;
- classification: organising knowledge by chapter, concept, perspective, and type;
- comparison: showing similarities, differences, causes, consequences, and relationships;
- metacognition: showing what is known, weak, forgotten, due, or improving;
- application: turning knowledge into questions, problems, examples, and practice.

## Design principles

1. **Local-first and private by default**  
   User content, progress, study files, and settings should remain local unless the user explicitly exports or chooses another behaviour.

2. **Source material must remain useful after import**  
   It is not enough to upload a file or save a link. The user must be able to find it, open it, manage it, connect it to concepts, and use it for study.

3. **Multiple depths of reading**  
   The app should support movement from high-level overview to detailed text and back again.

4. **Structured knowledge over scattered notes**  
   Books and topics should be decomposed into meaningful units: chapters, sections, headings, concepts, examples, images, diagrams, bibliography, and references.

5. **Active learning over passive storage**  
   The final purpose of stored material is learning: recall, review, quiz, repetition, understanding, and long-term retention.

6. **Flexible classification**  
   The same material may need different views: by chapter, concept, historical layer, scientific layer, practical use, difficulty, or progress state.

7. **Traceability to sources**  
   Flashcards, notes, summaries, and concepts should be able to point back to the source material, chapter, page, paragraph, image, or reference where they came from where practical.

8. **Human-readable and agent-readable documentation**  
   Project intent should be written clearly enough for both human contributors and AI coding agents to understand future feature decisions.

9. **Data integrity before feature speed**  
   Imports, backups, restores, migrations, deletion, and progress tracking must protect user data from silent loss or corruption.

10. **Progress should reflect real learning**  
    Statistics should not only count activity. They should help the user see knowledge strength, weak areas, due reviews, forgotten material, and improvement over time.

## Feature implications

Future features should be evaluated against the vision above.

A feature is aligned with the product vision if it helps the user do at least one of these:

- add or manage useful study material;
- understand material at a deeper or clearer level;
- break material into meaningful structures;
- connect concepts to sources, examples, diagrams, or references;
- create or improve active recall;
- schedule review at the right time;
- identify weak knowledge;
- retrieve information through useful filters;
- protect local data and privacy.

A feature is probably not aligned if it:

- turns the app into a generic cloud learning platform;
- treats uploaded material as dead file storage;
- makes the app depend on accounts, backend storage, analytics, or telemetry by default;
- optimises only for flashcard quantity without preserving source structure and understanding;
- hides source traceability;
- risks silent data loss;
- makes the learning model less understandable to the user.

## Non-goals

StudyApp is not intended to be:

- only a flashcards app;
- only a file-storage app;
- a generic LMS;
- a social learning platform;
- a backend-first cloud application;
- an opaque AI summariser that loses connection to the original source;
- a tool that stores private study material remotely by default.

## Agent alignment checklist

Before making significant changes, human contributors and AI agents should ask:

1. Does this change support the broader knowledge-and-learning vision, not only a narrow UI task?
2. Does it preserve local-first privacy?
3. Does it help the user move between overview, structure, detail, concept, and recall?
4. Does it protect imported material, progress, and backups from silent loss?
5. Does it keep source material usable after import?
6. Does it improve retrieval, filtering, review, or understanding?
7. Does it keep the system understandable to the user?

If the answer to these questions is unclear, prefer documenting the assumption before implementing the change.
