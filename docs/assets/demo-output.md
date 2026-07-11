# permissio report

**Permission score:** 20 out of 100 (critical)

![permissio score](https://img.shields.io/badge/permissio-20%2F100-red)

| Files | Workflows | Jobs | Write-all jobs | Missing explicit permissions | High | Medium | Low | Jobs with changes |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1 | 4 | 2 | 0 | 8 | 0 | 0 | 4 |

## .github/workflows/risky.yml

| Job | Current | Recommended | Findings |
| --- | --- | --- | --- |
| inspect | permissions: write-all | permissions: contents read | high: pull_request_target job checks out pull request head while write permissions are available<br>high: pull_request_target job has write permissions |
| noop | permissions: write-all | permissions: {} | high: pull_request_target job has write permissions |
| publish | permissions: contents write | permissions: contents read | high: contents write on pull_request_target was not tied to a clear release or bot operation<br>high: pull_request_target job has write permissions |
| token | permissions: id-token write | permissions: {} | high: id-token write was declared but no OIDC, cloud auth, or attestation use was detected<br>high: pull_request_target job has write permissions |

## Findings

- **high** Workflow grants permissions: write-all (.github/workflows/risky.yml:6:1)
- **high** pull_request_target job checks out pull request head while write permissions are available (.github/workflows/risky.yml:12:9 / inspect)
- **high** pull_request_target job has write permissions (.github/workflows/risky.yml:6:1 / inspect)
- **high** pull_request_target job has write permissions (.github/workflows/risky.yml:6:1 / noop)
- **high** contents write on pull_request_target was not tied to a clear release or bot operation (.github/workflows/risky.yml:27:7 / publish)
- **high** pull_request_target job has write permissions (.github/workflows/risky.yml:26:5 / publish)
- **high** id-token write was declared but no OIDC, cloud auth, or attestation use was detected (.github/workflows/risky.yml:20:7 / token)
- **high** pull_request_target job has write permissions (.github/workflows/risky.yml:19:5 / token)
