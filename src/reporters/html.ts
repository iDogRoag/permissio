import type { Finding, ScanReport } from "../types.js";

export function renderHtml(report: ScanReport): string {
  const topFindings = report.findings.slice(0, 10);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Permissio report</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f7f8fb;
      --text: #111827;
      --muted: #5f6b7a;
      --line: #d9dee7;
      --surface: #ffffff;
      --accent: #1f6feb;
      --danger: #b42318;
    }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
    }
    main {
      max-width: 960px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1, h2 {
      line-height: 1.15;
      margin: 0;
    }
    h1 {
      font-size: 40px;
    }
    h2 {
      font-size: 20px;
      margin-top: 36px;
      margin-bottom: 12px;
    }
    .lede {
      color: var(--muted);
      margin-top: 8px;
    }
    .score {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-top: 24px;
      padding: 10px 14px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      font-weight: 700;
    }
    .badge {
      border-radius: 999px;
      background: ${badgeColor(report.score.value)};
      color: #ffffff;
      padding: 4px 10px;
      font-size: 13px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      margin-top: 24px;
    }
    .metric {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px;
    }
    .metric strong {
      display: block;
      font-size: 24px;
    }
    .metric span {
      color: var(--muted);
      font-size: 13px;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin: 8px 0;
    }
    code, pre {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    }
    pre {
      overflow: auto;
      background: #111827;
      color: #f9fafb;
      border-radius: 8px;
      padding: 16px;
    }
    .severity-high {
      color: var(--danger);
      font-weight: 700;
    }
  </style>
</head>
<body>
  <main>
    <h1>Permissio report</h1>
    <p class="lede">GitHub Actions GITHUB_TOKEN permission review.</p>
    <div class="score">
      Permission score ${report.score.value} out of 100
      <span class="badge">${escapeHtml(report.score.label)}</span>
    </div>
    <section class="grid" aria-label="Summary">
      ${metric("Workflows", report.summary.workflowsScanned)}
      ${metric("Jobs", report.summary.jobsScanned)}
      ${metric("Write-all jobs", report.summary.jobsWithWriteAll)}
      ${metric("Missing explicit", report.summary.jobsMissingExplicitPermissions)}
      ${metric("Recommended changes", report.summary.jobsWithRecommendedChanges)}
      ${metric("High findings", report.summary.high)}
    </section>
    <h2>Top findings</h2>
    ${
      topFindings.length > 0
        ? `<ul>${topFindings.map((finding) => `<li>${formatFinding(finding)}</li>`).join("")}</ul>`
        : "<p>No findings.</p>"
    }
    <h2>Suggested snippets</h2>
    ${
      report.workflows
        .flatMap((workflow) => workflow.jobs)
        .filter((job) => job.hasRecommendedChanges)
        .slice(0, 5)
        .map((job) => `<h3>${escapeHtml(job.filePath)} / ${escapeHtml(job.jobId)}</h3><pre>${escapeHtml(job.snippet)}</pre>`)
        .join("") || "<p>No permission changes recommended.</p>"
    }
  </main>
</body>
</html>
`;
}

function metric(label: string, value: number): string {
  return `<div class="metric"><strong>${value}</strong><span>${escapeHtml(label)}</span></div>`;
}

function formatFinding(finding: Finding): string {
  const location = [finding.filePath, finding.jobId].filter(Boolean).join(" / ");
  const severityClass = finding.severity === "high" ? "severity-high" : "";
  return `<span class="${severityClass}">${escapeHtml(finding.severity)}</span>: ${escapeHtml(finding.message)}${
    location ? ` <small>(${escapeHtml(location)})</small>` : ""
  }`;
}

function badgeColor(value: number): string {
  if (value >= 90) {
    return "#168a45";
  }

  if (value >= 70) {
    return "#7a8f12";
  }

  if (value >= 50) {
    return "#d97706";
  }

  return "#c2410c";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
