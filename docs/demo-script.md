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

Generate GitHub code-scanning output:

```sh
permissio demo --format sarif --output permissio.sarif
```

Explain that SARIF findings include exact workflow lines and stable fingerprints, ready for GitHub code scanning.

## 40-50 seconds

Open the HTML report:

```sh
permissio demo --format html --output permissio-demo.html
open permissio-demo.html
```

Show the quieter findings, exact source locations, score, and suggested snippets.

## 50-60 seconds

Close with the why:

`GITHUB_TOKEN` permissions are part of the CI/CD attack surface. Permissio helps teams make those permissions explicit, reviewable, and smaller.
