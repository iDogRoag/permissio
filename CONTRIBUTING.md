# Contributing

Thanks for helping improve Permissio.

## How to install

Use Node.js 22.13 or newer. Node 24 is the default local development version.

```sh
git clone https://github.com/iDogRoag/permissio.git
cd permissio
npm install
npm run build
```

## How to run tests

```sh
npm run check
npm run lint
npm test
npm run build
npm run pack:check
```

`npm run typecheck` is also available as an alias for `npm run check`.

## How rules are structured

Permission inference lives in `src/rules.ts`.
Reusable action and command pattern helpers live in `src/action-patterns.ts`.
Findings are normalized through `src/findings.ts`, and score penalties live in `src/score.ts`.

Rules should be deterministic, explainable, and conservative.
Prefer high-confidence matches for known actions and medium or low confidence for text-pattern inference.

## How to add a new permission inference rule

1. Add or update a detector in `src/action-patterns.ts` when the signal is reusable.
2. Add the recommendation in `inferJob` inside `src/rules.ts`.
3. Include a clear `reason`, `confidence`, `evidence`, and `ruleId`.
4. Add a fixture or inline test that proves the recommendation.

## How to add a risk finding

1. Add the finding in `addRiskFindings` inside `src/rules.ts`.
2. Use a stable `id` such as `permissions.some-risk`.
3. Keep the message short, specific, and actionable.
4. Add a score penalty in `src/score.ts` only when the finding should affect the heuristic score.
5. Add tests for the finding and score behavior.

## How to add a fixture

Put workflow fixtures in `test/fixtures` for tests or `examples` for public demos.
Keep each fixture small and focused on one behavior.
Use realistic GitHub Actions YAML, but avoid secrets or private repo details.

## How to add a reporter

Reporters live in `src/reporters`.
Use the shared `ScanReport` shape from `src/types.ts`.
Keep output deterministic so snapshots, docs, and CI logs stay stable.

## How to write a good finding message

Good finding messages are:

- specific: name the risky permission or trigger
- calm: avoid fear or exaggerated claims
- actionable: imply what to reduce or review
- short enough to scan in terminal output

Example:

```txt
contents write appears broader than this job needs
```

## Pull requests

Before opening a pull request:

- run `npm run check`
- run `npm run lint`
- run `npm test`
- run `npm run build`
- run `npm run pack:check`
- avoid committing `dist`, `node_modules`, coverage, or local logs

## Reporting false positives

Please include the smallest workflow snippet that reproduces the issue, the current Permissio output, and the permissions you expected.
