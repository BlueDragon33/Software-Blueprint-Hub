"use client";

import type {
  HumanProfessionalReviewCandidate,
  HumanProfessionalReviewDecisionKind
} from "@blueprint-os/application";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { submitProfessionalReviewAction } from "./actions";

export interface ExistingProfessionalReviewDecision {
  readonly decision: HumanProfessionalReviewDecisionKind;
  readonly decidedAt: string;
  readonly note: string;
  readonly acknowledgedFindingIds: readonly string[];
  readonly humanSignoff: boolean;
  readonly p9020TransitionAllowed: boolean;
  readonly productionReleaseAuthority: false;
  readonly blockers: readonly string[];
}

export function ProfessionalReviewDecisionPanel({
  candidate,
  existingDecision
}: {
  readonly candidate: HumanProfessionalReviewCandidate;
  readonly existingDecision: ExistingProfessionalReviewDecision | null;
}) {
  const router = useRouter();
  const [acknowledged, setAcknowledged] = useState<readonly string[]>([]);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const allAcknowledged = useMemo(
    () =>
      candidate.findings.every((finding) =>
        acknowledged.includes(finding.id)
      ),
    [acknowledged, candidate.findings]
  );

  if (existingDecision) {
    return (
      <section
        className="professional-review-decision professional-review-decision-recorded"
        aria-labelledby="professional-review-decision-title"
      >
        <div>
          <p className="section-kicker">Immutable decision receipt</p>
          <h2 id="professional-review-decision-title">
            {existingDecision.decision === "approve"
              ? "Approved"
              : existingDecision.decision === "request-changes"
                ? "Changes requested"
                : "Rejected"}
          </h2>
          <p>{existingDecision.note}</p>
        </div>
        <dl className="professional-review-receipt-grid">
          <div>
            <dt>Decided at</dt>
            <dd>{existingDecision.decidedAt}</dd>
          </div>
          <div>
            <dt>Findings acknowledged</dt>
            <dd>
              {existingDecision.acknowledgedFindingIds.length} /{" "}
              {candidate.findings.length}
            </dd>
          </div>
          <div>
            <dt>P9-020 transition</dt>
            <dd>
              {existingDecision.p9020TransitionAllowed ? "Allowed" : "Blocked"}
            </dd>
          </div>
          <div>
            <dt>Production authority</dt>
            <dd>Not granted</dd>
          </div>
        </dl>
        {existingDecision.blockers.length ? (
          <div className="professional-review-blockers">
            <strong>Remaining blockers</strong>
            <ul>
              {existingDecision.blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    );
  }

  function toggleFinding(id: string) {
    setAcknowledged((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function submit(decision: HumanProfessionalReviewDecisionKind) {
    setMessage(null);
    startTransition(async () => {
      const result = await submitProfessionalReviewAction({
        decision,
        note,
        candidateReviewedRevision: candidate.reviewedRevision,
        candidateEvidenceDigest: candidate.evidenceArtifact.digest,
        acknowledgedFindingIds: acknowledged
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setMessage("Decision recorded.");
      router.refresh();
    });
  }

  const noteReady = note.trim().length > 0;

  return (
    <section
      className="professional-review-decision"
      aria-labelledby="professional-review-decision-title"
    >
      <div>
        <p className="section-kicker">Human decision</p>
        <h2 id="professional-review-decision-title">
          Review every finding before deciding
        </h2>
        <p>
          Approval requires explicit acknowledgement of every tracked finding.
          A recorded decision is immutable for this exact revision and evidence
          digest.
        </p>
      </div>

      <fieldset className="professional-review-acknowledgements">
        <legend>Finding acknowledgements</legend>
        {candidate.findings.map((finding) => (
          <label key={finding.id}>
            <input
              type="checkbox"
              checked={acknowledged.includes(finding.id)}
              onChange={() => toggleFinding(finding.id)}
              disabled={isPending}
            />
            <span>
              <strong>{finding.id}</strong>
              <small>{finding.surface}</small>
            </span>
          </label>
        ))}
      </fieldset>

      <label className="professional-review-note">
        <span>Decision note</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={5}
          placeholder="Record what you reviewed and why you chose this decision."
          disabled={isPending}
        />
      </label>

      {message ? (
        <p className="professional-review-message" role="status">
          {message}
        </p>
      ) : null}

      <div className="professional-review-actions">
        <button
          className="primary-button"
          type="button"
          disabled={isPending || !noteReady || !allAcknowledged}
          onClick={() => submit("approve")}
        >
          Approve P9-019
        </button>
        <button
          className="secondary-button"
          type="button"
          disabled={isPending || !noteReady}
          onClick={() => submit("request-changes")}
        >
          Request changes
        </button>
        <button
          className="secondary-button"
          type="button"
          disabled={isPending || !noteReady}
          onClick={() => submit("reject")}
        >
          Reject candidate
        </button>
      </div>

      <p className="professional-review-boundary">
        Even an approval only allows transition to P9-020. It never authorizes
        Production deployment.
      </p>
    </section>
  );
}
