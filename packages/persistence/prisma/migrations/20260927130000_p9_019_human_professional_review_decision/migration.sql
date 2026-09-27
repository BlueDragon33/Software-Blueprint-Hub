CREATE TABLE "HumanProfessionalReviewDecision" (
  "id" VARCHAR(160) NOT NULL,
  "projectId" VARCHAR(160) NOT NULL,
  "reviewerActorId" VARCHAR(160) NOT NULL,
  "source" VARCHAR(80) NOT NULL,
  "decision" VARCHAR(32) NOT NULL,
  "decidedAt" TIMESTAMPTZ(6) NOT NULL,
  "note" TEXT NOT NULL,
  "candidateReviewedRevision" VARCHAR(160) NOT NULL,
  "candidateEvidenceDigest" VARCHAR(160) NOT NULL,
  "acknowledgedFindingIds" JSONB NOT NULL,
  "humanSignoff" BOOLEAN NOT NULL,
  "p9020TransitionAllowed" BOOLEAN NOT NULL,
  "productionReleaseAuthority" BOOLEAN NOT NULL DEFAULT false,
  "blockers" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "HumanProfessionalReviewDecision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HumanProfessionalReviewDecision_project_candidate_key"
ON "HumanProfessionalReviewDecision"(
  "projectId",
  "candidateReviewedRevision",
  "candidateEvidenceDigest"
);

CREATE INDEX "HumanProfessionalReviewDecision_reviewer_decided_idx"
ON "HumanProfessionalReviewDecision"("reviewerActorId", "decidedAt");

CREATE INDEX "HumanProfessionalReviewDecision_project_decided_idx"
ON "HumanProfessionalReviewDecision"("projectId", "decidedAt");

ALTER TABLE "HumanProfessionalReviewDecision"
ADD CONSTRAINT "HumanProfessionalReviewDecision_reviewerActorId_fkey"
FOREIGN KEY ("reviewerActorId") REFERENCES "Principal"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
