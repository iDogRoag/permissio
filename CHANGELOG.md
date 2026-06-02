# Changelog

All notable changes to permissio will be documented in this file.

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
