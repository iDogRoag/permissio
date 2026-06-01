import YAML from "yaml";
import {
  PERMISSION_SCOPES,
  type ParsedPermissions,
  type PermissionLevel,
  type PermissionScope
} from "./types.js";

const permissionRanks: Record<PermissionLevel, number> = {
  none: 0,
  read: 1,
  write: 2
};

const readOnlyScopes = new Set<PermissionScope>(["models", "vulnerability-alerts"]);
const writeOnlyScopes = new Set<PermissionScope>(["id-token"]);

export function isPermissionScope(scope: string): scope is PermissionScope {
  return (PERMISSION_SCOPES as readonly string[]).includes(scope);
}

export function normalizePermissionLevel(scope: string, value: unknown): PermissionLevel | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const level = value.toLowerCase();
  if (level !== "none" && level !== "read" && level !== "write") {
    return undefined;
  }

  if (scope === "id-token" && level === "read") {
    return undefined;
  }

  if ((scope === "models" || scope === "vulnerability-alerts") && level === "write") {
    return undefined;
  }

  return level;
}

export function parsePermissions(value: unknown): ParsedPermissions {
  if (value === undefined) {
    return { kind: "missing" };
  }

  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized === "read-all") {
      return { kind: "read-all", raw: "read-all" };
    }

    if (normalized === "write-all") {
      return { kind: "write-all", raw: "write-all" };
    }
  }

  if (isRecord(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return { kind: "empty", raw: {} };
    }

    const permissions: Record<string, PermissionLevel> = {};
    const unknownScopes: string[] = [];

    for (const [scope, rawLevel] of entries) {
      if (!isPermissionScope(scope)) {
        unknownScopes.push(scope);
        continue;
      }

      const level = normalizePermissionLevel(scope, rawLevel);
      if (level) {
        permissions[scope] = level;
      }
    }

    return {
      kind: "map",
      raw: value,
      permissions,
      unknownScopes: unknownScopes.sort()
    };
  }

  return { kind: "missing" };
}

export function expandPermissions(parsed: ParsedPermissions): Record<PermissionScope, PermissionLevel> {
  const expanded = emptyPermissionMap();

  if (parsed.kind === "read-all") {
    for (const scope of PERMISSION_SCOPES) {
      expanded[scope] = writeOnlyScopes.has(scope) ? "none" : "read";
    }
    return expanded;
  }

  if (parsed.kind === "write-all") {
    for (const scope of PERMISSION_SCOPES) {
      expanded[scope] = readOnlyScopes.has(scope) ? "read" : "write";
    }
    return expanded;
  }

  if (parsed.kind === "map") {
    for (const scope of PERMISSION_SCOPES) {
      expanded[scope] = parsed.permissions[scope] ?? "none";
    }
  }

  return expanded;
}

export function mergeLevel(existing: PermissionLevel | undefined, next: PermissionLevel): PermissionLevel {
  if (!existing || permissionRanks[next] > permissionRanks[existing]) {
    return next;
  }
  return existing;
}

export function hasAnyWrite(permissions: Record<PermissionScope, PermissionLevel>): boolean {
  return Object.values(permissions).includes("write");
}

export function hasAnyRecommendedWrite(
  permissions: Partial<Record<PermissionScope, Exclude<PermissionLevel, "none">>>
): boolean {
  return Object.values(permissions).includes("write");
}

export function recommendedToExpanded(
  permissions: Partial<Record<PermissionScope, Exclude<PermissionLevel, "none">>>
): Record<PermissionScope, PermissionLevel> {
  const expanded = emptyPermissionMap();
  for (const scope of PERMISSION_SCOPES) {
    expanded[scope] = permissions[scope] ?? "none";
  }
  return expanded;
}

export function recommendedSummary(
  permissions: Partial<Record<PermissionScope, Exclude<PermissionLevel, "none">>>
): string {
  const entries = permissionEntries(permissions);
  if (entries.length === 0) {
    return "permissions: {}";
  }

  return `permissions: ${entries.map(([scope, level]) => `${scope} ${level}`).join(", ")}`;
}

export function currentSummary(parsed: ParsedPermissions): string {
  if (parsed.kind === "missing") {
    return "implicit default";
  }

  if (parsed.kind === "empty") {
    return "permissions: {}";
  }

  if (parsed.kind === "read-all" || parsed.kind === "write-all") {
    return `permissions: ${parsed.kind}`;
  }

  const entries = permissionEntries(parsed.permissions);
  return entries.length > 0
    ? `permissions: ${entries.map(([scope, level]) => `${scope} ${level}`).join(", ")}`
    : "permissions: {}";
}

export function isReadAllOrEmptyRecommendation(
  permissions: Partial<Record<PermissionScope, Exclude<PermissionLevel, "none">>>
): boolean {
  const entries = permissionEntries(permissions);
  return entries.length === 0 || (entries.length === 1 && entries[0]?.[0] === "contents" && entries[0]?.[1] === "read");
}

export function hasRecommendedChanges(
  currentKind: ParsedPermissions["kind"],
  current: Record<PermissionScope, PermissionLevel>,
  recommended: Partial<Record<PermissionScope, Exclude<PermissionLevel, "none">>>
): boolean {
  if (currentKind === "missing") {
    return true;
  }

  const expandedRecommended = recommendedToExpanded(recommended);
  return PERMISSION_SCOPES.some((scope) => current[scope] !== expandedRecommended[scope]);
}

export function toSnippet(
  jobId: string,
  permissions: Partial<Record<PermissionScope, Exclude<PermissionLevel, "none">>>
): string {
  const orderedPermissions: Record<string, string> = {};
  for (const [scope, level] of permissionEntries(permissions)) {
    orderedPermissions[scope] = level;
  }

  const doc = {
    jobs: {
      [jobId]: {
        permissions: orderedPermissions
      }
    }
  };

  return YAML.stringify(doc).trimEnd();
}

export function permissionEntries(
  permissions: Partial<Record<PermissionScope | string, PermissionLevel>>
): Array<[PermissionScope, PermissionLevel]> {
  const entries: Array<[PermissionScope, PermissionLevel]> = [];
  for (const scope of PERMISSION_SCOPES) {
    const level = permissions[scope];
    if (level && level !== "none") {
      entries.push([scope, level]);
    }
  }
  return entries;
}

function emptyPermissionMap(): Record<PermissionScope, PermissionLevel> {
  return Object.fromEntries(PERMISSION_SCOPES.map((scope) => [scope, "none"])) as Record<
    PermissionScope,
    PermissionLevel
  >;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
