# permissio report

**Permission score:** 0 out of 100 (critical)

![permissio score](https://img.shields.io/badge/permissio-0%2F100-red)

| Files | Workflows | Jobs | Write-all jobs | Missing explicit permissions | High | Medium | Low | Jobs with changes |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1 | 4 | 2 | 0 | 18 | 11 | 0 | 4 |

## .github/workflows/risky.yml

| Job | Current | Recommended | Findings |
| --- | --- | --- | --- |
| inspect | permissions: write-all | permissions: contents read | high: artifact-metadata write was declared but no attestation action was detected<br>high: attestations write was declared but no attestation action was detected<br>high: id-token write was declared but no OIDC, cloud auth, or attestation use was detected<br>high: packages write was declared but no package publish or ghcr push was detected<br>high: pull_request_target job checks out pull request head while write permissions are available<br>high: contents write on pull_request_target was not tied to a clear release or bot operation<br>high: pull_request_target workflow has write permissions<br>medium: contents write appears broader than this job needs<br>medium: Job has write permissions that were not inferred as necessary<br>medium: issues write was declared but no issue write operation was detected<br>medium: pull-requests write was declared but no PR write operation was detected |
| noop | permissions: write-all | permissions: {} | high: artifact-metadata write was declared but no attestation action was detected<br>high: attestations write was declared but no attestation action was detected<br>high: id-token write was declared but no OIDC, cloud auth, or attestation use was detected<br>high: packages write was declared but no package publish or ghcr push was detected<br>high: contents write on pull_request_target was not tied to a clear release or bot operation<br>high: pull_request_target workflow has write permissions<br>medium: contents write appears broader than this job needs<br>medium: Job has write permissions that were not inferred as necessary<br>medium: issues write was declared but no issue write operation was detected<br>medium: pull-requests write was declared but no PR write operation was detected |
| publish | permissions: contents write | permissions: contents read | high: contents write on pull_request_target was not tied to a clear release or bot operation<br>high: pull_request_target workflow has write permissions<br>medium: contents write appears broader than this job needs<br>medium: Job has write permissions that were not inferred as necessary |
| token | permissions: id-token write | permissions: {} | high: id-token write was declared but no OIDC, cloud auth, or attestation use was detected<br>high: pull_request_target workflow has write permissions<br>medium: Job has write permissions that were not inferred as necessary |

## Findings

- **high** Workflow grants permissions: write-all (.github/workflows/risky.yml)
- **high** artifact-metadata write was declared but no attestation action was detected (.github/workflows/risky.yml / inspect)
- **high** attestations write was declared but no attestation action was detected (.github/workflows/risky.yml / inspect)
- **high** id-token write was declared but no OIDC, cloud auth, or attestation use was detected (.github/workflows/risky.yml / inspect)
- **high** packages write was declared but no package publish or ghcr push was detected (.github/workflows/risky.yml / inspect)
- **high** pull_request_target job checks out pull request head while write permissions are available (.github/workflows/risky.yml / inspect)
- **high** contents write on pull_request_target was not tied to a clear release or bot operation (.github/workflows/risky.yml / inspect)
- **high** pull_request_target workflow has write permissions (.github/workflows/risky.yml / inspect)
- **high** artifact-metadata write was declared but no attestation action was detected (.github/workflows/risky.yml / noop)
- **high** attestations write was declared but no attestation action was detected (.github/workflows/risky.yml / noop)
- **high** id-token write was declared but no OIDC, cloud auth, or attestation use was detected (.github/workflows/risky.yml / noop)
- **high** packages write was declared but no package publish or ghcr push was detected (.github/workflows/risky.yml / noop)
- **high** contents write on pull_request_target was not tied to a clear release or bot operation (.github/workflows/risky.yml / noop)
- **high** pull_request_target workflow has write permissions (.github/workflows/risky.yml / noop)
- **high** contents write on pull_request_target was not tied to a clear release or bot operation (.github/workflows/risky.yml / publish)
- **high** pull_request_target workflow has write permissions (.github/workflows/risky.yml / publish)
- **high** id-token write was declared but no OIDC, cloud auth, or attestation use was detected (.github/workflows/risky.yml / token)
- **high** pull_request_target workflow has write permissions (.github/workflows/risky.yml / token)
- **medium** contents write appears broader than this job needs (.github/workflows/risky.yml / inspect)
- **medium** Job has write permissions that were not inferred as necessary (.github/workflows/risky.yml / inspect)
- **medium** issues write was declared but no issue write operation was detected (.github/workflows/risky.yml / inspect)
- **medium** pull-requests write was declared but no PR write operation was detected (.github/workflows/risky.yml / inspect)
- **medium** contents write appears broader than this job needs (.github/workflows/risky.yml / noop)
- **medium** Job has write permissions that were not inferred as necessary (.github/workflows/risky.yml / noop)
- **medium** issues write was declared but no issue write operation was detected (.github/workflows/risky.yml / noop)
- **medium** pull-requests write was declared but no PR write operation was detected (.github/workflows/risky.yml / noop)
- **medium** contents write appears broader than this job needs (.github/workflows/risky.yml / publish)
- **medium** Job has write permissions that were not inferred as necessary (.github/workflows/risky.yml / publish)
- **medium** Job has write permissions that were not inferred as necessary (.github/workflows/risky.yml / token)
