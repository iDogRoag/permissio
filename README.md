# Permissio

Least privilege for GitHub Actions tokens in one command.

Find overly broad GitHub Actions permissions and replace them with explicit least privilege settings.

Permissio scans `.github/workflows` and recommends the smallest likely `GITHUB_TOKEN` permissions for each job.
It helps replace implicit defaults, `read-all`, `write-all`, and broad workflow-level permissions with clear job-level permissions.

```sh
npx @idogroag/permissio check .
```

```sh
npx @idogroag/permissio demo
```

```txt
Permissio

Permission score 54 out of 100
Workflows scanned 3
Jobs scanned 8
Jobs with write-all 1
Jobs missing explicit permissions 5
Jobs with recommended changes 6
High findings 2

Top findings

write-all used at workflow level
pull_request_target has write permissions
id-token write is set but no OIDC use was detected
contents write appears broader than needed
job can use permissions: {}

Suggested snippet

jobs:
  test:
    permissions:
      contents: read
```

```sh
npx @idogroag/permissio demo --format html --output permissio-demo.html
```

Terminal GIF coming soon.
Run `npx @idogroag/permissio demo` to see the same output locally.

## What is Permissio

Permissio is a focused static analyzer for GitHub Actions `GITHUB_TOKEN` permissions.
It scans workflow YAML and recommends explicit job-level `permissions` blocks such as `contents: read`, `pages: write`, `id-token: write`, or `permissions: {}`.

Permissio is not a full GitHub Actions security scanner, and it does not prove that a workflow is safe.

## Why this exists

Many GitHub Actions workflows still rely on implicit token defaults, `read-all`, `write-all`, or workflow-level write permissions when only one job needs them.
Those broad defaults make CI/CD permissions harder to review.

Permissio helps teams review and reduce the token permissions available to each job.

## Quickstart

```sh
npx @idogroag/permissio check .
```

Common options:

```sh
permissio check --show-snippets
permissio check --format markdown
permissio check --format json
permissio check --format html --output permissio-report.html
permissio check --badge
permissio check --fail-on high
```

## Demo

The demo command scans a bundled risky example, so you can try Permissio before pointing it at a repo.

```sh
npx @idogroag/permissio demo
npx @idogroag/permissio demo --format markdown
npx @idogroag/permissio demo --format json
npx @idogroag/permissio demo --format html --output permissio-demo.html
npx @idogroag/permissio demo --show-snippets
npx @idogroag/permissio demo --badge
```

Demo assets:

- [Terminal output](docs/assets/demo-output.txt)
- [Markdown output](docs/assets/demo-output.md)
- [HTML report](docs/assets/demo-report.html)

## Example output

```txt
Permissio

Permission score 54 out of 100
Workflows scanned 3
Jobs scanned 8
Jobs with write-all 1
Jobs missing explicit permissions 5
Jobs with recommended changes 6
High findings 2

Top findings

write-all used at workflow level
pull_request_target has write permissions
id-token write is set but no OIDC use was detected
contents write appears broader than needed
job can use permissions: {}

Suggested snippet

jobs:
  test:
    permissions:
      contents: read
```

## What it detects

Permissio uses deterministic static rules for common GitHub Actions permission needs. See [docs/rules.md](docs/rules.md) for the full rule reference.

- `actions/checkout` -> `contents: read`
- GitHub Pages deployment -> `pages: write`, `id-token: write`
- artifact attestations -> `attestations: write`, `artifact-metadata: write`, `id-token: write`, `contents: read`
- OIDC cloud authentication -> `id-token: write`
- GitHub Packages and `ghcr.io` publishing -> `packages: write`
- release creation or asset upload -> `contents: write`
- issue and pull request writes -> `issues: write` or `pull-requests: write`
- checks, statuses, deployments, security events, actions, discussions, models, and vulnerability alert reads
- risky `pull_request_target` permission patterns
- broad `write-all`, broad `read-all`, implicit permissions, unknown scopes, and unknown third-party actions

## How recommendations work

Permissio infers the smallest likely permission set from workflow structure, known actions, and recognizable command patterns.
Recommendations are conservative and explainable: every inferred permission includes a reason and evidence.

When no `GITHUB_TOKEN` permission appears necessary, Permissio recommends:

```yaml
permissions: {}
```

Review every recommendation before applying it, especially for complex scripts or third-party actions.

## GitHub Actions usage

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
          node-version: 24
      - run: npm install --no-save @idogroag/permissio
      - run: ./node_modules/.bin/permissio check --format markdown --fail-on high
```

## How Permissio is different

zizmor is a GitHub Actions security linter.
StepSecurity Harden Runner focuses on runtime hardening and egress control.
Permissio is a focused static analyzer for GITHUB_TOKEN permissions.

Use them together.

## Install

The CLI binary is `permissio`, but the npm package is scoped as `@idogroag/permissio` because the unscoped `permissio` registry name is owned by another project.

```sh
npm install --save-dev @idogroag/permissio
```

You can also run it without installing:

```sh
npx @idogroag/permissio demo
```

For local development:

```sh
git clone https://github.com/iDogRoag/permissio.git
cd permissio
npm install
npm run build
```

## Configuration

Permissio scans `.github/workflows/*.{yml,yaml}` by default.
Use `--include` to add extra workflow globs:

```sh
permissio check . --include "examples/**/*.yml"
```

Exit codes:

- `0`: scan completed and the selected fail policy did not trigger
- `1`: findings triggered `--fail-on high` or `--fail-on changes`
- `2`: internal error, invalid CLI input, or unreadable workflow file

If no workflows are found, Permissio exits `0` by default and suggests `permissio demo`.

## Report formats

```sh
permissio check --format table
permissio check --format markdown
permissio check --format json
permissio check --format html --output permissio-report.html
```

JSON output includes a stable top-level `schemaVersion`, `summary`, `score`, `workflows`, and `findings`.
Each finding includes `id`, `category`, `severity`, `message`, and location fields.

Permissio can print badge Markdown, but it does not host badges in v1.

```sh
permissio check --badge
```

## Permission score

The permission score is a heuristic from `0` to `100`, not proof of safety.
It starts at `100` and subtracts points for broad or risky permission patterns.

Labels:

- `90` to `100`: strong
- `70` to `89`: good
- `50` to `69`: risky
- `0` to `49`: critical

JSON output includes:

```json
{
  "score": {
    "value": 54,
    "label": "risky",
    "penalties": []
  }
}
```

With `--badge`, JSON also includes:

```json
{
  "badge": {
    "markdown": "![permissio score](https://img.shields.io/badge/permissio-54%2F100-orange)",
    "label": "permissio 54/100",
    "color": "orange"
  }
}
```

## Security model

Permissio is offline and read-only.
It does not call the GitHub API by default, require credentials, execute workflows, run shell scripts, or modify files.

## Limitations

Because Permissio uses static analysis, it may miss behavior hidden inside complex shell scripts, remote reusable workflows, organization settings, or third-party actions it does not recognize.
It intentionally does not try to model repository or organization default token settings.

## Roadmap

- Autofix mode
- PR comment mode
- SARIF output
- GitHub App
- Organization-wide scan
- Integration with gha-bom
- Integration with zizmor output
- More third-party action permission rules
- Reusable workflow permission analysis
- VS Code extension
- Hosted badge service

## Contributing

Issues and pull requests are welcome. New rules should be deterministic, explainable, and covered by fixtures.

## Good first contributions

- Add a new permission inference rule
- Improve `pull_request_target` detection
- Add fixtures for real world workflows
- Improve Markdown report formatting
- Add detection for another release action
- Add tests for unusual YAML forms

## License

MIT
