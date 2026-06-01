import path from "node:path";
import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { runCli } from "../src/cli.js";
import { renderJson } from "../src/reporters/json.js";
import { scanPath } from "../src/index.js";

const fixtures = path.join(process.cwd(), "test/fixtures");
const execFileAsync = promisify(execFile);

describe("cli", () => {
  it("prints stable JSON output", async () => {
    const output: string[] = [];
    const code = await runCli(["check", fixtures, "--include", "basic.yml", "--format", "json"], {
      cwd: process.cwd(),
      writeOut: (value) => output.push(value),
      writeErr: (value) => output.push(value)
    });

    expect(code).toBe(0);
    const parsed = JSON.parse(output.join(""));
    expect(parsed.summary.filesScanned).toBe(1);
    expect(parsed.workflows[0].jobs).toHaveLength(2);
    expect(parsed.workflows[0].filePath).toBe("basic.yml");
  });

  it("returns exit code 1 when fail-on high is triggered", async () => {
    const output: string[] = [];
    const code = await runCli(["check", fixtures, "--include", "risky.yml", "--fail-on", "high", "--quiet"], {
      cwd: process.cwd(),
      writeOut: (value) => output.push(value),
      writeErr: (value) => output.push(value)
    });

    expect(code).toBe(1);
    expect(output.join("")).toContain("pull_request_target");
  });

  it("returns exit code 2 for invalid CLI input", async () => {
    const output: string[] = [];
    const code = await runCli(["check", fixtures, "--format", "xml"], {
      cwd: process.cwd(),
      writeOut: (value) => output.push(value),
      writeErr: (value) => output.push(value)
    });

    expect(code).toBe(2);
    expect(output.join("")).toContain("invalid --format");
  });

  it("prints no output in quiet mode when there are no findings", async () => {
    const output: string[] = [];
    const code = await runCli(["check", fixtures, "--include", "clean.yml", "--quiet"], {
      cwd: process.cwd(),
      writeOut: (value) => output.push(value),
      writeErr: (value) => output.push(value)
    });

    expect(code).toBe(0);
    expect(output.join("")).toBe("");
  });

  it("handles directories with no workflow files", async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), "permissio-empty-"));
    try {
      const output: string[] = [];
      const code = await runCli(["check", tempDir], {
        cwd: process.cwd(),
        writeOut: (value) => output.push(value),
        writeErr: (value) => output.push(value)
      });

      expect(code).toBe(0);
      expect(output.join("")).toContain("No workflow files found.");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("renders valid JSON through the reporter", async () => {
    const report = await scanPath(fixtures, { include: ["basic.yml"] });
    const parsed = JSON.parse(renderJson(report));

    expect(parsed.summary.jobsScanned).toBe(2);
  });

  it("executes from the ESM entrypoint", async () => {
    const { stdout } = await execFileAsync(
      process.execPath,
      ["--import", "tsx", "src/cli.ts", "check", fixtures, "--include", "basic.yml", "--format", "json"],
      { cwd: process.cwd() }
    );

    const parsed = JSON.parse(stdout);
    expect(parsed.summary.filesScanned).toBe(1);
  });

  it("prints the CLI version", async () => {
    const output: string[] = [];
    const code = await runCli(["--version"], {
      cwd: process.cwd(),
      writeOut: (value) => output.push(value),
      writeErr: (value) => output.push(value)
    });

    expect(code).toBe(0);
    expect(output.join("").trim()).toBe("0.1.0");
  });
});
