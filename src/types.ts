export const PERMISSION_SCOPES = [
  "actions",
  "artifact-metadata",
  "attestations",
  "checks",
  "code-quality",
  "contents",
  "deployments",
  "discussions",
  "id-token",
  "issues",
  "models",
  "packages",
  "pages",
  "pull-requests",
  "security-events",
  "statuses",
  "vulnerability-alerts"
] as const;

export type PermissionScope = (typeof PERMISSION_SCOPES)[number];
export type PermissionLevel = "none" | "read" | "write";
export type PermissionKind = "missing" | "empty" | "read-all" | "write-all" | "map";
export type PermissionSource = "implicit" | "workflow" | "job";
export type Confidence = "high" | "medium" | "low";
export type Severity = "high" | "medium" | "low";
export type FindingCategory = "parse" | "permissions" | "pull-request-target" | "rules";

export interface SourceLocation {
  startLine: number;
  startColumn: number;
}

export type ParsedPermissions =
  | { kind: "missing"; raw?: undefined }
  | { kind: "empty"; raw: Record<string, never> }
  | { kind: "read-all"; raw: "read-all" }
  | { kind: "write-all"; raw: "write-all" }
  | {
      kind: "map";
      raw: Record<string, unknown>;
      permissions: Record<string, PermissionLevel>;
      unknownScopes: string[];
    };

export interface ParsedStep {
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
  env?: Record<string, unknown>;
  location?: SourceLocation;
  raw: unknown;
}

export interface ParsedJob {
  id: string;
  name?: string;
  uses?: string;
  permissions: ParsedPermissions;
  location?: SourceLocation;
  permissionsLocation?: SourceLocation;
  permissionLocations?: Record<string, SourceLocation>;
  steps: ParsedStep[];
  raw: Record<string, unknown>;
}

export interface ParsedWorkflow {
  filePath: string;
  name: string;
  on: unknown;
  permissions: ParsedPermissions;
  jobs: ParsedJob[];
  location?: SourceLocation;
  triggerLocation?: SourceLocation;
  permissionsLocation?: SourceLocation;
  permissionLocations?: Record<string, SourceLocation>;
  raw: Record<string, unknown>;
  sourceText: string;
}

export interface Finding {
  id: string;
  category?: FindingCategory;
  severity: Severity;
  message: string;
  filePath: string;
  workflowName?: string;
  jobId?: string;
  scope?: string;
  evidence?: string;
  location?: SourceLocation;
}

export interface RecommendationReason {
  scope: PermissionScope;
  level: PermissionLevel;
  reason: string;
  confidence: Confidence;
  evidence: string;
  ruleId: string;
}

export interface CurrentPermissionSummary {
  source: PermissionSource;
  kind: PermissionKind;
  summary: string;
  permissions: Record<PermissionScope, PermissionLevel>;
}

export interface RecommendedPermissionSummary {
  permissions: Partial<Record<PermissionScope, Exclude<PermissionLevel, "none">>>;
  summary: string;
}

export interface JobResult {
  filePath: string;
  workflowName: string;
  jobId: string;
  jobName?: string;
  current: CurrentPermissionSummary;
  recommended: RecommendedPermissionSummary;
  reasons: RecommendationReason[];
  findings: Finding[];
  snippet: string;
  hasRecommendedChanges: boolean;
}

export interface WorkflowResult {
  filePath: string;
  workflowName: string;
  jobs: JobResult[];
  findings: Finding[];
}

export interface ScanSummary {
  filesScanned: number;
  workflowsScanned: number;
  jobsScanned: number;
  jobsWithWriteAll: number;
  jobsMissingExplicitPermissions: number;
  high: number;
  medium: number;
  low: number;
  jobsWithRecommendedChanges: number;
}

export interface ScorePenalty {
  id: string;
  points: number;
  reason: string;
  filePath: string;
  jobId?: string;
}

export interface PermissionScore {
  value: number;
  label: "strong" | "good" | "risky" | "critical";
  status?: "complete" | "incomplete";
  penalties: ScorePenalty[];
}

export interface BadgeSummary {
  markdown: string;
  label: string;
  color: string;
}

export interface ScanReport {
  schemaVersion: "1.0";
  summary: ScanSummary;
  score: PermissionScore;
  badge?: BadgeSummary;
  workflows: WorkflowResult[];
  findings: Finding[];
}

export interface ScanOptions {
  include?: string[];
}
