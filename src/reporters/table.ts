import pc from "picocolors";
import type { Finding, ScanReport } from "../types.js";

export interface TableReporterOptions {
  showSnippets?: boolean;
  quiet?: boolean;
}

export function renderTable(report: ScanReport, options: TableReporterOptions = {}): string {
  const lines: string[] = [];

  if (options.quiet) {
    return renderQuietFindings(report);
  }

  if (!options.quiet) {
    lines.push(
      `permissio scanned ${report.summary.filesScanned} file(s), ${report.summary.workflowsScanned} workflow(s), ${report.summary.jobsScanned} job(s)`
    );
    lines.push(
      `findings: ${pc.red(String(report.summary.high))} high, ${pc.yellow(String(report.summary.medium))} medium, ${pc.cyan(String(report.summary.low))} low`
    );
    lines.push("");
  }

  if (report.workflows.length === 0) {
    lines.push("No workflow files found.");
    return `${lines.join("\n")}\n`;
  }

  for (const workflow of report.workflows) {
    lines.push(workflow.filePath);

    for (const job of workflow.jobs) {
      lines.push(`  job ${job.jobId}${job.jobName ? ` (${job.jobName})` : ""}`);
      lines.push(`    current      ${job.current.summary}`);
      lines.push(`    recommended ${job.recommended.summary}`);
      lines.push(`    findings     ${formatFindings(job.findings)}`);
      lines.push(`    reasons      ${job.reasons.map((reason) => reason.reason).join("; ") || "none detected"}`);

      if (options.showSnippets) {
        lines.push("    snippet");
        for (const snippetLine of job.snippet.split("\n")) {
          lines.push(`      ${snippetLine}`);
        }
      }
    }

    const allContentsRead = workflow.jobs.length > 0 && workflow.jobs.every((job) => {
      const permissions = job.recommended.permissions;
      const keys = Object.keys(permissions);
      return keys.length === 1 && permissions.contents === "read";
    });

    if (allContentsRead) {
      lines.push("  note workflow-level contents read is acceptable for this workflow");
    }
  }

  return `${lines.join("\n")}\n`;
}

function formatFindings(findings: Finding[]): string {
  if (findings.length === 0) {
    return "none";
  }

  return findings.map((finding) => `${finding.severity} ${finding.message}`).join("; ");
}

function renderQuietFindings(report: ScanReport): string {
  if (report.findings.length === 0) {
    return "";
  }

  return `${report.findings
    .map((finding) => {
      const location = [finding.filePath, finding.jobId].filter(Boolean).join(" ");
      return `${finding.severity} ${finding.message}${location ? ` (${location})` : ""}`;
    })
    .join("\n")}\n`;
}
