import { describe, expect, it } from "vitest";

import {
  findReferenceImportManifest,
  listReferenceImportManifests
} from "../../packages/application/src";

describe("Reference Import registry", () => {
  it("loads the Bauman snapshot from a local validated manifest", () => {
    const manifest = findReferenceImportManifest("bauman-nextgen-v1");

    expect(manifest).not.toBeNull();
    expect(manifest).toMatchObject({
      id: "reference-import:bauman-nextgen:v1",
      referenceCaseId: "knowledge:reference-case:bauman-nextgen-v1",
      source: {
        repository: "BlueDragon33/Bauman-master-ai-system",
        revision: "52b2a581a9c38a7060e95209e94c3087764f6d5f"
      },
      authority: {
        canonicalProjectState: false,
        qualityGateEvidence: false,
        releaseAuthority: false,
        accessAuthority: false
      },
      driftPolicy: {
        snapshotMode: "frozen",
        networkRequiredForCanonicalRead: false,
        updateMode: "new-observation",
        currentnessClaimRequiresSourceCheck: true
      }
    });
    expect(manifest?.sourceArtifacts).toHaveLength(24);
  });

  it("does not synthesize unknown Reference Imports", () => {
    expect(findReferenceImportManifest("missing-v1")).toBeNull();
    expect(listReferenceImportManifests()).toHaveLength(1);
  });
});
