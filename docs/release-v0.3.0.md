# v0.3.0 Release Notes

Permissio v0.3.0 makes findings easier to act on and easier to integrate into GitHub.

## Highlights

- Added SARIF 2.1.0 output for GitHub code scanning.
- Added exact one-based YAML line and column locations to findings.
- Added stable SHA-256 fingerprints so code-scanning findings remain identifiable across runs.
- Reduced repetitive findings caused by `write-all` while preserving explicit permission checks.
- Marked scans with YAML parse failures as `incomplete` instead of showing a misleading permission score.
- Updated the GitHub code-scanning example to CodeQL Action v4.
- Added Node.js 26 to CI while keeping Node.js 22.13 as the minimum and Node.js 24 as the recommended LTS release.
- Refreshed terminal, Markdown, HTML, and screenshot demo assets.

## Install

```sh
npx @idogee/permissio@0.3.0 check .
```

For a local development dependency:

```sh
npm install --save-dev @idogee/permissio@0.3.0
npx permissio check .
```

For a global install:

```sh
npm install -g @idogee/permissio@0.3.0
permissio check .
```

## GitHub Code Scanning

```sh
npx @idogee/permissio@0.3.0 check . --ci --format sarif --output permissio.sarif --fail-on high
```

Upload `permissio.sarif` with `github/codeql-action/upload-sarif@v4` to display findings at their exact workflow locations.

## Project Identity

- GitHub repository: `iDogRoag/permissio`
- npm package: `@idogee/permissio`
- CLI command: `permissio`

## Verification

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm pack --dry-run`
- `npm view @idogee/permissio version`
- `npx @idogee/permissio@0.3.0 --version`
- `npx @idogee/permissio@0.3.0 demo`
