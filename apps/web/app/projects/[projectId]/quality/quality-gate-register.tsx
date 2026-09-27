"use client";

import type { GateEvidence, QualityGate } from "@blueprint-os/contracts";
import { useMemo, useState } from "react";

interface QualityGateModel {
  readonly gate: QualityGate;
  readonly evidence: readonly GateEvidence[];
}

function statusClass(status: string): string {
  if (status === "pass") return "status-chip-success";
  if (status === "fail") return "status-chip-warning";
  if (status === "candidate") return "status-chip-info";
  return "status-chip-neutral";
}

function statusLabel(status: string): string {
  return status.replace("-", " ");
}

export function QualityGateRegister({
  gateModels
}: {
  readonly gateModels: readonly QualityGateModel[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return gateModels.filter(({ gate, evidence }) => {
      if (status !== "all" && gate.status !== status) return false;
      if (!needle) return true;

      const searchable = [
        gate.name,
        gate.id,
        gate.status,
        ...gate.requirements,
        ...gate.evidenceIds,
        ...evidence.flatMap((item) => [
          item.id,
          item.kind,
          item.source,
          item.revision
        ])
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(needle);
    });
  }, [gateModels, query, status]);

  return (
    <>
      <div className="quality-register-tools" aria-label="Quality Gate filters">
        <label>
          <span>Search gates or evidence</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Gate, evidence source, revision…"
          />
        </label>
        <label>
          <span>Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="pass">PASS</option>
            <option value="candidate">Candidate</option>
            <option value="fail">Fail</option>
            <option value="not-ready">Not ready</option>
          </select>
        </label>
        <div className="quality-register-result" role="status" aria-live="polite">
          <strong>{filtered.length}</strong>
          <span>of {gateModels.length} gates shown</span>
        </div>
      </div>

      {filtered.length ? (
        <div className="workspace-card-list">
          {filtered.map(({ gate, evidence }) => (
            <article className="workspace-quality-card" key={gate.id}>
              <div className="workspace-work-card-heading">
                <div>
                  <h4>{gate.name}</h4>
                  <span>{gate.id}</span>
                </div>
                <span className={"status-chip " + statusClass(gate.status)}>
                  {statusLabel(gate.status)}
                </span>
              </div>

              {evidence[0] ? (
                <div className="canonical-provenance-preview">
                  <div>
                    <strong>Latest recorded evidence</strong>
                    <span>{evidence[0].source}</span>
                  </div>
                  <div>
                    <span>{evidence[0].revision}</span>
                    <small>{evidence[0].createdAt}</small>
                  </div>
                </div>
              ) : (
                <div className="workspace-empty-inline">
                  No canonical evidence record is available for this gate.
                </div>
              )}

              <details className="canonical-disclosure quality-disclosure">
                <summary>
                  Requirements & evidence register
                  <span>
                    {gate.requirements.length} requirements · {evidence.length} evidence
                  </span>
                </summary>

                <div className="canonical-disclosure-body">
                  <div className="workspace-quality-grid">
                    <div>
                      <strong>Requirements</strong>
                      <ul>
                        {gate.requirements.map((requirement) => (
                          <li key={requirement}>{requirement}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong>Linked evidence IDs</strong>
                      {gate.evidenceIds.length ? (
                        <ul>
                          {gate.evidenceIds.map((id) => <li key={id}>{id}</li>)}
                        </ul>
                      ) : (
                        <span>No evidence linked</span>
                      )}
                    </div>
                  </div>

                  <div className="workspace-evidence-list">
                    {evidence.length ? (
                      evidence.map((item) => (
                        <div className="workspace-evidence-row" key={item.id}>
                          <div>
                            <strong>{item.kind}</strong>
                            <span>{item.source}</span>
                          </div>
                          <div>
                            <span>{item.revision}</span>
                            <small>{item.createdAt}</small>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="workspace-empty-inline">
                        No canonical evidence record is available for this gate.
                      </div>
                    )}
                  </div>
                </div>
              </details>
            </article>
          ))}
        </div>
      ) : (
        <div className="workspace-empty-inline quality-register-empty">
          No Quality Gate matches the current search and status filters.
        </div>
      )}
    </>
  );
}
