# StudyApp versioning and releases

Adopts the reviewed principles of Markellos Ecosystem AI Agents Lab; StudyApp remains a web/PWA product, not a Windows distributable.

## Version identity

- The root `VERSION` file is the explicit release version (`MAJOR.MINOR.PATCH`).
- `package.json` and `package-lock.json` must agree with `VERSION`. CI verifies this.
- The existing visible footer build identity `vX.Y.Z_YYYYMMDD_HHMM_SHA` remains unchanged, distinguishing individual builds from formal releases.
- Initial baseline: `1.0.0`, matching the existing StudyApp v1 release. Earlier archived checkpoints are retained. Do not retroactively claim a new GitHub Release exists.
- Increment MAJOR for incompatible changes, MINOR for compatible features, PATCH for fixes. Branch/PR work does not imply an immediate bump or public release.

## Two distinct publication paths

**Continuous deployment:** existing exact-SHA CI followed by GitHub Pages deployment on `main`. Every successful main push may publish a new build, but not necessarily a new formal version. Do not confuse build and release.

**Formal releases:** owner-approved manual workflow against a reviewed `main` commit. It requires a matching version, matching tag absent, the reviewed commit still at `main`, completed successful main CI, then builds a source-matched distributable ZIP, checks SHA-256, creates an immutable `vX.Y.Z` tag and GitHub Release asset with checksum. Release archives never include users' browser IndexedDB data. The workflow cannot initiate a new release from an unreviewed feature branch.

Release publication is separate from GitHub Pages deployment; it never automatically rewrites the site's current build. Existing releases and assets must not be overwritten.

## Human approval and gates

1. Agree a release scope and intended version. Keep a change log for the scope.
2. Develop on a separate branch, run focused tests, open and review a PR.
3. Run `npm run check:version`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build`.
4. After authorized merge and successful exact-SHA main CI, verify deployment/build and approve the formal versioned release.
5. Update the three version files together in a reviewed PR **when actually preparing a release**. Do not bump a version only to distinguish a code build.
6. Manually dispatch the release workflow for the reviewed main commit. Verify tag, ZIP, checksum and clean repository state. Record release completion.

Use separate future approval for production deployment or publication changes. Avoid rewriting published tags/history.
