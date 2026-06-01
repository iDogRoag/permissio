# Basic Example

## What this shows

A simple workflow with one checkout job and one job that does not need `GITHUB_TOKEN`.

## Command

```sh
permissio check examples/basic --show-snippets
```

## Expected top findings

- missing explicit permissions on both jobs
- `test` can use `contents: read`
- `lint` can use `permissions: {}`

## Safer version

```yaml
jobs:
  test:
    permissions:
      contents: read
  lint:
    permissions: {}
```
