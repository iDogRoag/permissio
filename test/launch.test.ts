import path from "node:path";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { runCli } from "../src/cli.js";

describe("launch features", () => {
  it("runs the bundled demo in table, json, and markdown formats", async () => {
    const table = await run(["demo"]);
    expect(table.code).toBe(0);
    expect(table.output).toContain("Permissio");
    expect(table.output).toContain("Permission score");

    const json = await run(["demo", "--format", "json"]);
    expect(json.code).toBe(0);
    const parsed = JSON.parse(json.output);
    expect(parsed.score.value).toEqual(expect.any(Number));
    expect(parsed.score.label).toEqual(expect.any(String));

    const markdown = await run(["demo", "--format", "markdown"]);
    expect(markdown.code).toBe(0);
    expect(markdown.output).toContain("**Permission score:**");

    const snippets = await run(["demo", "--show-snippets"]);
    expect(snippets.code).toBe(0);
    expect(snippets.output).toContain("All snippets");
  });

  it("writes demo HTML output", async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), "permissio-html-"));
    const outputPath = path.join(tempDir, "permissio-demo.html");
    try {
      const result = await run(["demo", "--format", "html", "--output", outputPath]);
      expect(result.code).toBe(0);
      expect(result.output).toBe("");

      const html = await readFile(outputPath, "utf8");
      expect(html).toContain("Permissio report");
      expect(html).toContain("Permission score");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("prints badge Markdown and includes badge JSON when requested", async () => {
    const table = await run(["demo", "--badge"]);
    expect(table.output).toContain("![permissio score](https://img.shields.io/badge/permissio-");

    const json = await run(["demo", "--format", "json", "--badge"]);
    const parsed = JSON.parse(json.output);
    expect(parsed.badge.markdown).toContain("img.shields.io");
    expect(parsed.badge.label).toMatch(/^permissio \d+\/100$/);
  });

  it("suggests demo when no workflows are found and exits 0", async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), "permissio-empty-"));
    try {
      const result = await run(["check", tempDir]);
      expect(result.code).toBe(0);
      expect(result.output).toContain("No GitHub Actions workflows found.");
      expect(result.output).toContain("Try permissio demo to see an example report.");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("limits default terminal findings to the top five", async () => {
    const result = await run(["demo"]);
    expect(result.output).toContain("Showing top 5 findings.");
    expect(result.output).toContain("Use --format markdown or --show-snippets for details.");
  });

  it("keeps launch docs and README promises in place", async () => {
    const readme = await readFile(path.join(process.cwd(), "README.md"), "utf8");
    expect(readme).toContain("npx @idogee/permissio check .");
    expect(readme).toContain("npx @idogee/permissio demo");
    expect(readme).toContain("## How Permissio is different");
    expect(readme).toContain("static analysis");
    expect(readme).toContain("does not call the GitHub API by default");

    for (const filePath of [
      "LAUNCH.md",
      "docs/share-copy.md",
      "docs/repo-topics.md",
      "docs/good-first-issues.md",
      "docs/release-checklist.md"
    ]) {
      expect(existsSync(path.join(process.cwd(), filePath)), `${filePath} exists`).toBe(true);
    }
  });

  it("shows permission score in table, markdown, json, and html output", async () => {
    const table = await run(["demo"]);
    expect(table.output).toContain("Permission score");

    const markdown = await run(["demo", "--format", "markdown"]);
    expect(markdown.output).toContain("**Permission score:**");

    const json = await run(["demo", "--format", "json"]);
    expect(JSON.parse(json.output).score.value).toEqual(expect.any(Number));

    const html = await run(["demo", "--format", "html"]);
    expect(html.output).toContain("Permission score");
  });

  it("keeps npm package identity and install docs aligned", async () => {
    const packageJson = JSON.parse(await readFile(path.join(process.cwd(), "package.json"), "utf8"));
    const readme = await readFile(path.join(process.cwd(), "README.md"), "utf8");
    const publishCheck = await readFile(path.join(process.cwd(), "docs/npm-publish-check.md"), "utf8");
    const releaseNotes = await readFile(path.join(process.cwd(), "docs/release-v0.2.2.md"), "utf8");

    expect(packageJson.name).toBe("@idogee/permissio");
    expect(packageJson.version).toBe("0.2.2");
    expect(packageJson.description).toBe("GitHub Actions permission minimizer for least privilege GITHUB_TOKEN settings.");
    expect(packageJson.private).toBe(false);
    expect(packageJson.repository).toMatchObject({
      type: "git",
      url: "https://github.com/iDogRoag/permissio"
    });
    expect(packageJson.bugs).toMatchObject({ url: "https://github.com/iDogRoag/permissio/issues" });
    expect(packageJson.homepage).toBe("https://github.com/iDogRoag/permissio#readme");
    expect(packageJson.publishConfig).toMatchObject({
      access: "public",
      registry: "https://registry.npmjs.org"
    });
    expect(packageJson.bin).toMatchObject({ permissio: "dist/cli.js" });
    expect(readme).toContain("npx @idogee/permissio check .");
    expect(readme).toContain("npx @idogee/permissio demo");
    expect(readme).toContain("npm install --save-dev @idogee/permissio");
    expect(readme).toContain(
      "npx @idogee/permissio check . --ci --format markdown --output permissio-report.md --fail-on high"
    );
    expect(readme).not.toContain(["@idogroag", "permissio"].join("/"));
    expect(publishCheck).toContain("npm publish --access public");
    expect(publishCheck).toContain("npx @idogee/permissio@latest demo");
    expect(releaseNotes).toContain("v0.2.2");
    expect(releaseNotes).toContain("@idogee/permissio");
  });
});

async function run(argv: string[]): Promise<{ code: number; output: string }> {
  const output: string[] = [];
  const code = await runCli(argv, {
    cwd: process.cwd(),
    writeOut: (value) => output.push(value),
    writeErr: (value) => output.push(value)
  });

  return { code, output: output.join("") };
}
