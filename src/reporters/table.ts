import pc from "picocolors";
import type { Finding, JobResult, ScanReport } from "../types.js";

export interface TableReporterOptions {
  showSnippets?: boolean;
  quiet?: boolean;
  badge?: boolean;
}

export function renderTable(report: ScanReport, options: TableReporterOptions = {}): string {
  const lines: string[] = [];

  if (options.quiet) {
    return renderQuietFindings(report);
  }

  if (!options.quiet) {
    lines.push(pc.bold("Permissio"));
    lines.push("");
    lines.push(`Permission score ${scoreColor(report.score.value)} out of 100 (${report.score.label})`);
    lines.push(`Workflows scanned ${report.summary.workflowsScanned}`);
    lines.push(`Jobs scanned ${report.summary.jobsScanned}`);
    lines.push(`Jobs with write-all ${report.summary.jobsWithWriteAll}`);
    lines.push(`Jobs missing explicit permissions ${report.summary.jobsMissingExplicitPermissions}`);
    lines.push(`Jobs with recommended changes ${report.summary.jobsWithRecommendedChanges}`);
    lines.push(`High findings ${report.summary.high}`);

    if (options.badge && report.badge) {
      lines.push("");
      lines.push(report.badge.markdown);
    }

    lines.push("");
  }

  if (report.workflows.length === 0) {
    lines.push("No GitHub Actions workflows found.");
    lines.push("Permissio scans .github/workflows by default.");
    lines.push("Try permissio demo to see an example report.");
    return `${lines.join("\n")}\n`;
  }

  if (report.findings.length > 0) {
    lines.push("Top findings");
    lines.push("");
    for (const finding of report.findings.slice(0, 5)) {
      lines.push(formatFinding(finding));
    }

    if (report.findings.length > 5) {
      lines.push("");
      lines.push("Showing top 5 findings.");
      lines.push("Use --format markdown or --show-snippets for details.");
    }
  } else {
    lines.push("Top findings");
    lines.push("");
    lines.push("No findings.");
  }

  const snippetJob = firstJobWithRecommendedChanges(report);
  if (snippetJob) {
    lines.push("");
    lines.push("Suggested snippet");
    lines.push("");
    lines.push(snippetJob.snippet);
  }

  if (options.showSnippets) {
    lines.push("");
    lines.push("All snippets");
    for (const job of report.workflows.flatMap((workflow) => workflow.jobs).filter((job) => job.hasRecommendedChanges)) {
      lines.push("");
      lines.push(`${job.filePath} ${job.jobId}`);
      lines.push(job.snippet);
    }
  }

  return `${lines.join("\n")}\n`;
}

function formatFinding(finding: Finding): string {
  const location = [finding.filePath, finding.jobId].filter(Boolean).join(" ");
  return `${finding.message}${location ? ` (${location})` : ""}`;
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

function firstJobWithRecommendedChanges(report: ScanReport): JobResult | undefined {
  return report.workflows.flatMap((workflow) => workflow.jobs).find((job) => job.hasRecommendedChanges);
}

function scoreColor(value: number): string {
  const text = String(value);
  if (value >= 90) {
    return pc.green(text);
  }

  if (value >= 70) {
    return pc.yellow(text);
  }

  if (value >= 50) {
    return pc.yellow(text);
  }

  return pc.red(text);
}
