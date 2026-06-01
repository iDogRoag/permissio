import type { BadgeSummary, Finding, PermissionScore, ScorePenalty } from "./types.js";

interface PenaltyRule {
  id: string;
  points: number;
  reason: string;
}

const penaltyRules: PenaltyRule[] = [
  { id: "permissions.workflow-write-all", points: 25, reason: "write-all grants every available token scope" },
  { id: "permissions.job-write-all", points: 25, reason: "write-all grants every available token scope" },
  {
    id: "pull-request-target.checkout-head-with-write",
    points: 25,
    reason: "pull_request_target checks out pull request head while write permissions are available"
  },
  {
    id: "permissions.workflow-write-should-be-job-level",
    points: 20,
    reason: "workflow-level write permissions appear broader than needed"
  },
  { id: "permissions.missing-explicit", points: 15, reason: "job relies on implicit token permissions" },
  {
    id: "permissions.id-token-write-unneeded",
    points: 15,
    reason: "id-token write was not tied to detected OIDC or attestation use"
  },
  {
    id: "permissions.packages-write-unneeded",
    points: 15,
    reason: "packages write was not tied to detected publishing"
  },
  {
    id: "permissions.contents-write-unneeded",
    points: 15,
    reason: "contents write appears broader than contents read"
  },
  {
    id: "pull-request-target.contents-write",
    points: 15,
    reason: "contents write on pull_request_target was not tied to a clear operation"
  },
  { id: "permissions.read-all-too-broad", points: 10, reason: "read-all appears broader than needed" },
  { id: "permissions.extra-write-scopes", points: 10, reason: "job has extra write scopes" },
  {
    id: "rules.unknown-third-party-action",
    points: 5,
    reason: "unknown third-party action appears in a broadly permissioned job"
  }
];

export function computeScore(findings: Finding[]): PermissionScore {
  const penalties: ScorePenalty[] = [];

  for (const finding of findings) {
    const rule = penaltyRules.find((candidate) => candidate.id === finding.id);
    if (!rule) {
      continue;
    }

    penalties.push({
      id: finding.id,
      points: rule.points,
      reason: rule.reason,
      filePath: finding.filePath,
      jobId: finding.jobId
    });
  }

  const totalPenalty = penalties.reduce((total, penalty) => total + penalty.points, 0);
  const value = clampScore(100 - totalPenalty);

  return {
    value,
    label: labelForScore(value),
    penalties
  };
}

export function buildBadge(score: PermissionScore): BadgeSummary {
  const label = `permissio ${score.value}/100`;
  const color = colorForScore(score.value);
  return {
    markdown: `![permissio score](https://img.shields.io/badge/permissio-${score.value}%2F100-${color})`,
    label,
    color
  };
}

export function withBadge<T extends { score: PermissionScore }>(report: T): T & { badge: BadgeSummary } {
  return {
    ...report,
    badge: buildBadge(report.score)
  };
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function labelForScore(value: number): PermissionScore["label"] {
  if (value >= 90) {
    return "strong";
  }

  if (value >= 70) {
    return "good";
  }

  if (value >= 50) {
    return "risky";
  }

  return "critical";
}

function colorForScore(value: number): string {
  if (value >= 90) {
    return "brightgreen";
  }

  if (value >= 70) {
    return "yellowgreen";
  }

  if (value >= 50) {
    return "orange";
  }

  return "red";
}
