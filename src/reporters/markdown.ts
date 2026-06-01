import type { ScanReport } from "../types.js";

export interface MarkdownReporterOptions {
  showSnippets?: boolean;
}

export function renderMarkdown(report: ScanReport, options: MarkdownReporterOptions = {}): string {
  const lines: string[] = [];

  lines.push("# permissio report");
  lines.push("");
  lines.push("| Files | Workflows | Jobs | High | Medium | Low | Jobs with changes |");
  lines.push("| ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
  lines.push(
    `| ${report.summary.filesScanned} | ${report.summary.workflowsScanned} | ${report.summary.jobsScanned} | ${report.summary.high} | ${report.summary.medium} | ${report.summary.low} | ${report.summary.jobsWithRecommendedChanges} |`
  );

  if (report.workflows.length === 0) {
    lines.push("");
    lines.push("No workflow files found.");
    return `${lines.join("\n")}\n`;
  }

  for (const workflow of report.workflows) {
    lines.push("");
    lines.push(`## ${workflow.filePath}`);
    lines.push("");
    lines.push("| Job | Current | Recommended | Findings |");
    lines.push("| --- | --- | --- | --- |");

    for (const job of workflow.jobs) {
      const findings = job.findings.map((finding) => `${finding.severity}: ${finding.message}`).join("<br>") || "None";
      lines.push(
        `| ${escapePipes(job.jobId)} | ${escapePipes(job.current.summary)} | ${escapePipes(job.recommended.summary)} | ${escapePipes(findings)} |`
      );
    }

    const allContentsRead = workflow.jobs.length > 0 && workflow.jobs.every((job) => {
      const permissions = job.recommended.permissions;
      const keys = Object.keys(permissions);
      return keys.length === 1 && permissions.contents === "read";
    });

    if (allContentsRead) {
      lines.push("");
      lines.push("> All jobs only need `contents: read`; workflow-level `permissions: contents: read` is acceptable.");
    }

    if (options.showSnippets) {
      for (const job of workflow.jobs) {
        lines.push("");
        lines.push(`### ${job.jobId} snippet`);
        lines.push("");
        lines.push("```yaml");
        lines.push(job.snippet);
        lines.push("```");
      }
    }
  }

  if (report.findings.length > 0) {
    lines.push("");
    lines.push("## Findings");
    lines.push("");
    for (const finding of report.findings) {
      const location = [finding.filePath, finding.jobId].filter(Boolean).join(" / ");
      lines.push(`- **${finding.severity}** ${finding.message} (${location})`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function escapePipes(value: string): string {
  return value.replaceAll("|", "\\|");
}
