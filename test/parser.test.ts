import { describe, expect, it } from "vitest";
import { parseWorkflowSource } from "../src/parser.js";

describe("parser", () => {
  it("extracts workflow jobs and steps", () => {
    const parsed = parseWorkflowSource(
      "/repo/.github/workflows/ci.yml",
      `name: CI
on:
  push:
permissions:
  contents: read
jobs:
  test:
    name: Test
    permissions:
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - run: npm test
`
    );

    expect(parsed.findings).toEqual([]);
    expect(parsed.workflow?.name).toBe("CI");
    expect(parsed.workflow?.permissions.kind).toBe("map");
    expect(parsed.workflow?.jobs).toHaveLength(1);
    expect(parsed.workflow?.jobs[0]?.id).toBe("test");
    expect(parsed.workflow?.jobs[0]?.steps[0]?.uses).toBe("actions/checkout@v4");
  });

  it("returns a finding for invalid YAML instead of throwing", () => {
    const parsed = parseWorkflowSource("/repo/.github/workflows/bad.yml", "name: Bad\non: [push\n");

    expect(parsed.workflow).toBeUndefined();
    expect(parsed.findings).toHaveLength(1);
    expect(parsed.findings[0]?.id).toBe("parse.invalid-yaml");
  });
});
