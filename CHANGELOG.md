# Changelog

All notable changes to permissio will be documented in this file.

## 0.3.0 - 2026-07-10

- Added SARIF 2.1.0 output for GitHub code scanning.
- Added exact YAML source locations to findings across JSON, SARIF, terminal, Markdown, and HTML reports.
- Reduced duplicate scope findings for `write-all` and made incomplete scans report the permission score as unavailable.
- Updated the SARIF upload example to CodeQL Action v4 and added Node.js 26 to CI coverage.

## 0.2.2 - 2026-06-02

- Fixed installed CLI execution through npm's `.bin/permissio` symlink.
- Added regression coverage for symlinked npm bin invocation.

## 0.2.1 - 2026-06-02

- Finalized npm package identity as `@idogee/permissio`.
- Kept the GitHub repository at `iDogRoag/permissio` and the CLI binary as `permissio`.
- Added public scoped npm publish configuration and publish verification docs.
- Added CI-compatible `--ci` flag support for documented GitHub Actions usage.
- Updated release readiness tests for package metadata and npm publish docs.

## 0.2.0 - 2026-06-01

- Added `permissio demo` with table, Markdown, JSON, and HTML output.
- Added permission score and optional badge Markdown output.
- Added bundled examples, demo assets, launch docs, share copy, and good first issue seeds.
- Polished README and contributor docs for launch readiness.
- Prepared the scoped npm package as `@idogee/permissio`.

## 0.1.0 - 2026-06-01

- Initial OSS release.
- Added `permissio check` for static GitHub Actions permission recommendations.
- Added table, JSON, and Markdown reporters.
- Added JSON `schemaVersion` and finding categories.
- Added scoped package metadata for `@idogee/permissio` while keeping the `permissio` CLI binary.
- Added Node.js 22.13+ support metadata, Node 22.13/24 CI, ESLint, and package dry-run checks.
- Added deterministic inference rules for checkout, Pages, attestations, OIDC, packages, releases, PRs, issues, checks, statuses, deployments, security events, actions, discussions, models, and vulnerability alerts.
- Added risk findings for broad permissions, implicit `pull_request_target` defaults, and risky `pull_request_target` workflows.
