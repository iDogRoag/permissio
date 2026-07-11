# Share Copy

## Show HN title

Show HN: Permissio, a least privilege checker for GitHub Actions permissions

## Show HN post body

I built Permissio because many GitHub Actions workflows still run with implicit or overly broad GITHUB_TOKEN permissions.

It scans .github/workflows and recommends explicit job level permissions like contents: read, pages: write, id-token: write, or permissions: {}.

It also emits SARIF with exact YAML locations, so findings can appear directly in GitHub code scanning.

It runs offline, does not call the GitHub API, and does not use AI.

Permissio is a focused permissions minimizer, not a full GitHub Actions security scanner. I would use it alongside tools like zizmor and runtime hardening tools, not instead of them.

Try it:

```sh
npx @idogee/permissio demo
npx @idogee/permissio check .
```

## Reddit post

I built Permissio, a small OSS CLI that scans GitHub Actions workflows and recommends explicit least privilege `GITHUB_TOKEN` permissions for each job.

It is meant for workflows that still rely on implicit defaults, `read-all`, `write-all`, or workflow-level write permissions. It runs offline, does not call the GitHub API, prints copy-paste snippets, and can upload exact findings to GitHub code scanning through SARIF.

Demo:

```sh
npx @idogee/permissio demo
```

I am looking for real-world workflow examples that produce false positives or missing recommendations.

## X post

I built Permissio: find overprivileged GitHub Actions tokens before they become invisible CI/CD risk.

It scans `.github/workflows`, recommends explicit job-level `GITHUB_TOKEN` permissions, and emits SARIF with exact YAML locations for GitHub code scanning.

Runs offline. No GitHub API. No AI. Focused on permissions, not a full security scanner.

`npx @idogee/permissio demo`

## LinkedIn post

I built Permissio, an open source CLI for reviewing GitHub Actions `GITHUB_TOKEN` permissions.

Many workflows still run with implicit or overly broad permissions. Permissio scans `.github/workflows` and recommends explicit job-level settings such as `contents: read`, `pages: write`, `id-token: write`, or `permissions: {}`.

SARIF output sends findings to GitHub code scanning with exact workflow locations, while terminal, Markdown, JSON, and HTML reports support local review.

It runs offline, does not call the GitHub API, and is intended to complement existing GitHub Actions security tools.

## GitHub release notes

Permissio is a focused static analyzer for GitHub Actions `GITHUB_TOKEN` permissions.

Highlights:

- `permissio check` scans workflows and recommends job-level permissions.
- `permissio demo` shows a bundled risky example.
- Table, Markdown, JSON, HTML, and SARIF reports with exact YAML source locations.
- Permission score and optional badge Markdown.
- Offline and read-only by default.

## npm package description

GitHub Actions permission minimizer for least privilege GITHUB_TOKEN settings.
