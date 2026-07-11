import { createHash } from "node:crypto";
import type { Finding, ScanReport, Severity } from "../types.js";

interface SarifReport {
  version: "2.1.0";
  $schema: string;
  runs: SarifRun[];
}

interface SarifRun {
  tool: {
    driver: {
      name: "permissio";
      informationUri: string;
      rules: SarifRule[];
    };
  };
  results: SarifResult[];
  properties: Record<string, unknown>;
}

interface SarifRule {
  id: string;
  name: string;
  shortDescription: {
    text: string;
  };
  fullDescription: {
    text: string;
  };
  helpUri: string;
  defaultConfiguration: {
    level: "error" | "warning" | "note";
  };
  properties: {
    category?: string;
    precision: "medium";
    tags: string[];
  };
}

interface SarifResult {
  ruleId: string;
  level: "error" | "warning" | "note";
  message: {
    text: string;
  };
  locations: Array<{
    physicalLocation: {
      artifactLocation: {
        uri: string;
      };
      region: {
        startLine: number;
        startColumn: number;
      };
    };
    logicalLocations?: Array<{
      name: string;
      kind: "job";
    }>;
  }>;
  partialFingerprints: {
    primaryLocationLineHash: string;
  };
  properties: {
    severity: Severity;
    category?: string;
    scope?: string;
    evidence?: string;
    workflowName?: string;
    jobId?: string;
  };
}

export function renderSarif(report: ScanReport): string {
  const rules = Array.from(ruleMap(report.findings).values()).sort((left, right) => left.id.localeCompare(right.id));
  const results = report.findings.map(toResult);
  const sarif: SarifReport = {
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name: "permissio",
            informationUri: "https://github.com/iDogRoag/permissio",
            rules
          }
        },
        results,
        properties: {
          schemaVersion: report.schemaVersion,
          score: report.score,
          summary: report.summary
        }
      }
    ]
  };

  return `${JSON.stringify(sarif, null, 2)}\n`;
}

function ruleMap(findings: Finding[]): Map<string, SarifRule> {
  const rules = new Map<string, SarifRule>();

  for (const finding of findings) {
    if (!rules.has(finding.id)) {
      rules.set(finding.id, {
        id: finding.id,
        name: finding.id,
        shortDescription: {
          text: finding.message
        },
        fullDescription: {
          text: finding.message
        },
        helpUri: "https://github.com/iDogRoag/permissio/blob/main/docs/rules.md",
        defaultConfiguration: {
          level: severityLevel(finding.severity)
        },
        properties: {
          category: finding.category,
          precision: "medium",
          tags: [...new Set(["github-actions", "permissions", finding.category ?? "permissions"])]
        }
      });
    }
  }

  return rules;
}

function toResult(finding: Finding): SarifResult {
  const sourceLocation = finding.location ?? { startLine: 1, startColumn: 1 };
  const location: SarifResult["locations"][number] = {
    physicalLocation: {
      artifactLocation: {
        uri: normalizeUri(finding.filePath)
      },
      region: {
        startLine: sourceLocation.startLine,
        startColumn: sourceLocation.startColumn
      }
    }
  };

  if (finding.jobId) {
    location.logicalLocations = [
      {
        name: finding.jobId,
        kind: "job"
      }
    ];
  }

  return {
    ruleId: finding.id,
    level: severityLevel(finding.severity),
    message: {
      text: finding.message
    },
    locations: [location],
    partialFingerprints: {
      primaryLocationLineHash: fingerprint(finding)
    },
    properties: {
      severity: finding.severity,
      category: finding.category,
      scope: finding.scope,
      evidence: finding.evidence,
      workflowName: finding.workflowName,
      jobId: finding.jobId
    }
  };
}

function severityLevel(severity: Severity): SarifResult["level"] {
  if (severity === "high") {
    return "error";
  }

  if (severity === "medium") {
    return "warning";
  }

  return "note";
}

function normalizeUri(filePath: string): string {
  return filePath.split("\\").join("/").split("/").map(encodeURIComponent).join("/");
}

function fingerprint(finding: Finding): string {
  const identity = [finding.id, finding.filePath, finding.jobId ?? "", finding.scope ?? "", finding.message].join("|");
  return createHash("sha256").update(identity).digest("hex");
}
