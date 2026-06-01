import path from "node:path";
import { discoverWorkflowFiles } from "./discover.js";
import { withFindingCategory, withWorkflowFindingCategories } from "./findings.js";
import { parseWorkflowFile } from "./parser.js";
import { analyzeWorkflow } from "./rules.js";
import type { Finding, ScanOptions, ScanReport, ScanSummary, WorkflowResult } from "./types.js";

export type {
  Finding,
  FindingCategory,
  JobResult,
  ParsedJob,
  ParsedStep,
  ParsedWorkflow,
  PermissionLevel,
  PermissionScope,
  ScanReport,
  WorkflowResult
} from "./types.js";

export { discoverWorkflowFiles } from "./discover.js";
export { parseWorkflowFile, parseWorkflowSource } from "./parser.js";
export { analyzeWorkflow } from "./rules.js";

export async function scanPath(targetPath = ".", options: ScanOptions = {}): Promise<ScanReport> {
  const root = path.resolve(targetPath);
  const files = await discoverWorkflowFiles(root, options.include ?? []);
  const workflows: WorkflowResult[] = [];
  const findings: Finding[] = [];

  for (const file of files) {
    const displayPath = toDisplayPath(root, file);
    const parsed = await parseWorkflowFile(file);
    findings.push(...parsed.findings.map((finding) => withFindingCategory({ ...finding, filePath: displayPath })));

    if (parsed.workflow) {
      parsed.workflow.filePath = displayPath;
      const workflow = withWorkflowFindingCategories(analyzeWorkflow(parsed.workflow));
      workflows.push(workflow);
      findings.push(...workflow.findings);
      for (const job of workflow.jobs) {
        findings.push(...job.findings);
      }
    }
  }

  const sortedWorkflows = workflows.sort((a, b) => a.filePath.localeCompare(b.filePath));
  const sortedFindings = sortFindings(findings);
  const jobs = sortedWorkflows.flatMap((workflow) => workflow.jobs);
  const summary: ScanSummary = {
    filesScanned: files.length,
    workflowsScanned: sortedWorkflows.length,
    jobsScanned: jobs.length,
    high: sortedFindings.filter((finding) => finding.severity === "high").length,
    medium: sortedFindings.filter((finding) => finding.severity === "medium").length,
    low: sortedFindings.filter((finding) => finding.severity === "low").length,
    jobsWithRecommendedChanges: jobs.filter((job) => job.hasRecommendedChanges).length
  };

  return {
    schemaVersion: "1.0",
    summary,
    workflows: sortedWorkflows,
    findings: sortedFindings
  };
}

function toDisplayPath(root: string, filePath: string): string {
  const relative = path.relative(root, filePath);
  return relative.startsWith("..") ? filePath : relative || path.basename(filePath);
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
