# OIDC Example

## What this shows

Cloud authentication through OIDC, where the job needs `id-token: write`.

## Command

```sh
permissio check examples/oidc --show-snippets
```

## Expected top findings

- missing explicit permissions
- deploy job needs `id-token: write`

## Safer version

```yaml
jobs:
  deploy:
    permissions:
      id-token: write
```
