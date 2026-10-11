import { CONSTITUTION_POLICY_VERSION } from "../../packages/application/src";

const [policyMajor, policyMinor] = CONSTITUTION_POLICY_VERSION.split(".").map(Number);
const TARGET_VERSION = `${policyMajor}.${policyMinor + 1}.0`;
import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  ConstitutionAuthorityApplicationService,
  validateConstitutionAuthoritySetAttestation,
  validateConstitutionPropagationAttestation,
  validateConstitutionVerificationAttestation,
  type ConstitutionLifecycleAttestationVerifier,
  type ConstitutionPropagationAttestation,
  type ConstitutionPublicationAttestationVerifier,
  type ConstitutionVerificationAttestation
} from "../../packages/application/src";
import {
  AuthorityService,
  ConstitutionalAuthorityDeniedError,
  type AuthorityRepository,
  type CanonicalConstitutionAmendmentRecord,
  type ConstitutionAuthorityRepository,
  type ConstitutionAuthoritySetAttestation,
  type ConstitutionEvidenceRecord,
  type ConstitutionPublicationRecord,
  type ConstitutionRatificationDecisionRecord,
  type PrincipalRecord,
  type ProjectRole,
  type ProjectRoleAssignment
} from "../../packages/core/src";

class FakeAuthorityRepository implements AuthorityRepository {
  readonly revoked = new Set<string>();
  async resolvePrincipal(): Promise<PrincipalRecord> {
    throw new Error("not used");
  }
  async bootstrapOwner(): Promise<PrincipalRecord> {
    throw new Error("not used");
  }
  async isSystemOwner(principalId: string): Promise<boolean> {
    return ["principal:owner", "principal:successor"].includes(principalId) && !this.revoked.has(principalId);
  }
  async findProjectRole(): Promise<ProjectRole | null> {
    return null;
  }
  async listProjectRolesForPrincipal(): Promise<readonly ProjectRoleAssignment[]> {
    return [];
  }
  async setProjectRole(): Promise<ProjectRoleAssignment> {
    throw new Error("not used");
  }
}

class FakeConstitutionRepository implements ConstitutionAuthorityRepository {
  record: CanonicalConstitutionAmendmentRecord | null = null;
  evidence: ConstitutionEvidenceRecord[] = [];
  decisions: ConstitutionRatificationDecisionRecord[] = [];
  publication: ConstitutionPublicationRecord | null = null;

  async createAmendment(
    record: CanonicalConstitutionAmendmentRecord
  ): Promise<CanonicalConstitutionAmendmentRecord> {
    this.record = record;
    return record;
  }

  async findAmendmentById(
    amendmentId: string
  ): Promise<CanonicalConstitutionAmendmentRecord | null> {
    return this.record?.proposal.id === amendmentId ? this.record : null;
  }

  async listAmendments(): Promise<readonly CanonicalConstitutionAmendmentRecord[]> {
    return this.record ? [this.record] : [];
  }

  async updateAmendment(
    record: CanonicalConstitutionAmendmentRecord
  ): Promise<CanonicalConstitutionAmendmentRecord> {
    this.record = record;
    return record;
  }

  async appendEvidenceAndUpdate(
    evidence: ConstitutionEvidenceRecord,
    record: CanonicalConstitutionAmendmentRecord
  ): Promise<CanonicalConstitutionAmendmentRecord> {
    this.evidence.push(evidence);
    this.record = record;
    return record;
  }

  async listEvidence(
    amendmentId: string
  ): Promise<readonly ConstitutionEvidenceRecord[]> {
    return this.evidence.filter((item) => item.amendmentId === amendmentId);
  }

  async appendRatificationDecisionAndUpdate(
    decision: ConstitutionRatificationDecisionRecord,
    record: CanonicalConstitutionAmendmentRecord
  ): Promise<CanonicalConstitutionAmendmentRecord> {
    this.decisions.push(decision);
    this.record = record;
    return record;
  }

  async findRatificationDecision(
    amendmentId: string,
    amendmentRecordVersion: number
  ): Promise<ConstitutionRatificationDecisionRecord | null> {
    return (
      this.decisions.find(
        (item) =>
          item.amendmentId === amendmentId &&
          item.amendmentRecordVersion === amendmentRecordVersion
      ) ?? null
    );
  }

  async findRatificationDecisionById(
    decisionId: string
  ): Promise<ConstitutionRatificationDecisionRecord | null> {
    return this.decisions.find((item) => item.id === decisionId) ?? null;
  }


  async appendPublicationAndUpdate(
    publication: ConstitutionPublicationRecord,
    evidence: ConstitutionEvidenceRecord,
    record: CanonicalConstitutionAmendmentRecord
  ): Promise<CanonicalConstitutionAmendmentRecord> {
    this.publication = publication;
    this.evidence.push(evidence);
    this.record = record;
    return record;
  }

  async findPublicationByAmendmentId(
    amendmentId: string
  ): Promise<ConstitutionPublicationRecord | null> {
    return this.publication?.amendmentId === amendmentId
      ? this.publication
      : null;
  }
}

const owner = { principalId: "principal:owner" };
const intruder = { principalId: "principal:intruder" };
const now = "2026-09-28T01:00:00.000Z";
const digest = "sha256:" + "a".repeat(64);

function draftInput() {
  return {
    targetPolicyVersion: TARGET_VERSION,
    title: "Strengthen long-term durability",
    problem: "Ageing evidence needs a stronger universal definition.",
    rationale: "Prevent build success from being treated as durability proof.",
    affectedPillarIds: ["long-term-durability"],
    affectedRequirementIds: ["gate:durability:ageing-regression"],
    compatibilityRisk: "medium" as const,
    migrationRequired: true
  };
}

function service(
  publicationAttestationVerifier?: ConstitutionPublicationAttestationVerifier,
  lifecycleAttestationVerifier?: ConstitutionLifecycleAttestationVerifier
) {
  const repository = new FakeConstitutionRepository();
  const authorityRepository = new FakeAuthorityRepository();
  const authority = new AuthorityService(authorityRepository);
  return {
    repository,
    authorityRepository,
    service: new ConstitutionAuthorityApplicationService(
      repository,
      authority,
      publicationAttestationVerifier,
      lifecycleAttestationVerifier
    )
  };
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, stable(child)])
    );
  }
  return value;
}

function sha(value: string): string {
  return "sha256:" + createHash("sha256").update(value).digest("hex");
}

function authoritySetAttestation(
  policyVersion = TARGET_VERSION
): ConstitutionAuthoritySetAttestation {
  const components = [
    {
      id: "normative-document" as const,
      path: "docs/UNIVERSAL-CONSTITUTION.md",
      version: policyVersion,
      digest: sha("normative")
    },
    {
      id: "machine-contract" as const,
      path: "control/universal-constitution.contract.json",
      version: policyVersion,
      digest: sha("contract")
    },
    {
      id: "universal-template" as const,
      path: "packages/application/src/foundation-templates.ts",
      version: policyVersion,
      digest: sha("template")
    },
    {
      id: "policy-version" as const,
      path: "packages/application/src/constitution-authority.ts",
      version: policyVersion,
      digest: sha("policy")
    }
  ].sort((a, b) => a.id.localeCompare(b.id));

  const authoritySetDigest = sha(
    JSON.stringify(
      stable({
        policyId: "blueprint-os:universal-century-grade",
        policyVersion,
        components
      })
    )
  );

  return {
    schemaVersion: "1.0.0",
    source: "trusted-ci-attestation",
    policyId: "blueprint-os:universal-century-grade",
    policyVersion,
    sourceRevision: "a".repeat(40),
    ciRunId: "36365074322",
    components,
    authoritySetDigest,
    productionReleaseAuthority: false
  };
}

function lifecycleVerifier(): ConstitutionLifecycleAttestationVerifier {
  return {
    id: "test:trusted-lifecycle-verifier",
    verifyPropagation: async () => true,
    verifyVerification: async () => true
  };
}

function propagationAttestation(
  amendmentId: string,
  publicationId: string
): ConstitutionPropagationAttestation {
  return {
    schemaVersion: "1.0.0",
    kind: "constitution-propagation-attestation",
    source: "trusted-constitution-lifecycle-attestation",
    policyId: "blueprint-os:universal-century-grade",
    policyVersion: TARGET_VERSION,
    amendmentId,
    publicationId,
    sourceRevision: "d".repeat(40),
    workflowRunId: "36390000001",
    snapshotDigest: sha("propagation-snapshot"),
    totalRepositories: 2,
    currentRepositories: 1,
    migrationRequiredRepositories: 1,
    blockedRepositories: 0,
    exactReleaseRevisionCertified: false,
    productionReleaseAuthority: false
  };
}

function verificationAttestation(
  amendmentId: string,
  publicationId: string
): ConstitutionVerificationAttestation {
  return {
    schemaVersion: "1.0.0",
    kind: "constitution-verification-attestation",
    source: "trusted-constitution-lifecycle-attestation",
    policyId: "blueprint-os:universal-century-grade",
    policyVersion: TARGET_VERSION,
    amendmentId,
    publicationId,
    sourceRevision: "e".repeat(40),
    workflowRunId: "36390000002",
    matrixDigest: sha("compliance-matrix"),
    totalRepositories: 2,
    compliantRepositories: 2,
    nonCompliantRepositories: 0,
    unverifiedRepositories: 0,
    migrationRequiredRepositories: 0,
    blockedRepositories: 0,
    exactReleaseRevisionCertified: false,
    productionReleaseAuthority: false
  };
}

async function ratifiedAmendment(
  app: ConstitutionAuthorityApplicationService
) {
  const draft = await app.createDraft(owner, draftInput(), now);
  await app.recordStageEvidence(
    owner,
    {
      amendmentId: draft.proposal.id,
      expectedRecordVersion: 1,
      kind: "impact",
      source: "review",
      revision: authoritySetAttestation().sourceRevision,
      digest,
      note: "Impact evidence."
    },
    "2026-09-28T01:01:00.000Z"
  );
  await app.recordStageEvidence(
    owner,
    {
      amendmentId: draft.proposal.id,
      expectedRecordVersion: 2,
      kind: "migration",
      source: "migration-plan",
      revision: authoritySetAttestation().sourceRevision,
      digest: authoritySetAttestation().authoritySetDigest,
      note: "Migration evidence."
    },
    "2026-09-28T01:02:00.000Z"
  );
  await app.openRatification(
    owner,
    draft.proposal.id,
    3,
    "2026-09-28T01:03:00.000Z"
  );
  return app.ratify(
    owner,
    {
      amendmentId: draft.proposal.id,
      expectedRecordVersion: 4,
      decision: "approve",
      note: "Human approval for exact amendment."
    },
    "2026-09-28T01:04:00.000Z"
  );
}

describe("CA-002/CA-003 Constitution Authority application service", () => {
  it("restricts global Constitutional Authority to the System Owner", async () => {
    const { service: app } = service();

    await expect(
      app.createDraft(intruder, draftInput(), now)
    ).rejects.toBeInstanceOf(ConstitutionalAuthorityDeniedError);
  });

  it("does not allow a target Constitution version to stay equal or move backwards", async () => {
    const { service: app } = service();

    await expect(
      app.createDraft(
        owner,
        { ...draftInput(), targetPolicyVersion: CONSTITUTION_POLICY_VERSION },
        now
      )
    ).rejects.toThrow(/greater than the active Constitution version/i);
  });

  it("persists the gated path through human ratification without Production authority", async () => {
    const { service: app, repository } = service();

    const draft = await app.createDraft(owner, draftInput(), now);
    expect(draft.state).toBe("draft");
    expect(draft.recordVersion).toBe(1);

    const impact = await app.recordStageEvidence(
      owner,
      {
        amendmentId: draft.proposal.id,
        expectedRecordVersion: 1,
        kind: "impact",
        source: "github-actions:impact-analysis",
        revision: authoritySetAttestation().sourceRevision,
        digest,
        note: "Impact review covers all governed repositories."
      },
      "2026-09-28T01:01:00.000Z"
    );
    expect(impact.state).toBe("impact-reviewed");
    expect(impact.recordVersion).toBe(2);
    expect(repository.evidence).toHaveLength(1);

    const migration = await app.recordStageEvidence(
      owner,
      {
        amendmentId: draft.proposal.id,
        expectedRecordVersion: 2,
        kind: "migration",
        source: "blueprint-os:migration-plan",
        revision: authoritySetAttestation().sourceRevision,
        digest: authoritySetAttestation().authoritySetDigest,
        note: "Migration waves preserve truthful non-compliance."
      },
      "2026-09-28T01:02:00.000Z"
    );
    expect(migration.state).toBe("migration-ready");
    expect(migration.recordVersion).toBe(3);

    const ready = await app.openRatification(
      owner,
      draft.proposal.id,
      3,
      "2026-09-28T01:03:00.000Z"
    );
    expect(ready.state).toBe("ratification-ready");
    expect(ready.recordVersion).toBe(4);

    const ratified = await app.ratify(
      owner,
      {
        amendmentId: draft.proposal.id,
        expectedRecordVersion: 4,
        decision: "approve",
        note: "I reviewed the exact amendment, impact evidence and migration plan."
      },
      "2026-09-28T01:04:00.000Z"
    );

    expect(ratified.state).toBe("ratified");
    expect(ratified.recordVersion).toBe(5);
    expect(ratified.productionReleaseAuthority).toBe(false);
    expect(ratified.ratificationDecisionId).toMatch(
      /^constitution-ratification:/
    );
    expect(repository.decisions).toHaveLength(1);
    expect(repository.decisions[0]).toMatchObject({
      reviewerActorId: owner.principalId,
      source: "authenticated-user-action",
      decision: "approve",
      humanRatification: true,
      productionReleaseAuthority: false
    });

    const workspace = await app.read(owner, draft.proposal.id);
    expect(workspace?.ratificationDecision?.id).toBe(
      ratified.ratificationDecisionId
    );
  });

  it("rejects malformed evidence digests and stale amendment revisions", async () => {
    const { service: app } = service();
    const draft = await app.createDraft(owner, draftInput(), now);

    await expect(
      app.recordStageEvidence(
        owner,
        {
          amendmentId: draft.proposal.id,
          expectedRecordVersion: 1,
          kind: "impact",
          source: "review",
          revision: "revision:1",
          digest: "not-a-sha",
          note: "Invalid digest must not advance the amendment."
        },
        "2026-09-28T01:01:00.000Z"
      )
    ).rejects.toThrow(/sha256/i);

    await app.recordStageEvidence(
      owner,
      {
        amendmentId: draft.proposal.id,
        expectedRecordVersion: 1,
        kind: "impact",
        source: "review",
        revision: "revision:1",
        digest,
        note: "Valid evidence."
      },
      "2026-09-28T01:01:00.000Z"
    );

    await expect(
      app.recordStageEvidence(
        owner,
        {
          amendmentId: draft.proposal.id,
          expectedRecordVersion: 1,
          kind: "impact",
          source: "review",
          revision: "revision:stale",
          digest,
          note: "Stale write."
        },
        "2026-09-28T01:02:00.000Z"
      )
    ).rejects.toThrow(/stale/i);
  });
  it("validates the atomic authority-set digest and rejects partial or drifting sets", () => {
    const valid = authoritySetAttestation();
    expect(
      validateConstitutionAuthoritySetAttestation(valid).authoritySetDigest
    ).toBe(valid.authoritySetDigest);

    expect(() =>
      validateConstitutionAuthoritySetAttestation({
        ...valid,
        components: valid.components.slice(0, 3)
      })
    ).toThrow(/exactly four/i);

    expect(() =>
      validateConstitutionAuthoritySetAttestation({
        ...valid,
        components: valid.components.map((component) =>
          component.id === "machine-contract"
            ? { ...component, version: "9.9.9" }
            : component
        )
      })
    ).toThrow(/version drift/i);

    expect(() =>
      validateConstitutionAuthoritySetAttestation({
        ...valid,
        authoritySetDigest: "sha256:" + "0".repeat(64)
      })
    ).toThrow(/does not match/i);
  });

  it("fails closed when publication infrastructure cannot verify CI provenance", async () => {
    const { service: app } = service();
    const ratified = await ratifiedAmendment(app);

    await expect(
      app.publishFromTrustedAttestation(
        owner,
        {
          amendmentId: ratified.proposal.id,
          expectedRecordVersion: ratified.recordVersion,
          attestation: authoritySetAttestation(),
          note: "Attempt without trusted infrastructure verifier."
        },
        "2026-09-28T01:05:00.000Z"
      )
    ).rejects.toThrow(/trusted attestation verifier is configured/i);
  });

  it("publishes atomically only after human ratification and trusted CI verification", async () => {
    const verifier: ConstitutionPublicationAttestationVerifier = {
      id: "test:trusted-ci-verifier",
      verify: async () => true
    };
    const { service: app, repository } = service(verifier);
    const ratified = await ratifiedAmendment(app);

    const result = await app.publishFromTrustedAttestation(
      owner,
      {
        amendmentId: ratified.proposal.id,
        expectedRecordVersion: ratified.recordVersion,
        attestation: authoritySetAttestation(),
        note: "Publish the exact ratified authority set."
      },
      "2026-09-28T01:05:00.000Z"
    );

    expect(result.amendment.state).toBe("published");
    expect(result.amendment.recordVersion).toBe(6);
    expect(result.amendment.productionReleaseAuthority).toBe(false);
    expect(result.publication.policyVersion).toBe(TARGET_VERSION);
    expect(result.publication.authoritySetDigest).toBe(
      authoritySetAttestation().authoritySetDigest
    );
    expect(result.publication.productionReleaseAuthority).toBe(false);
    expect(repository.publication?.id).toBe(result.publication.id);
    expect(
      repository.evidence.some((item) => item.kind === "publication")
    ).toBe(true);
  });

  it.each(["revision", "digest", "decision"])(
    "rejects publication substituted after human ratification: %s",
    async (substitution) => {
      const { service: app, repository } = service({
        id: "test:trusted-ci-verifier", verify: async () => true
      });
      const ratified = await ratifiedAmendment(app);
      const original = authoritySetAttestation();
      const attestation = substitution === "revision"
        ? { ...original, sourceRevision: "b".repeat(40) }
        : substitution === "digest"
          ? authoritySetAttestation("1.3.1")
          : original;
      if (substitution === "digest") {
        // Same target version, valid recomputed aggregate, different law bytes.
        const components = original.components.map((item) =>
          item.id === "normative-document" ? { ...item, digest: sha("other law") } : item);
        Object.assign(attestation, {
          policyVersion: original.policyVersion, components,
          authoritySetDigest: sha(JSON.stringify(stable({
            policyId: original.policyId, policyVersion: original.policyVersion, components
          })))
        });
      }
      if (substitution === "decision") {
        repository.decisions[0] = {
          ...repository.decisions[0]!, amendmentId: "amendment:unrelated"
        };
      }
      await expect(app.publishFromTrustedAttestation(owner, {
        amendmentId: ratified.proposal.id,
        expectedRecordVersion: ratified.recordVersion, attestation,
        note: "Attempt substituted candidate."
      }, "2026-09-28T01:05:00.000Z")).rejects.toThrow(/ratified|candidate|approval record/i);
      expect(repository.publication).toBeNull();
      expect(repository.record?.state).toBe("ratified");
    }
  );

  it("cannot open approval with an unsealed candidate revision", async () => {
    const { service: app, repository } = service();
    const ratified = await ratifiedAmendment(app);
    repository.record = { ...ratified, state: "migration-ready", recordVersion: 3 };
    repository.evidence[1] = { ...repository.evidence[1]!, revision: "revision:unsealed" };
    await expect(app.openRatification(owner, ratified.proposal.id, 3,
      "2026-09-28T01:03:00.000Z")).rejects.toThrow(/candidate|exact.*revision/i);
    expect(repository.record.state).toBe("migration-ready");
  });


  it("validates lifecycle attestations and rejects contradictory repository counts", () => {
    const propagation = propagationAttestation(
      "amendment:test",
      "constitution-publication:test"
    );
    expect(
      validateConstitutionPropagationAttestation(propagation).snapshotDigest
    ).toBe(propagation.snapshotDigest);

    expect(() =>
      validateConstitutionPropagationAttestation({
        ...propagation,
        blockedRepositories: 1
      })
    ).toThrow(/partition all governed repositories/i);

    const verification = verificationAttestation(
      "amendment:test",
      "constitution-publication:test"
    );
    expect(
      validateConstitutionVerificationAttestation(verification).matrixDigest
    ).toBe(verification.matrixDigest);

    expect(() =>
      validateConstitutionVerificationAttestation({
        ...verification,
        productionReleaseAuthority: true as false
      })
    ).toThrow(/Production authority/i);
  });

  it("fails closed after publication when lifecycle provenance cannot be verified", async () => {
    const publicationVerifier: ConstitutionPublicationAttestationVerifier = {
      id: "test:trusted-ci-verifier",
      verify: async () => true
    };
    const { service: app } = service(publicationVerifier);
    const ratified = await ratifiedAmendment(app);
    const published = await app.publishFromTrustedAttestation(
      owner,
      {
        amendmentId: ratified.proposal.id,
        expectedRecordVersion: ratified.recordVersion,
        attestation: authoritySetAttestation(),
        note: "Publish before propagation."
      },
      "2026-09-28T01:05:00.000Z"
    );

    await expect(
      app.beginPropagationFromTrustedAttestation(
        owner,
        {
          amendmentId: published.amendment.proposal.id,
          expectedRecordVersion: published.amendment.recordVersion,
          attestation: propagationAttestation(
            published.amendment.proposal.id,
            published.publication.id
          ),
          note: "Attempt without trusted lifecycle verifier."
        },
        "2026-09-28T01:06:00.000Z"
      )
    ).rejects.toThrow(/trusted lifecycle attestation verifier is configured/i);
  });

  it("closes published -> propagating -> verified only with trusted evidence and full ecosystem compliance", async () => {
    const publicationVerifier: ConstitutionPublicationAttestationVerifier = {
      id: "test:trusted-ci-verifier",
      verify: async () => true
    };
    const { service: app, repository } = service(
      publicationVerifier,
      lifecycleVerifier()
    );
    const ratified = await ratifiedAmendment(app);
    const published = await app.publishFromTrustedAttestation(
      owner,
      {
        amendmentId: ratified.proposal.id,
        expectedRecordVersion: ratified.recordVersion,
        attestation: authoritySetAttestation(),
        note: "Publish exact ratified authority set."
      },
      "2026-09-28T01:05:00.000Z"
    );

    const propagating = await app.beginPropagationFromTrustedAttestation(
      owner,
      {
        amendmentId: published.amendment.proposal.id,
        expectedRecordVersion: published.amendment.recordVersion,
        attestation: propagationAttestation(
          published.amendment.proposal.id,
          published.publication.id
        ),
        note: "Record the exact ecosystem propagation snapshot."
      },
      "2026-09-28T01:06:00.000Z"
    );

    expect(propagating.state).toBe("propagating");
    expect(propagating.recordVersion).toBe(7);
    expect(propagating.productionReleaseAuthority).toBe(false);
    expect(
      repository.evidence.some((item) => item.kind === "propagation")
    ).toBe(true);

    const incomplete = verificationAttestation(
      propagating.proposal.id,
      published.publication.id
    );
    await expect(
      app.verifyFromTrustedAttestation(
        owner,
        {
          amendmentId: propagating.proposal.id,
          expectedRecordVersion: propagating.recordVersion,
          attestation: {
            ...incomplete,
            compliantRepositories: 1,
            unverifiedRepositories: 1
          },
          note: "Incomplete compliance must remain blocked."
        },
        "2026-09-28T01:07:00.000Z"
      )
    ).rejects.toThrow(/every governed repository/i);

    const verified = await app.verifyFromTrustedAttestation(
      owner,
      {
        amendmentId: propagating.proposal.id,
        expectedRecordVersion: propagating.recordVersion,
        attestation: verificationAttestation(
          propagating.proposal.id,
          published.publication.id
        ),
        note: "All governed repositories carry trusted compliance evidence."
      },
      "2026-09-28T01:08:00.000Z"
    );

    expect(verified.state).toBe("verified");
    expect(verified.recordVersion).toBe(8);
    expect(verified.productionReleaseAuthority).toBe(false);
    expect(
      repository.evidence.some((item) => item.kind === "verification")
    ).toBe(true);

    await expect(
      app.verifyFromTrustedAttestation(
        owner,
        {
          amendmentId: verified.proposal.id,
          expectedRecordVersion: verified.recordVersion,
          attestation: verificationAttestation(
            verified.proposal.id,
            published.publication.id
          ),
          note: "A verified amendment is immutable."
        },
        "2026-09-28T01:09:00.000Z"
      )
    ).rejects.toThrow(/propagation state/i);
  });

});

describe("publication approval revocation", () => {
  it.each([false, true])("rejects a ratifier revoked before/during provider verification (%s)", async during => {
    let revoke = () => {};
    const verifier = { id: "test:verified-provider", verify: async () => { if (during) revoke(); return true; } };
    const { service: app, repository, authorityRepository } = service(verifier);
    const record = await ratifiedAmendment(app);
    revoke = () => { authorityRepository.revoked.add("principal:owner"); };
    if (!during) revoke();
    await expect(app.publishFromTrustedAttestation({ principalId: "principal:successor" }, {
      amendmentId: record.proposal.id, expectedRecordVersion: record.recordVersion,
      attestation: authoritySetAttestation(), note: "Verified publication"
    }, now)).rejects.toThrow(/non-revoked human approval/);
    expect(repository.publication).toBeNull();
    expect(repository.record?.state).toBe("ratified");
  });
});
