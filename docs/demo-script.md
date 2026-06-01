# 60 Second Demo Script

## 0-10 seconds

Run the bundled demo:

```sh
permissio demo
```

Explain that Permissio works before you have a repo to scan because it ships with a risky example workflow.

## 10-25 seconds

Run a detailed risky scan:

```sh
permissio check examples/risky --show-snippets
```

Point out broad `write-all`, risky `pull_request_target`, unnecessary `id-token: write`, and jobs that can use `permissions: {}`.

## 25-40 seconds

Show Markdown output:

```sh
permissio check examples/pages --format markdown
```

Explain that Pages deploys usually need `pages: write` and `id-token: write`, while build jobs often only need `contents: read`.

## 40-50 seconds

Open the HTML report:

```sh
permissio demo --format html --output permissio-demo.html
open permissio-demo.html
```

Show the score, top findings, and suggested snippets.

## 50-60 seconds

Close with the why:

`GITHUB_TOKEN` permissions are part of the CI/CD attack surface. Permissio helps teams make those permissions explicit, reviewable, and smaller.
