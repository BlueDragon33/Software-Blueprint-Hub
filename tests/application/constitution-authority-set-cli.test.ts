import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("Constitution authority-set CLI", () => {
  it("accepts --write without mistaking it for the manifest path", () => {
    const directory = mkdtempSync(join(tmpdir(), "constitution-authority-set-"));
    const output = join(directory, "attestation.json");

    execFileSync(
      process.execPath,
      [
        "scripts/check-constitution-authority-set.mjs",
        "--write",
        output
      ],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          GITHUB_SHA: "d".repeat(40),
          GITHUB_RUN_ID: "123456789"
        },
        stdio: "pipe"
      }
    );

    const attestation = JSON.parse(readFileSync(output, "utf8")) as {
      source: string;
      sourceRevision: string;
      ciRunId: string;
      authoritySetDigest: string;
      productionReleaseAuthority: boolean;
    };

    expect(attestation).toMatchObject({
      source: "trusted-ci-attestation",
      sourceRevision: "d".repeat(40),
      ciRunId: "123456789",
      productionReleaseAuthority: false
    });
    expect(attestation.authoritySetDigest).toMatch(/^sha256:[a-f0-9]{64}$/);
  });
});
