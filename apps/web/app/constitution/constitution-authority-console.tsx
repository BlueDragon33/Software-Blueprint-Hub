"use client";

import type {
  CanonicalConstitutionAmendmentRecord,
  ConstitutionEvidenceKind,
  ConstitutionRatificationDecisionKind
} from "@blueprint-os/application";
import { StatusChip } from "@blueprint-os/ui";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";

import {
  createConstitutionAmendmentAction,
  openConstitutionRatificationAction,
  recordConstitutionStageEvidenceAction,
  submitConstitutionRatificationAction
} from "./actions";

interface ConstitutionAuthorityConsoleProps {
  readonly canManage: boolean;
  readonly amendments: readonly CanonicalConstitutionAmendmentRecord[];
}

function list(value: FormDataEntryValue | null): readonly string[] {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function risk(value: FormDataEntryValue | null) {
  const candidate = String(value ?? "medium");
  if (
    candidate === "low" ||
    candidate === "medium" ||
    candidate === "high" ||
    candidate === "critical"
  ) {
    return candidate;
  }
  return "medium";
}

function stateTone(
  state: CanonicalConstitutionAmendmentRecord["state"]
): "neutral" | "info" | "success" | "warning" | "danger" {
  if (state === "ratified" || state === "verified") return "success";
  if (state === "rejected") return "danger";
  if (state === "ratification-ready") return "warning";
  return "info";
}

export function ConstitutionAuthorityConsole({
  canManage,
  amendments
}: ConstitutionAuthorityConsoleProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<{ ok: boolean; message: string }>) {
    setFeedback(null);
    startTransition(async () => {
      const result = await task();
      setFeedback(result.message);
      if (result.ok) {
        router.refresh();
      }
    });
  }

  function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    run(async () => {
      const result = await createConstitutionAmendmentAction({
        targetPolicyVersion: String(data.get("targetPolicyVersion") ?? ""),
        title: String(data.get("title") ?? ""),
        problem: String(data.get("problem") ?? ""),
        rationale: String(data.get("rationale") ?? ""),
        affectedPillarIds: list(data.get("affectedPillarIds")),
        affectedRequirementIds: list(data.get("affectedRequirementIds")),
        compatibilityRisk: risk(data.get("compatibilityRisk")),
        migrationRequired: data.get("migrationRequired") === "on"
      });
      if (result.ok) form.reset();
      return result;
    });
  }

  function recordEvidence(
    event: FormEvent<HTMLFormElement>,
    amendment: CanonicalConstitutionAmendmentRecord,
    kind: Extract<ConstitutionEvidenceKind, "impact" | "migration">
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    run(async () => {
      const result = await recordConstitutionStageEvidenceAction({
        amendmentId: amendment.proposal.id,
        expectedRecordVersion: amendment.recordVersion,
        kind,
        source: String(data.get("source") ?? ""),
        revision: String(data.get("revision") ?? ""),
        digest: String(data.get("digest") ?? ""),
        note: String(data.get("note") ?? "")
      });
      if (result.ok) form.reset();
      return result;
    });
  }

  function openRatification(amendment: CanonicalConstitutionAmendmentRecord) {
    run(() =>
      openConstitutionRatificationAction({
        amendmentId: amendment.proposal.id,
        expectedRecordVersion: amendment.recordVersion
      })
    );
  }

  function ratify(
    form: HTMLFormElement,
    amendment: CanonicalConstitutionAmendmentRecord,
    decision: ConstitutionRatificationDecisionKind
  ) {
    const data = new FormData(form);

    run(() =>
      submitConstitutionRatificationAction({
        amendmentId: amendment.proposal.id,
        expectedRecordVersion: amendment.recordVersion,
        decision,
        note: String(data.get("note") ?? "")
      })
    );
  }

  if (!canManage) {
    return (
      <section className="constitution-center-section constitution-authority-console">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">Canonical amendment authority</p>
            <h2>System Owner authentication required</h2>
            <p>
              Current law remains readable, but draft amendments, evidence and
              ratification decisions are restricted to Constitutional Authority.
            </p>
          </div>
          <StatusChip tone="warning">Read-only</StatusChip>
        </div>
      </section>
    );
  }

  return (
    <section className="constitution-center-section constitution-authority-console">
      <div className="workspace-section-heading">
        <div>
          <p className="section-kicker">CA-002 / CA-003</p>
          <h2>Canonical amendment workspace</h2>
          <p>
            Drafts, stage evidence and human ratification are persisted
            canonically. Publication is intentionally unavailable in this phase.
          </p>
        </div>
        <StatusChip tone="success">System Owner authority</StatusChip>
      </div>

      <form className="constitution-command-form" onSubmit={createDraft}>
        <h3>New amendment draft</h3>
        <div className="constitution-form-grid">
          <label>
            Target policy version
            <input
              name="targetPolicyVersion"
              placeholder="1.2.0"
              required
              disabled={pending}
            />
          </label>
          <label>
            Compatibility risk
            <select
              name="compatibilityRisk"
              defaultValue="medium"
              disabled={pending}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
        </div>
        <label>
          Title
          <input name="title" required disabled={pending} />
        </label>
        <label>
          Problem
          <textarea name="problem" rows={3} required disabled={pending} />
        </label>
        <label>
          Rationale
          <textarea name="rationale" rows={3} required disabled={pending} />
        </label>
        <label>
          Affected pillar IDs
          <input
            name="affectedPillarIds"
            placeholder="long-term-durability, fortress-security-disaster-resilience"
            required
            disabled={pending}
          />
        </label>
        <label>
          Affected requirement IDs
          <input
            name="affectedRequirementIds"
            placeholder="gate:durability:ageing-regression"
            disabled={pending}
          />
        </label>
        <label className="constitution-checkbox-row">
          <input type="checkbox" name="migrationRequired" disabled={pending} />
          Existing projects require migration
        </label>
        <button className="primary-button" type="submit" disabled={pending}>
          {pending ? "Recording…" : "Create canonical draft"}
        </button>
      </form>

      {feedback ? (
        <p className="constitution-command-feedback" role="status">
          {feedback}
        </p>
      ) : null}

      <div className="constitution-amendment-list">
        {amendments.length === 0 ? (
          <div className="workspace-empty-inline">
            No canonical Constitution amendment exists yet.
          </div>
        ) : (
          amendments.map((amendment) => {
            const evidenceKind =
              amendment.state === "draft"
                ? ("impact" as const)
                : amendment.state === "impact-reviewed"
                  ? ("migration" as const)
                  : null;

            return (
              <article
                className="constitution-amendment-card"
                key={amendment.proposal.id}
              >
                <div className="constitution-amendment-heading">
                  <div>
                    <p className="section-kicker">
                      {amendment.proposal.basePolicyVersion} →{" "}
                      {amendment.proposal.targetPolicyVersion}
                    </p>
                    <h3>{amendment.proposal.title}</h3>
                    <code>{amendment.proposal.id}</code>
                  </div>
                  <StatusChip tone={stateTone(amendment.state)}>
                    {amendment.state}
                  </StatusChip>
                </div>

                <p>{amendment.proposal.problem}</p>
                <dl className="constitution-amendment-meta">
                  <div>
                    <dt>Record</dt>
                    <dd>v{amendment.recordVersion}</dd>
                  </div>
                  <div>
                    <dt>Risk</dt>
                    <dd>{amendment.proposal.compatibilityRisk}</dd>
                  </div>
                  <div>
                    <dt>Impact evidence</dt>
                    <dd>{amendment.impactEvidenceIds.length}</dd>
                  </div>
                  <div>
                    <dt>Migration evidence</dt>
                    <dd>{amendment.migrationEvidenceIds.length}</dd>
                  </div>
                </dl>

                {evidenceKind ? (
                  <form
                    className="constitution-command-form constitution-inline-command"
                    onSubmit={(event) =>
                      recordEvidence(event, amendment, evidenceKind)
                    }
                  >
                    <h4>
                      Record{" "}
                      {evidenceKind === "impact"
                        ? "Impact Analysis"
                        : "Migration Plan"}{" "}
                      evidence
                    </h4>
                    <div className="constitution-form-grid">
                      <label>
                        Evidence source
                        <input
                          name="source"
                          placeholder="github-actions:run / document / review"
                          required
                          disabled={pending}
                        />
                      </label>
                      <label>
                        Exact revision
                        <input
                          name="revision"
                          placeholder="commit SHA / source revision"
                          required
                          disabled={pending}
                        />
                      </label>
                    </div>
                    <label>
                      Evidence digest
                      <input
                        name="digest"
                        placeholder="sha256:..."
                        required
                        disabled={pending}
                      />
                    </label>
                    <label>
                      Evidence note
                      <textarea
                        name="note"
                        rows={2}
                        required
                        disabled={pending}
                      />
                    </label>
                    <button
                      className="secondary-button"
                      type="submit"
                      disabled={pending}
                    >
                      Record evidence and advance
                    </button>
                  </form>
                ) : null}

                {amendment.state === "migration-ready" ? (
                  <div className="constitution-ratification-open">
                    <p>
                      Impact and migration stages are complete. Opening
                      ratification does not approve the amendment.
                    </p>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={pending}
                      onClick={() => openRatification(amendment)}
                    >
                      Open human ratification
                    </button>
                  </div>
                ) : null}

                {amendment.state === "ratification-ready" ? (
                  <form
                    className="constitution-command-form constitution-ratification-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                    }}
                  >
                    <h4>Human ratification decision</h4>
                    <p>
                      This decision is append-only and binds amendment record v
                      {amendment.recordVersion}. Publication remains separate.
                    </p>
                    <label>
                      Mandatory decision note
                      <textarea
                        name="note"
                        rows={3}
                        required
                        disabled={pending}
                      />
                    </label>
                    <div className="constitution-decision-actions">
                      <button
                        type="button"
                        className="primary-button"
                        disabled={pending}
                        onClick={(event) => {
                          const form = event.currentTarget.form;
                          if (form) {
                            ratify(form, amendment, "approve");
                          }
                        }}
                      >
                        Approve amendment
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={pending}
                        onClick={(event) => {
                          const form = event.currentTarget.form;
                          if (form) {
                            ratify(form, amendment, "reject");
                          }
                        }}
                      >
                        Reject amendment
                      </button>
                    </div>
                  </form>
                ) : null}

                {amendment.state === "ratified" ? (
                  <div className="constitution-state-boundary">
                    <strong>Human ratification recorded.</strong>
                    <span>
                      Atomic publication now requires a trusted CI authority-set
                      attestation verified by configured infrastructure. Manual
                      publication input is intentionally unavailable, and this
                      state grants zero Production authority.
                    </span>
                  </div>
                ) : null}

                {amendment.state === "published" ? (
                  <div className="constitution-state-boundary">
                    <strong>Constitution version published.</strong>
                    <span>
                      The canonical amendment records an atomic authority-set
                      publication. Publication is governance state, not
                      application Production deployment.
                    </span>
                  </div>
                ) : null}

                {amendment.state === "rejected" ? (
                  <div className="constitution-state-boundary">
                    <strong>Amendment rejected.</strong>
                    <span>
                      This decision is historical and cannot be silently replaced.
                    </span>
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
