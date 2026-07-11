import path from "node:path";
import { describe, expect, it } from "vitest";
import { scanPath } from "../src/index.js";
import type { JobResult } from "../src/types.js";

const fixtures = path.join(process.cwd(), "test/fixtures");

describe("permission inference", () => {
  it("recommends contents read for checkout and permissions empty for no token use", async () => {
    const report = await scanPath(fixtures, { include: ["basic.yml"] });
    const testJob = job(report.workflows[0]?.jobs, "test");
    const noopJob = job(report.workflows[0]?.jobs, "noop");

    expect(testJob.recommended.permissions).toEqual({ contents: "read" });
    expect(noopJob.recommended.permissions).toEqual({});
    expect(noopJob.snippet).toContain("permissions: {}");
  });

  it("recommends contents write for release publishing", async () => {
    const report = await scanPath(fixtures, { include: ["releases.yml"] });
    const release = job(report.workflows[0]?.jobs, "release");

    expect(release.recommended.permissions.contents).toBe("write");
  });

  it("recommends pages write and id-token write for Pages deployment", async () => {
    const report = await scanPath(fixtures, { include: ["pages.yml"] });
    const deploy = job(report.workflows[0]?.jobs, "deploy");
    const build = job(report.workflows[0]?.jobs, "build");

    expect(deploy.recommended.permissions.pages).toBe("write");
    expect(deploy.recommended.permissions["id-token"]).toBe("write");
    expect(build.recommended.permissions.contents).toBe("read");
    expect(build.recommended.permissions.pages).toBeUndefined();
  });

  it("recommends attestations write, artifact-metadata write, id-token write, and contents read for attestations", async () => {
    const report = await scanPath(fixtures, { include: ["attestations.yml"] });
    const attest = job(report.workflows[0]?.jobs, "attest");

    expect(attest.recommended.permissions.attestations).toBe("write");
    expect(attest.recommended.permissions["artifact-metadata"]).toBe("write");
    expect(attest.recommended.permissions["id-token"]).toBe("write");
    expect(attest.recommended.permissions.contents).toBe("read");
  });

  it("recommends packages write and contents read for ghcr publishing", async () => {
    const report = await scanPath(fixtures, { include: ["packages.yml"] });
    const ghcr = job(report.workflows[0]?.jobs, "ghcr");

    expect(ghcr.recommended.permissions.packages).toBe("write");
    expect(ghcr.recommended.permissions.contents).toBe("read");
  });

  it("flags pull_request_target with write-all as high severity", async () => {
    const report = await scanPath(fixtures, { include: ["risky.yml"] });
    const workflowWriteAll = report.findings.find((finding) => finding.id === "permissions.workflow-write-all");
    const unsafeCheckout = report.findings.find(
      (finding) => finding.id === "pull-request-target.checkout-head-with-write"
    );

    expect(report.summary.high).toBeGreaterThan(0);
    expect(workflowWriteAll?.location).toEqual({ startLine: 6, startColumn: 1 });
    expect(unsafeCheckout?.location).toEqual({ startLine: 12, startColumn: 9 });
    expect(report.findings.some((finding) => finding.id === "permissions.extra-write-scopes")).toBe(false);
    expect(
      report.findings.some(
        (finding) => finding.id === "permissions.id-token-write-unneeded" && finding.jobId === "inspect"
      )
    ).toBe(false);
  });

  it("flags implicit pull_request_target permissions as write-risk", async () => {
    const report = await scanPath(fixtures, { include: ["pull-request-target-implicit.yml"] });

    expect(report.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "permissions.missing-explicit",
          category: "permissions",
          severity: "high",
          location: { startLine: 7, startColumn: 3 }
        }),
        expect.objectContaining({
          id: "pull-request-target.write-permissions",
          category: "pull-request-target",
          severity: "high",
          evidence: "implicit pull_request_target default"
        }),
        expect.objectContaining({
          id: "pull-request-target.checkout-head-with-write",
          category: "pull-request-target",
          severity: "high"
        })
      ])
    );
  });

  it("flags id-token write without OIDC or attestation use", async () => {
    const report = await scanPath(fixtures, { include: ["unneeded-id-token.yml"] });

    expect(report.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "permissions.id-token-write-unneeded",
          location: { startLine: 10, startColumn: 7 }
        })
      ])
    );
    expect(report.findings.some((finding) => finding.id === "permissions.extra-write-scopes")).toBe(false);
  });

  it("keeps invalid YAML as a finding without crashing the scan", async () => {
    const report = await scanPath(fixtures, { include: ["invalid.yml"] });

    expect(report.summary.filesScanned).toBe(1);
    expect(report.summary.workflowsScanned).toBe(0);
    expect(report.findings[0]?.id).toBe("parse.invalid-yaml");
    expect(report.findings[0]?.category).toBe("parse");
    expect(report.score.status).toBe("incomplete");
  });
});

function job(jobs: JobResult[] | undefined, id: string): JobResult {
  const found = jobs?.find((candidate) => candidate.jobId === id);
  if (!found) {
    throw new Error(`Missing job ${id}`);
  }
  return found;
}
