import { stat } from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";

export const DEFAULT_WORKFLOW_GLOB = ".github/workflows/*.{yml,yaml}";

export class WorkflowDiscoveryError extends Error {
  readonly code = 2;

  constructor(message: string) {
    super(message);
    this.name = "WorkflowDiscoveryError";
  }
}

export async function discoverWorkflowFiles(targetPath: string, include: string[] = []): Promise<string[]> {
  const root = path.resolve(targetPath);
  let stats;

  try {
    stats = await stat(root);
  } catch {
    throw new WorkflowDiscoveryError(`Path does not exist or is unreadable: ${targetPath}`);
  }

  if (!stats.isDirectory()) {
    throw new WorkflowDiscoveryError(`permissio check expects a directory path: ${targetPath}`);
  }

  const patterns = [DEFAULT_WORKFLOW_GLOB, ...include];
  const files = await fg(patterns, {
    cwd: root,
    absolute: true,
    onlyFiles: true,
    unique: true,
    ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/coverage/**"]
  });

  return files.sort((a, b) => a.localeCompare(b));
}
