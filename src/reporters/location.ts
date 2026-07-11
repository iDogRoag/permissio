import type { Finding } from "../types.js";

export function formatFindingLocation(finding: Finding, separator = " "): string {
  const source = finding.location
    ? `${finding.filePath}:${finding.location.startLine}:${finding.location.startColumn}`
    : finding.filePath;

  return [source, finding.jobId].filter(Boolean).join(separator);
}
