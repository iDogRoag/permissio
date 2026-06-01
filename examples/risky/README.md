# Risky Example

## What this shows

A screenshot-friendly workflow with broad permissions, `pull_request_target`, checkout of pull request head code, unnecessary `id-token: write`, unnecessary `contents: write`, and a job that can use `permissions: {}`.

## Command

```sh
permissio check examples/risky --show-snippets
```

## Expected top findings

- `write-all` used at workflow level
- `pull_request_target` has write permissions
- pull request head code is checked out while write permissions are available
- `id-token: write` is set but no OIDC use was detected
- `contents: write` appears broader than needed

## Safer version

```yaml
jobs:
  inspect:
    permissions:
      contents: read
  token:
    permissions: {}
  publish:
    permissions:
      contents: read
  noop:
    permissions: {}
```
