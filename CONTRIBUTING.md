# Contributing

Thanks for helping improve permissio.

## Development

Use Node.js 22.13 or newer. Node 24 is the default local development version.

```sh
npm install
npm run check
npm run lint
npm test
npm run build
npm run pack:check
```

## Rule Changes

Rules should be deterministic, explainable, and conservative. Prefer high-confidence matches for known actions and medium or low confidence for text-pattern inference.

Every new rule should include:

- a fixture or inline parser test
- expected permission recommendations
- expected findings when the rule affects risk output

## Pull Requests

Before opening a pull request:

- run `npm run check`
- run `npm run lint`
- run `npm test`
- run `npm run build`
- run `npm run pack:check`
- avoid committing `dist`, `node_modules`, coverage, or local logs

## Reporting False Positives

Please include the smallest workflow snippet that reproduces the issue, the current permissio output, and the permissions you expected.
