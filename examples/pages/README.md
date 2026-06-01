# Pages Example

## What this shows

GitHub Pages deployment permissions split across build and deploy jobs.

## Command

```sh
permissio check examples/pages --format markdown
```

## Expected top findings

- missing explicit permissions
- build needs `contents: read`
- deploy needs `pages: write` and `id-token: write`

## Safer version

```yaml
jobs:
  build:
    permissions:
      contents: read
  deploy:
    permissions:
      pages: write
      id-token: write
```
