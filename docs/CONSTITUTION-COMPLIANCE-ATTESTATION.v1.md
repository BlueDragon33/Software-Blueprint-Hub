# Constitution Compliance Attestation Protocol v1

## Purpose

CA-006 distinguishes Constitution adoption from Constitution compliance. A repository may adopt the active Universal Constitution while remaining UNVERIFIED or NON-COMPLIANT until exact evidence proves every required Universal pillar and gate.

## Trust model

A standard attestation is a projection of project-local canonical quality state. It is not itself Quality Gate authority, Project authority, Constitutional authority, or Production authority.

Required identity:
- schemaVersion = 1.0.0
- kind = constitutional-compliance-attestation
- source = trusted-project-compliance-attestation
- exact repository, branch, projectId and Blueprint Level
- exact 40-character source revision
- active policy ID and policy version
- numeric trusted workflow run ID
- exact ISO verifiedAt timestamp
- productionReleaseAuthority = false
- exactReleaseRevisionCertified = false

Required proof surface:
- all six Century-Grade pillars appear exactly once;
- all Universal constitutional gates appear exactly once;
- a PASS gate has canonical evidence IDs and evidence revisions;
- a compliant pillar cannot declare missing requirements or a blocking constitutional gate;
- COMPLIANT is valid only when all pillars are compliant, all Universal gates PASS, and blockers are empty.

## Fail-closed states

- missing standard attestation => UNVERIFIED;
- stale Constitution adoption => MIGRATION REQUIRED;
- malformed, contradictory or stale attestation => BLOCKED;
- valid attestation with project blockers => NON-COMPLIANT;
- only a valid current attestation with complete evidence => COMPLIANT.

## Authority boundary

The global matrix is read-only. It may identify gaps and produce migration/remediation work, but it cannot mutate project gates, fabricate evidence, authorize release, or infer Production readiness.
