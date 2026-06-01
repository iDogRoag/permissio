# Rule Reference

permissio uses deterministic static rules. It does not execute workflow code, call the GitHub API, or inspect repository settings. Every recommendation should be reviewed before it is applied.

## Permission Recommendations

| Signal | Recommended permissions |
| --- | --- |
| `actions/checkout` | `contents: read` |
| GitHub Pages deploy through `actions/deploy-pages` | `pages: write`, `id-token: write` |
| Artifact attestation actions | `attestations: write`, `artifact-metadata: write`, `id-token: write`, `contents: read` |
| Cloud auth actions that use OIDC | `id-token: write` |
| `docker/build-push-action` or `docker push` to `ghcr.io` | `packages: write`, usually `contents: read` |
| GitHub Packages npm publish signals | `packages: write`, usually `contents: read` |
| Release creation or release asset upload | `contents: write` |
| Issue write operations | `issues: write` |
| Pull request write operations | `pull-requests: write` |
| Check run writes | `checks: write` |
| Commit status writes | `statuses: write` |
| Deployment writes | `deployments: write` |
| SARIF or CodeQL upload | `security-events: write` |
| Workflow dispatch or workflow run mutation | `actions: write` |
| GitHub Discussions writes | `discussions: write` |
| GitHub Models calls | `models: read` |
| Dependabot vulnerability alert reads | `vulnerability-alerts: read` |

When no signal needs `GITHUB_TOKEN`, permissio recommends `permissions: {}`.

## Findings

| Category | Examples |
| --- | --- |
| `parse` | Invalid YAML or a workflow file that is not a YAML object. |
| `permissions` | Missing explicit permissions, `write-all`, broad `read-all`, extra write scopes, unknown permission scopes. |
| `pull-request-target` | Write permissions on `pull_request_target`, checking out PR head code while write permissions are available, implicit `pull_request_target` defaults. |
| `rules` | Unknown third-party actions and remote reusable workflow jobs whose permissions cannot be inferred. |

## pull_request_target

`pull_request_target` is treated specially because GitHub grants the workflow token read/write repository permission by default unless the workflow declares explicit `permissions`. permissio keeps the current permission summary as `implicit default`, but it raises high-severity findings when that implicit default creates write-risk.

For safer `pull_request_target` workflows, declare explicit permissions at the workflow or job level and avoid checking out untrusted pull request head code in a job with write permissions.

## JSON Stability

JSON output includes `schemaVersion`. Additive fields may appear within the same major schema version; incompatible shape changes should bump the schema version.
