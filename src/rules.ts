import {
  checksOutPullRequestHead,
  checksOutPullRequestHeadStep,
  firstLine,
  hasGenericOidcSignal,
  isActionsWrite,
  isChecksWrite,
  isDeploymentsWrite,
  isDiscussionWrite,
  isIssueRead,
  isIssueWrite,
  isKnownCloudAuth,
  isPullRequestRead,
  isPullRequestWrite,
  isReleaseStep,
  isStatusesWrite,
  isUnknownThirdPartyAction,
  jobPushesGhcr,
  jobText,
  lower,
  normalizeUses,
  stepText,
  stringValue,
  withTruthy
} from "./action-patterns.js";
import { withFindingCategory } from "./findings.js";
import {
  currentSummary,
  expandPermissions,
  hasAnyRecommendedWrite,
  hasAnyWrite,
  hasRecommendedChanges,
  isReadAllOrEmptyRecommendation,
  mergeLevel,
  recommendedSummary,
  toSnippet
} from "./permissions.js";
import type {
  Confidence,
  Finding,
  JobResult,
  ParsedJob,
  ParsedPermissions,
  ParsedWorkflow,
  PermissionLevel,
  PermissionScope,
  RecommendationReason,
  SourceLocation,
  WorkflowResult
} from "./types.js";

interface JobInference {
  recommendations: Partial<Record<PermissionScope, Exclude<PermissionLevel, "none">>>;
  reasons: RecommendationReason[];
  detected: {
    oidc: boolean;
    attestation: boolean;
    packageWrite: boolean;
    release: boolean;
    issueWrite: boolean;
    pullRequestWrite: boolean;
  };
  unknownActions: string[];
}

export function analyzeWorkflow(workflow: ParsedWorkflow): WorkflowResult {
  const workflowFindings: Finding[] = [];
  const preliminary = workflow.jobs.map((job) => buildJobResult(workflow, job));
  const pullRequestTarget = hasTrigger(workflow.on, "pull_request_target");

  addUnknownScopeFindings(workflowFindings, workflow.filePath, workflow.name, undefined, workflow.permissions, "workflow");

  if (workflow.permissions.kind === "write-all") {
    workflowFindings.push({
      id: "permissions.workflow-write-all",
      severity: "high",
      message: "Workflow grants permissions: write-all",
      filePath: workflow.filePath,
      workflowName: workflow.name,
      evidence: "permissions: write-all"
    });
  }

  const jobsNeedingWrite = preliminary.filter((result) => hasAnyRecommendedWrite(result.recommended.permissions));
  if (workflow.permissions.kind === "map") {
    const workflowExpanded = expandPermissions(workflow.permissions);
    if (hasAnyWrite(workflowExpanded) && jobsNeedingWrite.length === 1) {
      workflowFindings.push({
        id: "permissions.workflow-write-should-be-job-level",
        severity: "medium",
        message: "Workflow-level write permissions appear needed by only one job",
        filePath: workflow.filePath,
        workflowName: workflow.name,
        jobId: jobsNeedingWrite[0]?.jobId
      });
    }
  }

  const jobs = preliminary.map((result) => {
    const job = workflow.jobs.find((candidate) => candidate.id === result.jobId);
    if (!job) {
      return result;
    }

    const inference = inferJob(job, workflow);
    const findings = [...result.findings];
    addRiskFindings(findings, workflow, job, result, inference, pullRequestTarget);
    return {
      ...result,
      findings: sortFindings(findings).map((finding) => decorateFinding(finding, workflow, job))
    };
  });

  return {
    filePath: workflow.filePath,
    workflowName: workflow.name,
    jobs: jobs.sort((a, b) => a.jobId.localeCompare(b.jobId)),
    findings: sortFindings(workflowFindings).map((finding) => decorateFinding(finding, workflow))
  };
}

export function hasTrigger(onValue: unknown, trigger: string): boolean {
  if (typeof onValue === "string") {
    return onValue === trigger;
  }

  if (Array.isArray(onValue)) {
    return onValue.some((item) => hasTrigger(item, trigger));
  }

  if (isRecord(onValue)) {
    return Object.keys(onValue).includes(trigger);
  }

  return false;
}

function buildJobResult(workflow: ParsedWorkflow, job: ParsedJob): JobResult {
  const currentPermissions = getCurrentPermissions(workflow.permissions, job.permissions);
  const currentExpanded = expandPermissions(currentPermissions.permissions);
  const inference = inferJob(job, workflow);
  const findings: Finding[] = [];

  if (job.permissions.kind === "map") {
    addUnknownScopeFindings(findings, workflow.filePath, workflow.name, job.id, job.permissions, "job");
  }

  const current = {
    source: currentPermissions.source,
    kind: currentPermissions.permissions.kind,
    summary: currentSummary(currentPermissions.permissions),
    permissions: currentExpanded
  };

  const recommended = {
    permissions: inference.recommendations,
    summary: recommendedSummary(inference.recommendations)
  };

  return {
    filePath: workflow.filePath,
    workflowName: workflow.name,
    jobId: job.id,
    jobName: job.name,
    current,
    recommended,
    reasons: sortReasons(inference.reasons),
    findings: sortFindings(findings).map(withFindingCategory),
    snippet: toSnippet(job.id, inference.recommendations),
    hasRecommendedChanges: hasRecommendedChanges(
      currentPermissions.permissions.kind,
      currentExpanded,
      inference.recommendations
    )
  };
}

function addRiskFindings(
  findings: Finding[],
  workflow: ParsedWorkflow,
  job: ParsedJob,
  result: JobResult,
  inference: JobInference,
  pullRequestTarget: boolean
): void {
  if (job.uses && job.steps.length === 0) {
    findings.push({
      id: "rules.reusable-workflow-not-inferred",
      severity: "low",
      message: "Could not infer permissions for reusable workflow job",
      filePath: workflow.filePath,
      workflowName: workflow.name,
      jobId: job.id,
      evidence: job.uses
    });
  }

  if (result.current.source === "implicit") {
    const missingExplicitSeverity = pullRequestTarget ? "high" : "medium";
    const missingExplicitMessage = pullRequestTarget
      ? "No explicit permissions at workflow or job level; pull_request_target receives a read/write repository token by default"
      : "No explicit permissions at workflow or job level";

    findings.push({
      id: "permissions.missing-explicit",
      severity: missingExplicitSeverity,
      message: missingExplicitMessage,
      filePath: workflow.filePath,
      workflowName: workflow.name,
      jobId: job.id,
      evidence: pullRequestTarget ? "on: pull_request_target" : undefined
    });
  }

  if (job.permissions.kind === "write-all") {
    findings.push({
      id: "permissions.job-write-all",
      severity: "high",
      message: "Job grants permissions: write-all",
      filePath: workflow.filePath,
      workflowName: workflow.name,
      jobId: job.id,
      evidence: "permissions: write-all"
    });
  }

  if (result.current.kind === "read-all" && isReadAllOrEmptyRecommendation(result.recommended.permissions)) {
    findings.push({
      id: "permissions.read-all-too-broad",
      severity: "medium",
      message: "permissions: read-all appears broader than this job needs",
      filePath: workflow.filePath,
      workflowName: workflow.name,
      jobId: job.id
    });
  }

  const recommendedExpanded = result.recommended.permissions;
  const current = result.current.permissions;
  const extraWriteScopes = Object.entries(current).filter(
    ([scope, level]) => level === "write" && recommendedExpanded[scope as PermissionScope] !== "write"
  );
  const scopesWithSpecificFindings = new Set([
    "artifact-metadata",
    "attestations",
    "contents",
    "id-token",
    "issues",
    "packages",
    "pull-requests"
  ]);
  const genericExtraWriteScopes = extraWriteScopes.filter(([scope]) => !scopesWithSpecificFindings.has(scope));

  if (result.current.kind !== "write-all" && genericExtraWriteScopes.length > 0) {
    findings.push({
      id: "permissions.extra-write-scopes",
      severity: "medium",
      message: "Job has write permissions that were not inferred as necessary",
      filePath: workflow.filePath,
      workflowName: workflow.name,
      jobId: job.id,
      evidence: genericExtraWriteScopes.map(([scope]) => scope).join(", ")
    });
  }

  if (
    result.current.kind !== "write-all" &&
    !pullRequestTarget &&
    current.contents === "write" &&
    result.recommended.permissions.contents !== "write"
  ) {
    findings.push({
      id: "permissions.contents-write-unneeded",
      severity: "medium",
      message: "contents write appears broader than this job needs",
      filePath: workflow.filePath,
      workflowName: workflow.name,
      jobId: job.id,
      scope: "contents"
    });
  }

  if (
    result.current.kind !== "write-all" &&
    current["pull-requests"] === "write" &&
    !inference.detected.pullRequestWrite
  ) {
    findings.push({
      id: "permissions.pull-requests-write-unneeded",
      severity: "medium",
      message: "pull-requests write was declared but no PR write operation was detected",
      filePath: workflow.filePath,
      workflowName: workflow.name,
      jobId: job.id,
      scope: "pull-requests"
    });
  }

  if (result.current.kind !== "write-all" && current.issues === "write" && !inference.detected.issueWrite) {
    findings.push({
      id: "permissions.issues-write-unneeded",
      severity: "medium",
      message: "issues write was declared but no issue write operation was detected",
      filePath: workflow.filePath,
      workflowName: workflow.name,
      jobId: job.id,
      scope: "issues"
    });
  }

  if (
    result.current.kind !== "write-all" &&
    current["id-token"] === "write" &&
    !inference.detected.oidc &&
    !inference.detected.attestation
  ) {
    findings.push({
      id: "permissions.id-token-write-unneeded",
      severity: "high",
      message: "id-token write was declared but no OIDC, cloud auth, or attestation use was detected",
      filePath: workflow.filePath,
      workflowName: workflow.name,
      jobId: job.id,
      scope: "id-token"
    });
  }

  if (result.current.kind !== "write-all" && current.packages === "write" && !inference.detected.packageWrite) {
    findings.push({
      id: "permissions.packages-write-unneeded",
      severity: "high",
      message: "packages write was declared but no package publish or ghcr push was detected",
      filePath: workflow.filePath,
      workflowName: workflow.name,
      jobId: job.id,
      scope: "packages"
    });
  }

  if (result.current.kind !== "write-all" && current.attestations === "write" && !inference.detected.attestation) {
    findings.push({
      id: "permissions.attestations-write-unneeded",
      severity: "high",
      message: "attestations write was declared but no attestation action was detected",
      filePath: workflow.filePath,
      workflowName: workflow.name,
      jobId: job.id,
      scope: "attestations"
    });
  }

  if (
    result.current.kind !== "write-all" &&
    current["artifact-metadata"] === "write" &&
    !inference.detected.attestation
  ) {
    findings.push({
      id: "permissions.artifact-metadata-write-unneeded",
      severity: "high",
      message: "artifact-metadata write was declared but no attestation action was detected",
      filePath: workflow.filePath,
      workflowName: workflow.name,
      jobId: job.id,
      scope: "artifact-metadata"
    });
  }

  if (pullRequestTarget) {
    const writePermissionsAvailable = pullRequestTargetHasWriteRisk(result);

    if (writePermissionsAvailable) {
      findings.push({
        id: "pull-request-target.write-permissions",
        severity: "high",
        message: "pull_request_target job has write permissions",
        filePath: workflow.filePath,
        workflowName: workflow.name,
        jobId: job.id,
        evidence: result.current.source === "implicit" ? "implicit pull_request_target default" : undefined
      });
    }

    if (checksOutPullRequestHead(job) && writePermissionsAvailable) {
      findings.push({
        id: "pull-request-target.checkout-head-with-write",
        severity: "high",
        message: "pull_request_target job checks out pull request head while write permissions are available",
        filePath: workflow.filePath,
        workflowName: workflow.name,
        jobId: job.id,
        evidence: result.current.source === "implicit" ? "implicit pull_request_target default" : undefined
      });
    }

    if (
      result.current.kind !== "write-all" &&
      current.contents === "write" &&
      !inference.detected.release &&
      result.recommended.permissions.contents !== "write"
    ) {
      findings.push({
        id: "pull-request-target.contents-write",
        severity: "high",
        message: "contents write on pull_request_target was not tied to a clear release or bot operation",
        filePath: workflow.filePath,
        workflowName: workflow.name,
        jobId: job.id,
        scope: "contents"
      });
    }
  }

  if (inference.unknownActions.length > 0 && isBroadOrImplicit(result)) {
    findings.push({
      id: "rules.unknown-third-party-action",
      severity: "low",
      message: "Unknown third-party action could not be inferred",
      filePath: workflow.filePath,
      workflowName: workflow.name,
      jobId: job.id,
      evidence: inference.unknownActions.join(", ")
    });
  }
}

function inferJob(job: ParsedJob, workflow: ParsedWorkflow): JobInference {
  const recommendations: Partial<Record<PermissionScope, Exclude<PermissionLevel, "none">>> = {};
  const reasons: RecommendationReason[] = [];
  const unknownActions = new Set<string>();
  const detected = {
    oidc: false,
    attestation: false,
    packageWrite: false,
    release: false,
    issueWrite: false,
    pullRequestWrite: false
  };

  const add = (
    scope: PermissionScope,
    level: Exclude<PermissionLevel, "none">,
    reason: string,
    confidence: Confidence,
    evidence: string,
    ruleId: string
  ) => {
    recommendations[scope] = mergeLevel(recommendations[scope], level) as Exclude<PermissionLevel, "none">;
    reasons.push({ scope, level, reason, confidence, evidence, ruleId });
  };

  const workflowText = lower(workflow.sourceText);
  const jobTextValue = lower(jobText(job));
  const pushesGhcr = jobPushesGhcr(job);

  for (const step of job.steps) {
    const uses = normalizeUses(step.uses);
    const text = lower(stepText(step));
    const script = lower(stringValue(step.with?.script));

    if (uses === "actions/checkout") {
      add("contents", "read", "checkout needs repository contents", "high", step.uses ?? "actions/checkout", "actions.checkout");
    }

    if (uses === "actions/deploy-pages") {
      add("pages", "write", "deploy-pages publishes GitHub Pages", "high", step.uses ?? uses, "pages.deploy");
      add("id-token", "write", "deploy-pages uses OIDC for Pages deployment", "high", step.uses ?? uses, "pages.deploy");
      detected.oidc = true;
    }

    if (uses.startsWith("actions/attest")) {
      add("attestations", "write", "artifact attestation action writes attestations", "high", step.uses ?? uses, "attestations.actions");
      add("artifact-metadata", "write", "artifact attestation creates artifact metadata storage records", "high", step.uses ?? uses, "attestations.actions");
      add("id-token", "write", "artifact attestation requires OIDC token minting", "high", step.uses ?? uses, "attestations.actions");
      add("contents", "read", "artifact attestation needs repository contents context", "high", step.uses ?? uses, "attestations.actions");
      detected.attestation = true;
      detected.oidc = true;
      if (pushesGhcr) {
        add("packages", "write", "attested container image is pushed to ghcr.io", "high", "ghcr.io", "attestations.ghcr");
        detected.packageWrite = true;
      }
    }

    if (isKnownCloudAuth(uses, text)) {
      add("id-token", "write", "cloud authentication action uses OIDC", "high", step.uses ?? uses, "oidc.cloud-auth");
      detected.oidc = true;
    } else if (hasGenericOidcSignal(text)) {
      add("id-token", "write", "step contains OIDC or id-token configuration", "medium", firstLine(stepText(step)), "oidc.generic");
      detected.oidc = true;
    }

    if (uses === "docker/build-push-action" && withTruthy(step.with, "push") && text.includes("ghcr.io")) {
      add("packages", "write", "docker/build-push-action pushes an image to ghcr.io", "high", step.uses ?? uses, "packages.ghcr-build-push");
      add("contents", "read", "container publishing usually reads repository contents", "medium", step.uses ?? uses, "packages.ghcr-build-push");
      detected.packageWrite = true;
    }

    if (/\bdocker\s+push\s+ghcr\.io\//.test(text)) {
      add("packages", "write", "docker push publishes an image to ghcr.io", "high", firstLine(step.run), "packages.ghcr-docker-push");
      detected.packageWrite = true;
    }

    if (/\bnpm\s+publish\b/.test(text) && (workflowText.includes("npm.pkg.github.com") || jobTextValue.includes("secrets.github_token") || jobTextValue.includes("github_token"))) {
      add("packages", "write", "npm publish appears to publish to GitHub Packages", "medium", firstLine(step.run), "packages.npm-publish");
      add("contents", "read", "package publishing usually reads repository contents", "medium", firstLine(step.run), "packages.npm-publish");
      detected.packageWrite = true;
    }

    if (!detected.packageWrite && (/\bdocker\s+pull\s+ghcr\.io\//.test(text) || text.includes("npm.pkg.github.com"))) {
      add("packages", "read", "workflow appears to read GitHub Packages", "medium", firstLine(stepText(step)), "packages.read");
    }

    if (isReleaseStep(uses, text)) {
      add("contents", "write", "release creation or asset upload writes repository contents/releases", "high", step.uses ?? firstLine(step.run), "releases.write");
      detected.release = true;
    }

    if (isIssueWrite(text, script)) {
      add("issues", "write", "step appears to write issues", "medium", firstLine(stepText(step)), "issues.write");
      detected.issueWrite = true;
    } else if (isIssueRead(text, script)) {
      add("issues", "read", "step appears to read issues", "low", firstLine(stepText(step)), "issues.read");
    }

    if (uses === "peter-evans/create-pull-request") {
      add("contents", "write", "create-pull-request creates commits or branches", "high", step.uses ?? uses, "pull-requests.create-action");
      add("pull-requests", "write", "create-pull-request opens or updates pull requests", "high", step.uses ?? uses, "pull-requests.create-action");
      detected.pullRequestWrite = true;
    } else if (isPullRequestWrite(text, script)) {
      add("pull-requests", "write", "step appears to write pull requests", "medium", firstLine(stepText(step)), "pull-requests.write");
      detected.pullRequestWrite = true;
    } else if (isPullRequestRead(text, script)) {
      add("pull-requests", "read", "step appears to read pull requests", "low", firstLine(stepText(step)), "pull-requests.read");
    }

    if (isChecksWrite(text, script)) {
      add("checks", "write", "step appears to create or update check runs", "medium", firstLine(stepText(step)), "checks.write");
    }

    if (isStatusesWrite(text, script)) {
      add("statuses", "write", "step appears to create commit statuses", "medium", firstLine(stepText(step)), "statuses.write");
    }

    if (isDeploymentsWrite(text, script)) {
      add("deployments", "write", "step appears to create deployments", "medium", firstLine(stepText(step)), "deployments.write");
    }

    if (uses === "github/codeql-action/upload-sarif" || text.includes("upload-sarif") || text.includes("codeql-action/analyze") || text.includes("/code-scanning/sarifs")) {
      add("security-events", "write", "SARIF or CodeQL upload writes security events", "high", step.uses ?? firstLine(step.run), "security-events.sarif");
    }

    if (isActionsWrite(text)) {
      add("actions", "write", "step appears to dispatch or mutate workflow runs", "medium", firstLine(stepText(step)), "actions.write");
    } else if (/\bgh\s+(workflow|run)\s+(list|view)\b/.test(text)) {
      add("actions", "read", "step appears to list or view workflow runs", "low", firstLine(stepText(step)), "actions.read");
    }

    if (isDiscussionWrite(text, script)) {
      add("discussions", "write", "step appears to write discussions", "low", firstLine(stepText(step)), "discussions.write");
    } else if (text.includes("discussions") || script.includes("discussions")) {
      add("discussions", "read", "step appears to read discussions", "low", firstLine(stepText(step)), "discussions.read");
    }

    if (text.includes("models.github.ai") || text.includes("github models") || text.includes("/models")) {
      add("models", "read", "step appears to call GitHub Models", "medium", firstLine(stepText(step)), "models.read");
    }

    if (text.includes("dependabot/alerts") || text.includes("vulnerability-alerts")) {
      add("vulnerability-alerts", "read", "step appears to read Dependabot vulnerability alerts", "medium", firstLine(stepText(step)), "vulnerability-alerts.read");
    }

    if (uses && isUnknownThirdPartyAction(uses)) {
      unknownActions.add(step.uses ?? uses);
    }
  }

  return {
    recommendations,
    reasons,
    detected,
    unknownActions: [...unknownActions].sort()
  };
}

function getCurrentPermissions(
  workflowPermissions: ParsedPermissions,
  jobPermissions: ParsedPermissions
): { source: "implicit" | "workflow" | "job"; permissions: ParsedPermissions } {
  if (jobPermissions.kind !== "missing") {
    return { source: "job", permissions: jobPermissions };
  }

  if (workflowPermissions.kind !== "missing") {
    return { source: "workflow", permissions: workflowPermissions };
  }

  return { source: "implicit", permissions: { kind: "missing" } };
}

function addUnknownScopeFindings(
  findings: Finding[],
  filePath: string,
  workflowName: string,
  jobId: string | undefined,
  permissions: ParsedPermissions,
  source: "workflow" | "job"
): void {
  if (permissions.kind !== "map") {
    return;
  }

  for (const scope of permissions.unknownScopes) {
    findings.push({
      id: "permissions.unknown-scope",
      severity: "low",
      message: `Permission scope exists but is unknown to this tool at ${source} level`,
      filePath,
      workflowName,
      jobId,
      scope
    });
  }
}

function isBroadOrImplicit(result: JobResult): boolean {
  return result.current.source === "implicit" || result.current.kind === "read-all" || result.current.kind === "write-all" || hasAnyWrite(result.current.permissions);
}

function pullRequestTargetHasWriteRisk(result: JobResult): boolean {
  return result.current.source === "implicit" || result.current.kind === "write-all" || hasAnyWrite(result.current.permissions);
}

function sortReasons(reasons: RecommendationReason[]): RecommendationReason[] {
  return [...reasons].sort(
    (a, b) =>
      a.scope.localeCompare(b.scope) ||
      a.level.localeCompare(b.level) ||
      a.ruleId.localeCompare(b.ruleId) ||
      a.reason.localeCompare(b.reason)
  );
}

function sortFindings(findings: Finding[]): Finding[] {
  const severityRank = { high: 0, medium: 1, low: 2 };
  return [...findings].sort(
    (a, b) =>
      severityRank[a.severity] - severityRank[b.severity] ||
      a.filePath.localeCompare(b.filePath) ||
      (a.jobId ?? "").localeCompare(b.jobId ?? "") ||
      a.id.localeCompare(b.id)
  );
}

function decorateFinding(finding: Finding, workflow: ParsedWorkflow, job?: ParsedJob): Finding {
  return withFindingCategory({
    ...finding,
    location: finding.location ?? sourceLocationForFinding(finding, workflow, job)
  });
}

function sourceLocationForFinding(
  finding: Finding,
  workflow: ParsedWorkflow,
  providedJob?: ParsedJob
): SourceLocation | undefined {
  const job = providedJob ?? workflow.jobs.find((candidate) => candidate.id === finding.jobId);

  if (
    finding.id === "permissions.workflow-write-all" ||
    finding.id === "permissions.workflow-write-should-be-job-level"
  ) {
    return workflow.permissionsLocation ?? workflow.location;
  }

  if (finding.id === "permissions.unknown-scope" && finding.scope) {
    return job?.permissionLocations?.[finding.scope] ?? workflow.permissionLocations?.[finding.scope];
  }

  if (finding.id === "pull-request-target.checkout-head-with-write") {
    return job?.steps.find(checksOutPullRequestHeadStep)?.location ?? job?.location;
  }

  if (finding.id === "pull-request-target.write-permissions") {
    return declaredPermissionLocation(workflow, job) ?? workflow.triggerLocation ?? job?.location;
  }

  if (finding.id === "rules.unknown-third-party-action") {
    return (
      job?.steps.find((step) => {
        const uses = normalizeUses(step.uses);
        return Boolean(uses && isUnknownThirdPartyAction(uses));
      })?.location ?? job?.location
    );
  }

  if (finding.id === "rules.reusable-workflow-not-inferred" || finding.id === "permissions.missing-explicit") {
    return job?.location ?? workflow.location;
  }

  if (finding.scope) {
    return declaredPermissionLocation(workflow, job, finding.scope);
  }

  if (finding.id.startsWith("permissions.") || finding.id === "pull-request-target.contents-write") {
    return declaredPermissionLocation(workflow, job) ?? job?.location ?? workflow.location;
  }

  return job?.location ?? workflow.location;
}

function declaredPermissionLocation(
  workflow: ParsedWorkflow,
  job: ParsedJob | undefined,
  scope?: string
): SourceLocation | undefined {
  if (job && job.permissions.kind !== "missing") {
    return (scope ? job.permissionLocations?.[scope] : undefined) ?? job.permissionsLocation ?? job.location;
  }

  if (workflow.permissions.kind !== "missing") {
    return (
      (scope ? workflow.permissionLocations?.[scope] : undefined) ??
      workflow.permissionsLocation ??
      workflow.location
    );
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
