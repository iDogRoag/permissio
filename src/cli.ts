#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Command, CommanderError } from "commander";
import { scanPath } from "./index.js";
import { renderHtml } from "./reporters/html.js";
import { renderJson } from "./reporters/json.js";
import { renderMarkdown } from "./reporters/markdown.js";
import { renderTable } from "./reporters/table.js";
import { withBadge } from "./score.js";
import type { ScanReport } from "./types.js";

type Format = "table" | "json" | "markdown" | "html";
type FailOn = "none" | "high" | "changes";

interface CheckOptions {
  format: Format;
  failOn: FailOn;
  showSnippets: boolean;
  include: string[];
  quiet: boolean;
  ci: boolean;
  badge: boolean;
  output?: string;
}

interface Io {
  cwd: string;
  writeOut: (value: string) => void;
  writeErr: (value: string) => void;
}

const validFormats = new Set(["table", "json", "markdown", "html"]);
const validDemoFormats = new Set(["table", "json", "markdown", "html"]);
const validFailOn = new Set(["none", "high", "changes"]);
const version = readPackageVersion();

export async function runCli(argv = process.argv.slice(2), io: Io = defaultIo()): Promise<number> {
  let exitCode = 0;
  const program = new Command();

  program
    .name("permissio")
    .description("GitHub Actions permission minimizer for least-privilege GITHUB_TOKEN settings.")
    .version(version)
    .exitOverride()
    .configureOutput({
      writeOut: io.writeOut,
      writeErr: io.writeErr
    });

  program
    .command("check [path]")
    .description("Scan GitHub Actions workflows in a directory.")
    .option("--format <format>", "Output format: table, json, markdown, or html", "table")
    .option("--fail-on <policy>", "Exit 1 on high findings or recommended changes: none, high, changes", "none")
    .option("--show-snippets", "Show copy-paste YAML snippets for each job", false)
    .option("--include <glob>", "Optional extra workflow glob", collect, [])
    .option("--quiet", "Only print findings, not intro text", false)
    .option("--ci", "CI-friendly mode; use with --fail-on to choose failure behavior", false)
    .option("--output <file>", "Write report output to a file")
    .option("--badge", "Print badge Markdown after the summary", false)
    .action(async (targetPath = ".", options) => {
      exitCode = await runCheckCommand(targetPath, normalizeOptions(options), io);
    });

  program
    .command("demo")
    .description("Scan a bundled risky workflow example.")
    .option("--format <format>", "Output format: table, json, markdown, or html", "table")
    .option("--show-snippets", "Show copy-paste YAML snippets for each job", false)
    .option("--output <file>", "Write report output to a file")
    .option("--badge", "Print badge Markdown after the summary", false)
    .action(async (options) => {
      exitCode = await runDemoCommand(normalizeOptions({ ...options, failOn: "none", include: [] }), io);
    });

  try {
    await program.parseAsync(["node", "permissio", ...argv], { from: "node" });
    return exitCode;
  } catch (error) {
    if (error instanceof CommanderError) {
      return error.exitCode === 0 ? 0 : 2;
    }

    io.writeErr(`permissio: ${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  }
}

export async function runCheckCommand(targetPath: string, options: CheckOptions, io: Io = defaultIo()): Promise<number> {
  if (!validFormats.has(options.format)) {
    io.writeErr(`permissio: invalid --format "${options.format}"\n`);
    return 2;
  }

  if (!validFailOn.has(options.failOn)) {
    io.writeErr(`permissio: invalid --fail-on "${options.failOn}"\n`);
    return 2;
  }

  let report: ScanReport;
  try {
    report = await scanPath(resolveFromCwd(io.cwd, targetPath), { include: options.include });
  } catch (error) {
    io.writeErr(`permissio: ${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  }

  if (options.badge) {
    report = withBadge(report);
  }

  const rendered = renderReport(report, options);
  if (options.output) {
    await writeOutputFile(io.cwd, options.output, rendered);
  } else {
    io.writeOut(rendered);
  }

  return exitCodeFor(report, options.failOn);
}

export async function runDemoCommand(options: CheckOptions, io: Io = defaultIo()): Promise<number> {
  if (!validDemoFormats.has(options.format)) {
    io.writeErr(`permissio: invalid --format "${options.format}"\n`);
    return 2;
  }

  let report: ScanReport;
  try {
    report = await scanPath(demoPath());
  } catch (error) {
    io.writeErr(`permissio: ${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  }

  if (options.badge) {
    report = withBadge(report);
  }

  const rendered = renderReport(report, options);
  if (options.output) {
    await writeOutputFile(io.cwd, options.output, rendered);
  } else {
    io.writeOut(rendered);
  }

  return 0;
}

function exitCodeFor(report: ScanReport, failOn: FailOn): number {
  if (failOn === "high" && report.summary.high > 0) {
    return 1;
  }

  if (failOn === "changes" && report.summary.jobsWithRecommendedChanges > 0) {
    return 1;
  }

  return 0;
}

function normalizeOptions(options: Record<string, unknown>): CheckOptions {
  return {
    format: String(options.format ?? "table") as Format,
    failOn: String(options.failOn ?? "none") as FailOn,
    showSnippets: Boolean(options.showSnippets),
    include: Array.isArray(options.include) ? options.include.map(String) : [],
    quiet: Boolean(options.quiet),
    ci: Boolean(options.ci),
    badge: Boolean(options.badge),
    output: typeof options.output === "string" ? options.output : undefined
  };
}

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

function resolveFromCwd(cwd: string, targetPath: string): string {
  return path.resolve(cwd, targetPath);
}

function renderReport(report: ScanReport, options: CheckOptions): string {
  if (options.format === "json") {
    return renderJson(report);
  }

  if (options.format === "markdown") {
    return renderMarkdown(report, { showSnippets: options.showSnippets, badge: options.badge });
  }

  if (options.format === "html") {
    return renderHtml(report);
  }

  return renderTable(report, { showSnippets: options.showSnippets, quiet: options.quiet, badge: options.badge });
}

async function writeOutputFile(cwd: string, outputPath: string, value: string): Promise<void> {
  const resolved = resolveFromCwd(cwd, outputPath);
  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, value, "utf8");
}

function demoPath(): string {
  return fileURLToPath(new URL("../examples/risky", import.meta.url));
}

function defaultIo(): Io {
  return {
    cwd: process.cwd(),
    writeOut: (value) => process.stdout.write(value),
    writeErr: (value) => process.stderr.write(value)
  };
}

function readPackageVersion(): string {
  try {
    const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
      version?: unknown;
    };
    return typeof manifest.version === "string" ? manifest.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const code = await runCli();
  process.exitCode = code;
}
