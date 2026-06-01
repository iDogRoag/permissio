import type { Finding, FindingCategory, WorkflowResult } from "./types.js";

export function withFindingCategory(finding: Finding): Finding {
  return {
    ...finding,
    category: finding.category ?? categoryForFindingId(finding.id)
  };
}

export function withWorkflowFindingCategories(workflow: WorkflowResult): WorkflowResult {
  return {
    ...workflow,
    findings: workflow.findings.map(withFindingCategory),
    jobs: workflow.jobs.map((job) => ({
      ...job,
      findings: job.findings.map(withFindingCategory)
    }))
  };
}

function categoryForFindingId(id: string): FindingCategory {
  if (id.startsWith("parse.")) {
    return "parse";
  }

  if (id.startsWith("pull-request-target.")) {
    return "pull-request-target";
  }

  if (id.startsWith("permissions.")) {
    return "permissions";
  }

  return "rules";
}
