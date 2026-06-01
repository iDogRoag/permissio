# Release Example

## What this shows

A release job that needs `contents: write` because it creates a GitHub release.

## Command

```sh
permissio check examples/release --show-snippets
```

## Expected top findings

- missing explicit permissions
- release job needs `contents: write`

## Safer version

```yaml
jobs:
  release:
    permissions:
      contents: write
```
