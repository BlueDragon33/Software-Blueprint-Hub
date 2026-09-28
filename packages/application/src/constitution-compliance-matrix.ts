import {
  centuryGradePillarDefinitions,
  constitutionalGateIds,
  type CenturyGradePillarId,
  type ConstitutionalGateAudit
} from "./constitutional-compliance";
import type {
  ConstitutionPropagationProjection,
  ConstitutionPropagationRepositoryProjection,
  GovernedBlueprintLevel
} from "./constitution-propagation";

export type EcosystemComplianceState =
  | "compliant"
  | "non-compliant"
  | "unverified"
  | "migration-required"
  | "blocked";

export interface ConstitutionComplianceAttestation {
  readonly schemaVersion: "1.0.0";
  readonly kind: "constitutional-compliance-attestation";
  readonly source: "trusted-project-compliance-attestation";
  readonly policyId: string;
  readonly policyVersion: string;
  readonly repository: string;
  readonly branch: string;
  readonly projectId: string;
  readonly blueprintLevel: GovernedBlueprintLevel;
  readonly sourceRevision: string;
  readonly workflowRunId: string;
  readonly verifiedAt: string;
  readonly state: "compliant" | "non-compliant";
  readonly pillars: readonly {
    readonly id: CenturyGradePillarId;
    readonly state: "compliant" | "non-compliant";
    readonly missingRequirementIds: readonly string[];
    readonly blockingGateIds: readonly string[];
  }[];
  readonly gates: readonly ConstitutionalGateAudit[];
  readonly blockers: readonly string[];
  readonly exactReleaseRevisionCertified: false;
  readonly productionReleaseAuthority: false;
}

export interface ConstitutionComplianceObservation {
  readonly repository: string;
  readonly branch: string;
  readonly sourceRevision: string;
  readonly observedAt: string;
  readonly discovery:
    | "standard-attestation-found"
    | "standard-attestation-not-found"
    | "repository-unavailable";
  readonly attestation: ConstitutionComplianceAttestation | null;
}

export interface ConstitutionComplianceRepositoryProjection {
  readonly repository: string;
  readonly branch: string;
  readonly projectId: string;
  readonly blueprintLevel: GovernedBlueprintLevel;
  readonly adoptedPolicyVersion: string | null;
  readonly migrationState: ConstitutionPropagationRepositoryProjection["state"];
  readonly complianceState: EcosystemComplianceState;
  readonly sourceRevision: string | null;
  readonly exactEvidenceRevisions: readonly string[];
  readonly pillarStates: readonly {
    readonly id: CenturyGradePillarId;
    readonly state: "compliant" | "non-compliant" | "unverified";
  }[];
  readonly blockingGateIds: readonly string[];
  readonly blockers: readonly string[];
  readonly lastVerifiedAt: string | null;
  readonly productionReleaseAuthority: false;
}

export interface ConstitutionComplianceMatrix {
  readonly kind: "constitutional-compliance-matrix";
  readonly policyId: string;
  readonly policyVersion: string;
  readonly totalRepositories: number;
  readonly compliantRepositories: number;
  readonly nonCompliantRepositories: number;
  readonly unverifiedRepositories: number;
  readonly migrationRequiredRepositories: number;
  readonly blockedRepositories: number;
  readonly repositories: readonly ConstitutionComplianceRepositoryProjection[];
  readonly automaticPassAllowed: false;
  readonly canonicalProjectMutationAllowed: false;
  readonly productionReleaseAuthority: false;
  readonly boundaryNote: string;
}

function unique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort());
}

function exactSha(value: string): boolean {
  return /^[a-f0-9]{40}$/.test(value);
}

function exactRunId(value: string): boolean {
  return /^\d+$/.test(value);
}

function exactIso(value: string): boolean {
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed) && new Date(parsed).toISOString() === value;
}

function expectedPillars(): readonly CenturyGradePillarId[] {
  return Object.freeze(
    centuryGradePillarDefinitions.map((pillar) => pillar.id).sort()
  );
}

function expectedGates(): readonly string[] {
  return Object.freeze([...constitutionalGateIds].sort());
}

function validateAttestation(
  attestation: ConstitutionComplianceAttestation,
  propagation: ConstitutionPropagationRepositoryProjection,
  policyId: string,
  policyVersion: string
): readonly string[] {
  const blockers: string[] = [];

  if (attestation.schemaVersion !== "1.0.0") {
    blockers.push("compliance-attestation-schema-unsupported");
  }
  if (attestation.kind !== "constitutional-compliance-attestation") {
    blockers.push("compliance-attestation-kind-invalid");
  }
  if (attestation.source !== "trusted-project-compliance-attestation") {
    blockers.push("compliance-attestation-source-untrusted");
  }
  if (attestation.policyId !== policyId) {
    blockers.push("compliance-policy-id-mismatch");
  }
  if (attestation.policyVersion !== policyVersion) {
    blockers.push("compliance-policy-version-mismatch");
  }
  if (attestation.repository !== propagation.repository) {
    blockers.push("compliance-repository-mismatch");
  }
  if (attestation.branch !== propagation.branch) {
    blockers.push("compliance-branch-mismatch");
  }
  if (attestation.projectId !== propagation.projectId) {
    blockers.push("compliance-project-id-mismatch");
  }
  if (attestation.blueprintLevel !== propagation.blueprintLevel) {
    blockers.push("compliance-blueprint-level-mismatch");
  }
  if (
    !exactSha(attestation.sourceRevision) ||
    attestation.sourceRevision !== propagation.sourceRevision
  ) {
    blockers.push("compliance-source-revision-mismatch");
  }
  if (!exactRunId(attestation.workflowRunId)) {
    blockers.push("compliance-workflow-run-invalid");
  }
  if (!exactIso(attestation.verifiedAt)) {
    blockers.push("compliance-verified-at-invalid");
  }
  if (attestation.productionReleaseAuthority !== false) {
    blockers.push("compliance-production-authority-invalid");
  }
  if (attestation.exactReleaseRevisionCertified !== false) {
    blockers.push("compliance-release-certification-invalid");
  }

  const expectedPillarIds = expectedPillars();
  const pillarIds = attestation.pillars.map((pillar) => pillar.id).sort();
  if (
    pillarIds.length !== expectedPillarIds.length ||
    pillarIds.some((id, index) => id !== expectedPillarIds[index])
  ) {
    blockers.push("compliance-pillar-set-incomplete");
  }

  const expectedGateIds = expectedGates();
  const gateIds = attestation.gates.map((gate) => gate.id).sort();
  if (
    gateIds.length !== expectedGateIds.length ||
    gateIds.some((id, index) => id !== expectedGateIds[index])
  ) {
    blockers.push("compliance-gate-set-incomplete");
  }

  const gateById = new Map(attestation.gates.map((gate) => [gate.id, gate]));
  for (const gate of attestation.gates) {
    if (gate.state === "pass") {
      if (
        gate.status !== "pass" ||
        gate.evidenceIds.length === 0 ||
        gate.evidenceRevisions.length === 0
      ) {
        blockers.push(`compliance-gate-pass-without-evidence:${gate.id}`);
      }
    }
  }

  for (const definition of centuryGradePillarDefinitions) {
    const pillar = attestation.pillars.find((item) => item.id === definition.id);
    if (!pillar) continue;

    const missing = new Set(pillar.missingRequirementIds);
    const blocking = new Set(pillar.blockingGateIds);
    for (const requirementId of definition.requirementIds) {
      if (requirementId.startsWith("gate:")) {
        const gate = gateById.get(requirementId);
        if (
          pillar.state === "compliant" &&
          (!gate || gate.state !== "pass" || blocking.has(requirementId))
        ) {
          blockers.push(
            `compliance-pillar-claims-pass-with-blocking-gate:${pillar.id}:${requirementId}`
          );
        }
      }
      if (pillar.state === "compliant" && missing.has(requirementId)) {
        blockers.push(
          `compliance-pillar-claims-pass-with-missing-requirement:${pillar.id}:${requirementId}`
        );
      }
    }
  }

  const calculatedCompliant =
    attestation.blockers.length === 0 &&
    attestation.pillars.every((pillar) => pillar.state === "compliant") &&
    attestation.gates.every((gate) => gate.state === "pass");

  if (
    (attestation.state === "compliant" && !calculatedCompliant) ||
    (attestation.state === "non-compliant" && calculatedCompliant)
  ) {
    blockers.push("compliance-attestation-state-contradiction");
  }

  return unique(blockers);
}

function unverifiedPillars() {
  return Object.freeze(
    centuryGradePillarDefinitions.map((pillar) =>
      Object.freeze({
        id: pillar.id,
        state: "unverified" as const
      })
    )
  );
}

export function buildConstitutionComplianceMatrix(input: {
  readonly propagation: ConstitutionPropagationProjection;
  readonly observations: readonly ConstitutionComplianceObservation[];
}): ConstitutionComplianceMatrix {
  const observationByRepository = new Map<string, ConstitutionComplianceObservation>();
  for (const observation of input.observations) {
    if (observationByRepository.has(observation.repository)) {
      throw new TypeError(
        `Duplicate Constitution compliance observation ${observation.repository}`
      );
    }
    observationByRepository.set(observation.repository, observation);
  }

  const repositories = Object.freeze(
    input.propagation.repositories.map(
      (propagation): ConstitutionComplianceRepositoryProjection => {
        if (propagation.state === "migration-required") {
          return Object.freeze({
            repository: propagation.repository,
            branch: propagation.branch,
            projectId: propagation.projectId,
            blueprintLevel: propagation.blueprintLevel,
            adoptedPolicyVersion: propagation.observedPolicyVersion,
            migrationState: propagation.state,
            complianceState: "migration-required",
            sourceRevision: propagation.sourceRevision,
            exactEvidenceRevisions: Object.freeze([]),
            pillarStates: unverifiedPillars(),
            blockingGateIds: Object.freeze([...constitutionalGateIds]),
            blockers: Object.freeze(["constitutional-migration-required"]),
            lastVerifiedAt: null,
            productionReleaseAuthority: false
          });
        }

        if (propagation.state !== "current") {
          return Object.freeze({
            repository: propagation.repository,
            branch: propagation.branch,
            projectId: propagation.projectId,
            blueprintLevel: propagation.blueprintLevel,
            adoptedPolicyVersion: propagation.observedPolicyVersion,
            migrationState: propagation.state,
            complianceState: "blocked",
            sourceRevision: propagation.sourceRevision,
            exactEvidenceRevisions: Object.freeze([]),
            pillarStates: unverifiedPillars(),
            blockingGateIds: Object.freeze([...constitutionalGateIds]),
            blockers: unique([
              "constitutional-adoption-not-current",
              ...propagation.blockers
            ]),
            lastVerifiedAt: null,
            productionReleaseAuthority: false
          });
        }

        const observation = observationByRepository.get(propagation.repository);
        if (
          !observation ||
          observation.discovery !== "standard-attestation-found" ||
          !observation.attestation
        ) {
          const observationBlockers = observation
            ? observation.discovery === "repository-unavailable"
              ? ["compliance-repository-unavailable"]
              : ["compliance-attestation-not-found"]
            : ["compliance-observation-missing"];

          return Object.freeze({
            repository: propagation.repository,
            branch: propagation.branch,
            projectId: propagation.projectId,
            blueprintLevel: propagation.blueprintLevel,
            adoptedPolicyVersion: propagation.observedPolicyVersion,
            migrationState: propagation.state,
            complianceState: "unverified",
            sourceRevision: propagation.sourceRevision,
            exactEvidenceRevisions: Object.freeze([]),
            pillarStates: unverifiedPillars(),
            blockingGateIds: Object.freeze([...constitutionalGateIds]),
            blockers: Object.freeze(observationBlockers),
            lastVerifiedAt: observation?.observedAt ?? null,
            productionReleaseAuthority: false
          });
        }

        const observationBlockers: string[] = [];
        if (
          observation.branch !== propagation.branch ||
          observation.sourceRevision !== propagation.sourceRevision
        ) {
          observationBlockers.push("compliance-observation-provenance-mismatch");
        }
        if (!exactIso(observation.observedAt)) {
          observationBlockers.push("compliance-observed-at-invalid");
        }

        const attestationBlockers = validateAttestation(
          observation.attestation,
          propagation,
          input.propagation.policyId,
          input.propagation.activePolicyVersion
        );
        const validationBlockers = unique([
          ...observationBlockers,
          ...attestationBlockers
        ]);

        if (validationBlockers.length > 0) {
          return Object.freeze({
            repository: propagation.repository,
            branch: propagation.branch,
            projectId: propagation.projectId,
            blueprintLevel: propagation.blueprintLevel,
            adoptedPolicyVersion: propagation.observedPolicyVersion,
            migrationState: propagation.state,
            complianceState: "blocked",
            sourceRevision: propagation.sourceRevision,
            exactEvidenceRevisions: Object.freeze([]),
            pillarStates: unverifiedPillars(),
            blockingGateIds: Object.freeze([...constitutionalGateIds]),
            blockers: validationBlockers,
            lastVerifiedAt: observation.observedAt,
            productionReleaseAuthority: false
          });
        }

        const attestation = observation.attestation;
        const evidenceRevisions = unique(
          attestation.gates.flatMap((gate) => gate.evidenceRevisions)
        );
        const blockingGateIds = Object.freeze(
          attestation.gates
            .filter((gate) => gate.state !== "pass")
            .map((gate) => gate.id)
            .sort()
        );

        return Object.freeze({
          repository: propagation.repository,
          branch: propagation.branch,
          projectId: propagation.projectId,
          blueprintLevel: propagation.blueprintLevel,
          adoptedPolicyVersion: propagation.observedPolicyVersion,
          migrationState: propagation.state,
          complianceState: attestation.state,
          sourceRevision: propagation.sourceRevision,
          exactEvidenceRevisions: evidenceRevisions,
          pillarStates: Object.freeze(
            attestation.pillars.map((pillar) =>
              Object.freeze({ id: pillar.id, state: pillar.state })
            )
          ),
          blockingGateIds,
          blockers: Object.freeze([...attestation.blockers]),
          lastVerifiedAt: attestation.verifiedAt,
          productionReleaseAuthority: false
        });
      }
    )
  );

  const count = (state: EcosystemComplianceState) =>
    repositories.filter((repository) => repository.complianceState === state).length;

  return Object.freeze({
    kind: "constitutional-compliance-matrix",
    policyId: input.propagation.policyId,
    policyVersion: input.propagation.activePolicyVersion,
    totalRepositories: repositories.length,
    compliantRepositories: count("compliant"),
    nonCompliantRepositories: count("non-compliant"),
    unverifiedRepositories: count("unverified"),
    migrationRequiredRepositories: count("migration-required"),
    blockedRepositories: count("blocked"),
    repositories,
    automaticPassAllowed: false,
    canonicalProjectMutationAllowed: false,
    productionReleaseAuthority: false,
    boundaryNote:
      "Constitution adoption is not Constitution compliance. A repository is COMPLIANT only from a trusted project attestation bound to the current policy and exact source revision with all six pillars and all Universal gates evidence-backed. Missing evidence remains UNVERIFIED; this matrix cannot mutate project gates or authorize Production."
  });
}
