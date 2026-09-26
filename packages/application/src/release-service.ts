import type {
  LessonLearned,
  ReleaseRecord
} from "@blueprint-os/contracts";
import { validateContract } from "@blueprint-os/contracts";
import {
  AuthorityService,
  type AuthenticatedActor,
  type ReleaseRepository,
  type WorkQualityRepository
} from "@blueprint-os/core";

function assertValid(
  name: "ReleaseRecord" | "LessonLearned",
  value: unknown
): void {
  const result = validateContract(name, value);
  if (!result.valid) {
    const details = result.errors
      .map((error) => `${error.instancePath || "/"}: ${error.message}`)
      .join("; ");
    throw new TypeError(`Invalid ${name}: ${details}`);
  }
}

function sameStrings(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

export class ReleaseLessonsApplicationService {
  constructor(
    private readonly repository: ReleaseRepository,
    private readonly workQuality: WorkQualityRepository,
    private readonly authority: AuthorityService
  ) {}

  async listReleases(
    actor: AuthenticatedActor | null,
    projectId: string
  ): Promise<readonly ReleaseRecord[]> {
    await this.authority.require(actor, projectId, "PROJECT_READ");
    return this.repository.listReleasesByProject(projectId);
  }

  async listLessons(
    actor: AuthenticatedActor | null,
    projectId: string
  ): Promise<readonly LessonLearned[]> {
    await this.authority.require(actor, projectId, "PROJECT_READ");
    return this.repository.listLessonsByProject(projectId);
  }

  async createRelease(
    actor: AuthenticatedActor | null,
    value: ReleaseRecord
  ): Promise<ReleaseRecord> {
    await this.authority.require(actor, value.projectId, "PROJECT_REVIEW");
    assertValid("ReleaseRecord", value);

    if (value.meta.recordVersion !== 1) {
      throw new TypeError("A new ReleaseRecord must start at recordVersion 1");
    }

    await this.assertReleaseEvidence(value);
    this.assertReleaseLifecycle(value);

    return this.repository.createRelease(value);
  }

  async updateRelease(
    actor: AuthenticatedActor | null,
    value: ReleaseRecord,
    expectedRecordVersion: number
  ): Promise<ReleaseRecord> {
    await this.authority.require(actor, value.projectId, "PROJECT_REVIEW");
    assertValid("ReleaseRecord", value);

    const current = await this.repository.findReleaseById(value.id);
    if (!current || current.projectId !== value.projectId) {
      throw new TypeError(`Unknown ReleaseRecord ${value.id}`);
    }

    if (
      current.status === "released" ||
      current.status === "rolled-back" ||
      current.status === "superseded"
    ) {
      const exactIdentityChanged =
        current.version !== value.version ||
        current.revision !== value.revision ||
        current.environment !== value.environment ||
        current.artifactSource !== value.artifactSource ||
        current.releasedAt !== value.releasedAt ||
        current.rollbackPlan !== value.rollbackPlan ||
        !sameStrings(current.gateEvidenceIds, value.gateEvidenceIds);

      if (exactIdentityChanged) {
        throw new TypeError(
          "Released artifact identity/evidence is immutable; create a new ReleaseRecord for another artifact or revision"
        );
      }
    }

    await this.assertReleaseEvidence(value);
    this.assertReleaseLifecycle(value);

    return this.repository.updateRelease(value, expectedRecordVersion);
  }

  async createLesson(
    actor: AuthenticatedActor | null,
    value: LessonLearned
  ): Promise<LessonLearned> {
    await this.authority.require(actor, value.projectId, "PROJECT_MUTATE");
    assertValid("LessonLearned", value);

    if (value.meta.recordVersion !== 1) {
      throw new TypeError("A new LessonLearned must start at recordVersion 1");
    }

    await this.assertLessonLinks(value);
    return this.repository.createLesson(value);
  }

  async updateLesson(
    actor: AuthenticatedActor | null,
    value: LessonLearned,
    expectedRecordVersion: number
  ): Promise<LessonLearned> {
    await this.authority.require(actor, value.projectId, "PROJECT_MUTATE");
    assertValid("LessonLearned", value);

    const current = await this.repository.findLessonById(value.id);
    if (!current || current.projectId !== value.projectId) {
      throw new TypeError(`Unknown LessonLearned ${value.id}`);
    }

    await this.assertLessonLinks(value);
    return this.repository.updateLesson(value, expectedRecordVersion);
  }

  private assertReleaseLifecycle(value: ReleaseRecord): void {
    if (
      (value.status === "released" || value.status === "rolled-back") &&
      !value.releasedAt
    ) {
      throw new TypeError(
        `ReleaseRecord in ${value.status} status requires releasedAt`
      );
    }

    if (value.status === "rolled-back" && !value.rollbackRevision?.trim()) {
      throw new TypeError(
        "Rolled-back ReleaseRecord requires rollbackRevision"
      );
    }
  }

  private async assertReleaseEvidence(value: ReleaseRecord): Promise<void> {
    if (
      value.status !== "released" &&
      value.status !== "rolled-back" &&
      value.status !== "superseded"
    ) {
      return;
    }

    if (value.gateEvidenceIds.length === 0) {
      throw new TypeError(
        "A released artifact requires revision-specific gate evidence"
      );
    }

    for (const evidenceId of value.gateEvidenceIds) {
      const evidence = await this.workQuality.findGateEvidenceById(evidenceId);
      if (!evidence) {
        throw new TypeError(`Unknown GateEvidence ${evidenceId}`);
      }

      const gate = await this.workQuality.findQualityGateById(evidence.gateId);
      if (!gate || gate.projectId !== value.projectId) {
        throw new TypeError(
          `GateEvidence ${evidenceId} is not canonical in this project`
        );
      }

      if (evidence.revision !== value.revision) {
        throw new TypeError(
          `GateEvidence ${evidenceId} targets revision ${evidence.revision}, not release revision ${value.revision}`
        );
      }
    }
  }

  private async assertLessonLinks(value: LessonLearned): Promise<void> {
    if (value.releaseId) {
      const release = await this.repository.findReleaseById(value.releaseId);
      if (!release || release.projectId !== value.projectId) {
        throw new TypeError(
          `ReleaseRecord ${value.releaseId} is not canonical in this project`
        );
      }
    }

    if (value.linkedWorkPackageIds.length === 0) return;

    const workPackages =
      await this.workQuality.listWorkPackagesByProject(value.projectId);
    const ids = new Set(workPackages.map((item) => item.id));
    const missing = value.linkedWorkPackageIds.filter((id) => !ids.has(id));

    if (missing.length > 0) {
      throw new TypeError(
        `Linked Work Packages are not canonical in this project: ${missing.join(", ")}`
      );
    }
  }
}
