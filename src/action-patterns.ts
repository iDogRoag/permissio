import type { ParsedJob, ParsedStep } from "./types.js";

export function jobPushesGhcr(job: ParsedJob): boolean {
  return job.steps.some((step) => {
    const uses = normalizeUses(step.uses);
    const text = lower(stepText(step));
    return (
      (uses === "docker/build-push-action" && withTruthy(step.with, "push") && text.includes("ghcr.io")) ||
      /\bdocker\s+push\s+ghcr\.io\//.test(text)
    );
  });
}

export function checksOutPullRequestHead(job: ParsedJob): boolean {
  return job.steps.some((step) => {
    if (normalizeUses(step.uses) !== "actions/checkout") {
      return false;
    }

    const text = lower(JSON.stringify(step.with ?? {}));
    return text.includes("pull_request.head") || text.includes("github.head_ref") || text.includes("refs/pull");
  });
}

export function isKnownCloudAuth(uses: string, text: string): boolean {
  if (uses === "aws-actions/configure-aws-credentials") {
    return true;
  }

  if (uses === "google-github-actions/auth" || uses === "azure/login") {
    return true;
  }

  return uses === "hashicorp/vault-action" && text.includes("jwt");
}

export function hasGenericOidcSignal(text: string): boolean {
  return /\b(id-token|oidc|openid connect)\b/.test(text);
}

export function isReleaseStep(uses: string, text: string): boolean {
  return (
    uses === "softprops/action-gh-release" ||
    uses === "ncipollo/release-action" ||
    uses === "actions/create-release" ||
    uses === "actions/upload-release-asset" ||
    /\bgh\s+release\s+(create|upload)\b/.test(text) ||
    (text.includes("/releases") && hasHttpWriteVerb(text))
  );
}

export function isIssueWrite(text: string, script: string): boolean {
  return (
    /\bgh\s+issue\s+(create|comment|edit|close|reopen|lock|unlock)\b/.test(text) ||
    (text.includes("/issues") && hasHttpWriteVerb(text)) ||
    /github\.rest\.issues\.(create|update|addlabels|createlabel|createcomment|lock|unlock|remove)/.test(script)
  );
}

export function isIssueRead(text: string, script: string): boolean {
  return /\bgh\s+issue\s+(list|view)\b/.test(text) || /github\.rest\.issues\.(list|get)/.test(script);
}

export function isPullRequestWrite(text: string, script: string): boolean {
  return (
    /\bgh\s+pr\s+(create|comment|edit|merge|close|ready|review)\b/.test(text) ||
    (text.includes("/pulls") && hasHttpWriteVerb(text)) ||
    /github\.rest\.pulls\.(create|update|merge|requestreviewers|createreview)/.test(script)
  );
}

export function isPullRequestRead(text: string, script: string): boolean {
  return /\bgh\s+pr\s+(list|view|diff|checks)\b/.test(text) || /github\.rest\.pulls\.(list|get)/.test(script);
}

export function isChecksWrite(text: string, script: string): boolean {
  return text.includes("/check-runs") || /github\.rest\.checks\.(create|update)/.test(script);
}

export function isStatusesWrite(text: string, script: string): boolean {
  return text.includes("/statuses") || script.includes("github.rest.repos.createcommitstatus");
}

export function isDeploymentsWrite(text: string, script: string): boolean {
  return (
    (text.includes("/deployments") && hasHttpWriteVerb(text)) ||
    /github\.rest\.repos\.createdeployment/.test(script)
  );
}

export function isActionsWrite(text: string): boolean {
  return (
    /\bgh\s+workflow\s+run\b/.test(text) ||
    /\bgh\s+run\s+(cancel|rerun|delete)\b/.test(text) ||
    text.includes("/dispatches") ||
    text.includes("/rerun") ||
    text.includes("/cancel")
  );
}

export function isDiscussionWrite(text: string, script: string): boolean {
  return (
    /(create|edit|delete|lock|unlock|comment).{0,24}discussion/.test(text) ||
    /(create|edit|delete|lock|unlock|comment).{0,24}discussion/.test(script)
  );
}

export function isUnknownThirdPartyAction(uses: string): boolean {
  if (uses.startsWith("actions/")) {
    return false;
  }

  const known = [
    "aws-actions/configure-aws-credentials",
    "google-github-actions/auth",
    "azure/login",
    "hashicorp/vault-action",
    "docker/build-push-action",
    "softprops/action-gh-release",
    "ncipollo/release-action",
    "peter-evans/create-pull-request",
    "github/codeql-action/upload-sarif"
  ];

  return !known.includes(uses);
}

export function normalizeUses(value: string | undefined): string {
  if (!value) {
    return "";
  }
  return value.split("@")[0]?.toLowerCase() ?? "";
}

export function withTruthy(value: Record<string, unknown> | undefined, key: string): boolean {
  if (!value) {
    return false;
  }

  const raw = value[key];
  return raw === true || (typeof raw === "string" && raw.toLowerCase() === "true");
}

export function jobText(job: ParsedJob): string {
  return JSON.stringify(job.raw);
}

export function stepText(step: ParsedStep): string {
  return [step.uses, step.run, JSON.stringify(step.with ?? {}), JSON.stringify(step.env ?? {})]
    .filter(Boolean)
    .join("\n");
}

export function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function firstLine(value: string | undefined): string {
  return (value ?? "").split(/\r?\n/)[0]?.trim() ?? "";
}

export function lower(value: string): string {
  return value.toLowerCase();
}

function hasHttpWriteVerb(text: string): boolean {
  return /\b(post|patch|put|delete)\b/.test(text) || /-x\s+(post|patch|put|delete)\b/.test(text);
}
