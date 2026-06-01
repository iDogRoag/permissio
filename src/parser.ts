import { readFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { withFindingCategory } from "./findings.js";
import { parsePermissions } from "./permissions.js";
import type { Finding, ParsedJob, ParsedStep, ParsedWorkflow } from "./types.js";

export interface ParseResult {
  workflow?: ParsedWorkflow;
  findings: Finding[];
}

export class WorkflowReadError extends Error {
  readonly code = 2;

  constructor(message: string) {
    super(message);
    this.name = "WorkflowReadError";
  }
}

export async function parseWorkflowFile(filePath: string): Promise<ParseResult> {
  let sourceText: string;
  try {
    sourceText = await readFile(filePath, "utf8");
  } catch {
    throw new WorkflowReadError(`Workflow file is unreadable: ${filePath}`);
  }

  return parseWorkflowSource(filePath, sourceText);
}

export function parseWorkflowSource(filePath: string, sourceText: string): ParseResult {
  const findings: Finding[] = [];
  const doc = YAML.parseDocument(sourceText, { prettyErrors: false });

  if (doc.errors.length > 0) {
    findings.push({
      id: "parse.invalid-yaml",
      severity: "high",
      message: "Workflow YAML could not be parsed",
      filePath,
      evidence: doc.errors[0]?.message
    });
    return { findings: findings.map(withFindingCategory) };
  }

  const raw = doc.toJS({ mapAsMap: false });
  if (!isRecord(raw)) {
    findings.push({
      id: "parse.invalid-workflow",
      severity: "high",
      message: "Workflow file does not contain a YAML object",
      filePath
    });
    return { findings: findings.map(withFindingCategory) };
  }

  const workflow: ParsedWorkflow = {
    filePath,
    name: typeof raw.name === "string" ? raw.name : path.basename(filePath),
    on: raw.on ?? raw.true,
    permissions: parsePermissions(raw.permissions),
    jobs: parseJobs(raw.jobs),
    raw,
    sourceText
  };

  return { workflow, findings: findings.map(withFindingCategory) };
}

function parseJobs(value: unknown): ParsedJob[] {
  if (!isRecord(value)) {
    return [];
  }

  return Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, rawJob]) => {
      const jobRecord = isRecord(rawJob) ? rawJob : {};
      return {
        id,
        name: typeof jobRecord.name === "string" ? jobRecord.name : undefined,
        uses: typeof jobRecord.uses === "string" ? jobRecord.uses : undefined,
        permissions: parsePermissions(jobRecord.permissions),
        steps: parseSteps(jobRecord.steps),
        raw: jobRecord
      };
    });
}

function parseSteps(value: unknown): ParsedStep[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((step): ParsedStep => {
    const record = isRecord(step) ? step : {};
    return {
      name: typeof record.name === "string" ? record.name : undefined,
      uses: typeof record.uses === "string" ? record.uses : undefined,
      run: typeof record.run === "string" ? record.run : undefined,
      with: isRecord(record.with) ? record.with : undefined,
      env: isRecord(record.env) ? record.env : undefined,
      raw: step
    };
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
