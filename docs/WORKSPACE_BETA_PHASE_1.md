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
  existing study/practice views. Progress remains the route for Backup,
  Restore and Archive. The column is visible by default and can be hidden
  without unmounting or clearing the selected workspace view.
- The central upper workspace uses the existing routes and data model. In
  Windows Local only, an active study/practice tool exposes the existing
  transient Local ChatGPT conversation beneath it. Browser/PWA builds do not
  render a substitute in-app chat.

## Explicitly deferred

AI-Assisted Structuring and AI-Assisted Tools processing are not implemented.
They require separate approved request, consent, privacy, validation and save
contracts before activation. This phase does not change IndexedDB schema,
backup format, AI transport, consent, credits, payments or deployment.
