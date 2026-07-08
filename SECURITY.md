# Security Policy

## Supported model

StudyApp is a local-first browser application. It has no backend, no account system, no first-party analytics, and no intentional cloud sync by default.

## Security and privacy boundaries

- Do not send study material, local files, progress, settings, or backups to external services unless a future feature explicitly states that behavior and is approved by the project owner.
- Do not add analytics, telemetry, advertising, tracking, accounts, or remote storage without explicit approval.
- Do not commit secrets, tokens, generated user backups, local database exports, private URLs, or personal user material.
- Keep external links protected with `rel="noopener noreferrer"` when opened in a new tab.
- Support only explicitly allowed URL protocols for user-saved links.
- Avoid rendering user-controlled HTML.

## Local file handling

Local files are stored in the browser's IndexedDB. Treat these files as private user data.

Changes touching local files should consider:

- file size limits;
- browser storage quota;
- content validation;
- duplicate detection;
- backup/export expectations;
- deletion confirmation;
- relationships between source files and split PDFs.

## Reporting issues

For now, report security or privacy concerns through a private channel to the repository owner. Do not open public issues containing private data, credentials, or exploitable details.

## Dependency maintenance

Dependencies should be updated in small PRs with the lockfile committed. Run the standard checks before merging dependency changes:

```bash
npm test
npm run typecheck
npm run build
```
