import { readFile } from "node:fs/promises";
import path from "node:path";
import YAML, { isMap, isNode, isScalar, isSeq, LineCounter } from "yaml";
import { withFindingCategory } from "./findings.js";
import { parsePermissions } from "./permissions.js";
import type { Finding, ParsedJob, ParsedStep, ParsedWorkflow, SourceLocation } from "./types.js";

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
  const lineCounter = new LineCounter();
  const doc = YAML.parseDocument(sourceText, { lineCounter, prettyErrors: false });

  if (doc.errors.length > 0) {
    const errorOffset = Math.max(0, (doc.errors[0]?.pos[0] ?? 0) - 1);
    findings.push({
      id: "parse.invalid-yaml",
      severity: "high",
      message: "Workflow YAML could not be parsed",
      filePath,
      evidence: doc.errors[0]?.message,
      location: locationForOffset(errorOffset, lineCounter)
    });
    return { findings: findings.map(withFindingCategory) };
  }

  const raw = doc.toJS({ mapAsMap: false });
  if (!isRecord(raw)) {
    findings.push({
      id: "parse.invalid-workflow",
      severity: "high",
      message: "Workflow file does not contain a YAML object",
      filePath,
      location: locationForNode(doc.contents, lineCounter)
    });
    return { findings: findings.map(withFindingCategory) };
  }

  const rootNode = doc.contents;
  const permissionsNode = mapValue(rootNode, "permissions");
  const jobsNode = mapValue(rootNode, "jobs");

  const workflow: ParsedWorkflow = {
    filePath,
    name: typeof raw.name === "string" ? raw.name : path.basename(filePath),
    on: raw.on ?? raw.true,
    permissions: parsePermissions(raw.permissions),
    jobs: parseJobs(raw.jobs, jobsNode, lineCounter),
    location: locationForNode(rootNode, lineCounter),
    triggerLocation: mapKeyLocation(rootNode, "on", lineCounter),
    permissionsLocation: mapKeyLocation(rootNode, "permissions", lineCounter),
    permissionLocations: mapEntryLocations(permissionsNode, lineCounter),
    raw,
    sourceText
  };

  return { workflow, findings: findings.map(withFindingCategory) };
}

function parseJobs(value: unknown, jobsNode: unknown, lineCounter: LineCounter): ParsedJob[] {
  if (!isRecord(value)) {
    return [];
  }

  return Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, rawJob]) => {
      const jobRecord = isRecord(rawJob) ? rawJob : {};
      const jobNode = mapValue(jobsNode, id);
      const permissionsNode = mapValue(jobNode, "permissions");
      return {
        id,
        name: typeof jobRecord.name === "string" ? jobRecord.name : undefined,
        uses: typeof jobRecord.uses === "string" ? jobRecord.uses : undefined,
        permissions: parsePermissions(jobRecord.permissions),
        location: mapKeyLocation(jobsNode, id, lineCounter),
        permissionsLocation: mapKeyLocation(jobNode, "permissions", lineCounter),
        permissionLocations: mapEntryLocations(permissionsNode, lineCounter),
        steps: parseSteps(jobRecord.steps, mapValue(jobNode, "steps"), lineCounter),
        raw: jobRecord
      };
    });
}

function parseSteps(value: unknown, stepsNode: unknown, lineCounter: LineCounter): ParsedStep[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((step, index): ParsedStep => {
    const record = isRecord(step) ? step : {};
    const stepNode = isSeq(stepsNode) ? stepsNode.items[index] : undefined;
    return {
      name: typeof record.name === "string" ? record.name : undefined,
      uses: typeof record.uses === "string" ? record.uses : undefined,
      run: typeof record.run === "string" ? record.run : undefined,
      with: isRecord(record.with) ? record.with : undefined,
      env: isRecord(record.env) ? record.env : undefined,
      location: locationForNode(stepNode, lineCounter),
      raw: step
    };
  });
}

function mapValue(value: unknown, key: string): unknown {
  if (!isMap(value)) {
    return undefined;
  }

  return value.items.find((item) => isScalar(item.key) && String(item.key.value) === key)?.value;
}

function mapKeyLocation(value: unknown, key: string, lineCounter: LineCounter): SourceLocation | undefined {
  if (!isMap(value)) {
    return undefined;
  }

  const item = value.items.find((candidate) => isScalar(candidate.key) && String(candidate.key.value) === key);
  return locationForNode(item?.key, lineCounter);
}

function mapEntryLocations(value: unknown, lineCounter: LineCounter): Record<string, SourceLocation> {
  if (!isMap(value)) {
    return {};
  }

  const locations: Record<string, SourceLocation> = {};
  for (const item of value.items) {
    if (!isScalar(item.key)) {
      continue;
    }

    const location = locationForNode(item.key, lineCounter);
    if (location) {
      locations[String(item.key.value)] = location;
    }
  }

  return locations;
}

function locationForNode(value: unknown, lineCounter: LineCounter): SourceLocation | undefined {
  if (!isNode(value) || !value.range) {
    return undefined;
  }

  return locationForOffset(value.range[0], lineCounter);
}

function locationForOffset(offset: number, lineCounter: LineCounter): SourceLocation {
  const position = lineCounter.linePos(offset);
  return {
    startLine: Math.max(1, position.line),
    startColumn: Math.max(1, position.col)
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
