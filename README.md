# permissio

permissio is a static analyzer for GitHub Actions permissions. It scans workflow files and suggests explicit least-privilege `GITHUB_TOKEN` permissions for each job.

## Why this exists

Many GitHub Actions workflows have no explicit permissions, use `read-all`, use `write-all`, or grant write permissions at the workflow level when only one job needs them. permissio helps maintainers replace broad or implicit permissions with recommended, inferred, job-level permissions.

It does not call the GitHub API, use AI, require a token, or modify files by default.

## Install

The `permissio` npm registry name is currently occupied by an unrelated package. Until registry ownership is resolved, install this project from GitHub after the repository is public:

```sh
npm install --save-dev github:iDogRoag/permissio
```

For local development:

```sh
git clone https://github.com/iDogRoag/permissio.git
cd permissio
npm install
npm run build
```

## Usage

```sh
permissio check
permissio check .
permissio check ./my-repo
permissio check --format json
permissio check --format markdown
permissio check --fail-on high
permissio check --fail-on changes
permissio check --show-snippets
```

The default path is the current working directory. The MVP expects a directory path and scans `.github/workflows/*.{yml,yaml}` by default.

## Options

| Flag | Default | Description |
| --- | --- | --- |
| `--format table\|json\|markdown` | `table` | Output format. |
| `--fail-on none\|high\|changes` | `none` | Exit `1` for high findings or any recommended changes. |
| `--show-snippets` | `false` | Print copy-paste YAML snippets for job-level permissions. |
| `--include "glob"` | none | Add extra workflow globs. |
| `--quiet` | `false` | Only print findings, not intro text. |

Exit codes:

- `0`: scan completed and the selected fail policy did not trigger
- `1`: findings triggered `--fail-on high` or `--fail-on changes`
- `2`: internal error, invalid CLI input, or unreadable workflow file

## Example Output

```txt
.github/workflows/ci.yml
  job test
    current      implicit default
    recommended permissions: contents read
    findings     medium No explicit permissions at workflow or job level
    reasons      checkout needs repository contents
```

With `--show-snippets`:

```yaml
jobs:
  test:
    permissions:
      contents: read
```

For a job that appears to need no token permissions:

```yaml
jobs:
  lint:
    permissions: {}
```

## GitHub Actions Usage

This does not need to be a marketplace action. Until npm registry ownership is resolved, install it from GitHub before running the binary:

```yaml
name: Check GitHub Actions permissions

on:
  pull_request:
  push:
    branches:
      - main

permissions:
  contents: read

jobs:
  permissio:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 20
      - run: npm install --no-save github:iDogRoag/permissio
      - run: ./node_modules/.bin/permissio check --format markdown --fail-on high
```

## What It Detects

permissio uses deterministic static rules for common GitHub Actions permission needs:

- `actions/checkout` -> `contents: read`
- GitHub Pages deployment -> `pages: write`, `id-token: write`
- artifact attestations -> `attestations: write`, `artifact-metadata: write`, `id-token: write`, `contents: read`
- OIDC cloud authentication -> `id-token: write`
- GitHub Packages and `ghcr.io` publishing -> `packages: write`
- release creation/upload -> `contents: write`
- issue and pull request writes -> `issues: write` or `pull-requests: write`
- checks, statuses, deployments, security events, actions, discussions, models, and vulnerability alert reads
- risky `pull_request_target` permission patterns
- broad `write-all`, broad `read-all`, implicit permissions, unknown scopes, and unknown third-party actions

Recommendations are sorted deterministically so JSON output is stable for CI.

## What It Does Not Detect

permissio is static analysis, not a formal proof. It does not:

- call the GitHub API
- inspect repository or organization default token settings
- execute workflows or shell scripts
- infer behavior inside remote reusable workflows
- perfectly parse every possible shell command
- auto-edit workflow files

The npm package name `permissio` is not currently owned by this project. Avoid `npx permissio` unless the registry ownership has been resolved; otherwise npm may run an unrelated package.

When permissions are missing, permissio reports an implicit default and recommends explicit job-level permissions. It intentionally does not try to model org or repo default settings.

## JSON Shape

JSON output has a stable top-level shape:

```json
{
  "summary": {
    "filesScanned": 0,
    "workflowsScanned": 0,
    "jobsScanned": 0,
    "high": 0,
    "medium": 0,
    "low": 0,
    "jobsWithRecommendedChanges": 0
  },
  "workflows": [],
  "findings": []
}
```

Each job includes:

- `filePath`
- `workflowName`
- `jobId`
- `jobName`
- `current`
- `recommended`
- `reasons`
- `findings`
- `snippet`
- `hasRecommendedChanges`

## Safety

permissio recommends likely least-privilege permissions. Review every recommendation before applying it, especially for complex scripts or third-party actions. The MVP does not implement `--fix`; copy-paste snippets are printed only when requested.

## Development

```sh
npm install
npm run check
npm test
npm run build
```

Useful local checks:

```sh
node dist/cli.js check test/fixtures --include "*.yml" --format json
node dist/cli.js check . --show-snippets
```

## Roadmap

- `--fix` with comment-preserving YAML edits
- more rules for popular third-party actions
- SARIF output
- stricter JSON schema documentation
- baseline mode for gradual adoption

## Contributing

Issues and pull requests are welcome. New rules should be deterministic, explainable, and covered by fixtures.

## License

MIT
