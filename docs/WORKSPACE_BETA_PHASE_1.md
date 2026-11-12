# Workspace BETA Phase 1

## Completed UI refactor

Workspace BETA now uses the approved three-column presentation:

```text
Sources & Materials | AI Studio - Workspace | AI-Assisted Tools
```

- Sources preserves the Library's six categories and its existing import and
  management routes. Structured Study has Manual Import, its existing local
  Split PDF Tool, and an explicitly unavailable AI-Assisted Structuring path.
- AI Studio - Workspace starts with the four approved connection cards. The
  two future modes are disabled. The ChatGPT-plan card is available only in
  Windows Local. Selecting a real mode or a study tool replaces the card grid
  and Back to AI options returns to it without writing, clearing or migrating
  study data.
- AI-Assisted Tools is a compact two-column launcher for the approved eight
  existing study/practice views. The card title is the only bold card text;
  supporting copy uses the shared regular type weight. The column is visible by
  default and can be hidden without unmounting or clearing the selected
  workspace view.
- The central upper workspace presents user results rather than setup
  machinery. Summary shows saved output or an empty result state, and Progress
  shows study results; their existing creation, Backup, Restore and Archive
  workflows open in a focused modal from a discreet action. This does not alter
  their data model, validation or storage behavior. In Windows Local only, an
  active study/practice tool exposes the existing transient Local ChatGPT
  conversation beneath it. Browser/PWA builds do not render a substitute
  in-app chat.

## Explicitly deferred

AI-Assisted Structuring and AI-Assisted Tools processing are not implemented.
They require separate approved request, consent, privacy, validation and save
contracts before activation. This phase does not change IndexedDB schema,
backup format, AI transport, consent, credits, payments or deployment.

## Follow-up regression and typography audit

- Core Knowledge derives `view` from React Router's hash-route location. The
  Learning Goals, Key Points and Important Terms launchers are covered with
  stored-content assertions that verify the other two content types remain
  filtered out.
- Windows Local connection controls, model selection, messages, direct-question
  composer, RAG-unavailable guidance, loading, error and status text use the
  shared Workspace typography tokens. Font choice, text size, UI density,
  colour scheme and light/dark theme continue to come from Appearance Settings.
- The repository boundary test at the 100,000-flashcard compatibility maximum
  keeps the production limit unchanged and has a focused 15-second test budget
  for slower shared CI runners.
- E2E coverage follows the three-column model and verifies Local connected and
  disconnected states, model refresh, direct-question controls, mobile
  containment, English/Greek labels and active-work preservation when switching
  views.

The automated Local checks use the loopback E2E companion contract. Before a
Windows package release, manually start `Start StudyApp Local.bat`, connect and
disconnect a real ChatGPT account, change models, submit a direct question,
switch Appearance settings in both languages and confirm the
draft/conversation remains after changing Workspace views. RAG remains visibly
unavailable until its separate redesign is approved. This Phase 1 PR does not
perform or approve that packaged release test.

StudyApp Local can request launch of a separately installed Writer & Translator from a user-configured folder. The Tools control requires confirmation and does not copy or send study material to the Writer. The web edition does not launch local programs.
