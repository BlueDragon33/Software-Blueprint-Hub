"use client";

import type {
  ProjectBootstrapIntent,
  ProjectBootstrapPlan
} from "@blueprint-os/application";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  createCanonicalProjectFromBootstrapAction,
  createProjectBootstrapPreviewAction
} from "../../actions";

const levelLabels = {
  B0: "Micro utility",
  B1: "Small application",
  B2: "Product",
  B3: "Integrated system",
  B4: "Extensible platform",
  B5: "Critical system"
} as const;

const defaultIntent: ProjectBootstrapIntent = {
  name: "New software project",
  projectType: "web-application",
  primaryUsers: ["operator"],
  jobsToBeDone: ["Complete the critical workflow safely and clearly."],
  dataSensitivity: "internal",
  persistence: "server",
  authentication: "required",
  authorization: "role-based",
  offlineRequirement: "none",
  externalIntegrations: [],
  aiUse: "assistive",
  extensibilityRequirement: "configuration",
  expectedLifetime: "years",
  deploymentTarget: "managed web platform",
  criticality: "standard",
  expectedScale: "project-defined",
  availabilityRequirement: "recoverable web service",
  complianceSecuritySensitivity: "project-defined",
  maintenanceModel: "versioned continuous maintenance"
};

function splitList(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinList(value: readonly string[]): string {
  return value.join("\n");
}

function humanize(id: string): string {
  return id
    .split(":")
    .slice(1)
    .join(" · ")
    .replaceAll("-", " ");
}

export function ProjectBootstrapFactory() {
  const router = useRouter();
  const [intent, setIntent] = useState<ProjectBootstrapIntent>(defaultIntent);
  const [primaryUsersText, setPrimaryUsersText] = useState(
    joinList(defaultIntent.primaryUsers)
  );
  const [jobsText, setJobsText] = useState(
    joinList(defaultIntent.jobsToBeDone)
  );
  const [integrationsText, setIntegrationsText] = useState("");
  const [plan, setPlan] = useState<ProjectBootstrapPlan | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const roadmapPreview = useMemo(
    () => plan?.roadmap.slice(0, 12) ?? [],
    [plan]
  );

  function patch<K extends keyof ProjectBootstrapIntent>(
    key: K,
    value: ProjectBootstrapIntent[K]
  ): void {
    setIntent((current) => ({ ...current, [key]: value }));
    setPlan(null);
    setFeedback(null);
  }

  function currentIntent(): ProjectBootstrapIntent {
    return {
      ...intent,
      primaryUsers: splitList(primaryUsersText),
      jobsToBeDone: splitList(jobsText),
      externalIntegrations: splitList(integrationsText)
    };
  }

  function preview(): void {
    setFeedback(null);
    startTransition(async () => {
      const result = await createProjectBootstrapPreviewAction(currentIntent());
      if (!result.ok) {
        setPlan(null);
        setFeedback(result.message);
        return;
      }
      setPlan(result.plan);
      setFeedback(
        "Bootstrap Plan resolved. Review the recommendation and roadmap before creating canonical state."
      );
    });
  }

  function confirmCanonical(): void {
    if (!plan) {
      setFeedback("Generate and review a Bootstrap Plan before confirmation.");
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const result = await createCanonicalProjectFromBootstrapAction(
        currentIntent()
      );
      if (!result.ok) {
        setFeedback(result.message);
        return;
      }

      router.push(
        "/projects/" + encodeURIComponent(result.value.profile.projectId)
      );
      router.refresh();
    });
  }

  return (
    <main className="bootstrap-shell">
      <header className="bootstrap-hero">
        <div>
          <p className="eyebrow">Project Bootstrap Factory</p>
          <h1>From software idea to an evidence-ready engineering starting point.</h1>
          <p className="lede">
            Describe the project. Blueprint OS recommends the minimum safe
            engineering depth, validates a Project Profile, resolves required
            modules and gates, then builds a dependency-aware starting roadmap.
          </p>
        </div>
        <div className="bootstrap-guardrail">
          <strong>Preview first</strong>
          <span>
            Nothing here writes canonical project state until you explicitly
            confirm the reviewed Bootstrap Plan.
          </span>
        </div>
      </header>

      <section className="bootstrap-layout">
        <div className="bootstrap-form-card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">01 · Intent</p>
              <h2>What are you actually building?</h2>
            </div>
            <span className="status-chip status-chip-info">
              {plan ? "Plan resolved" : "Draft"}
            </span>
          </div>

          <div className="field-grid">
            <label>
              <span>Project name</span>
              <input
                value={intent.name}
                onChange={(event) => patch("name", event.target.value)}
              />
            </label>
            <label>
              <span>Project type</span>
              <input
                value={intent.projectType}
                onChange={(event) =>
                  patch("projectType", event.target.value)
                }
                placeholder="web-application, desktop-app, platform..."
              />
            </label>

            <label className="field-span">
              <span>Primary users · one per line</span>
              <textarea
                rows={3}
                value={primaryUsersText}
                onChange={(event) => {
                  setPrimaryUsersText(event.target.value);
                  setPlan(null);
                  setFeedback(null);
                }}
              />
            </label>

            <label className="field-span">
              <span>Jobs to be done · one per line</span>
              <textarea
                rows={3}
                value={jobsText}
                onChange={(event) => {
                  setJobsText(event.target.value);
                  setPlan(null);
                  setFeedback(null);
                }}
              />
            </label>

            <label>
              <span>Data sensitivity</span>
              <select
                value={intent.dataSensitivity}
                onChange={(event) =>
                  patch(
                    "dataSensitivity",
                    event.target.value as ProjectBootstrapIntent["dataSensitivity"]
                  )
                }
              >
                <option value="public">Public</option>
                <option value="internal">Internal</option>
                <option value="confidential">Confidential</option>
                <option value="restricted">Restricted</option>
              </select>
            </label>

            <label>
              <span>Persistence</span>
              <select
                value={intent.persistence}
                onChange={(event) =>
                  patch(
                    "persistence",
                    event.target.value as ProjectBootstrapIntent["persistence"]
                  )
                }
              >
                <option value="none">None</option>
                <option value="local">Local</option>
                <option value="server">Server</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </label>

            <label>
              <span>Authentication</span>
              <select
                value={intent.authentication}
                onChange={(event) =>
                  patch(
                    "authentication",
                    event.target.value as ProjectBootstrapIntent["authentication"]
                  )
                }
              >
                <option value="none">None</option>
                <option value="optional">Optional</option>
                <option value="required">Required</option>
              </select>
            </label>

            <label>
              <span>Authorization</span>
              <select
                value={intent.authorization}
                onChange={(event) =>
                  patch(
                    "authorization",
                    event.target.value as ProjectBootstrapIntent["authorization"]
                  )
                }
              >
                <option value="none">None</option>
                <option value="simple">Simple</option>
                <option value="role-based">Role based</option>
                <option value="policy-based">Policy based</option>
              </select>
            </label>

            <label>
              <span>Offline requirement</span>
              <select
                value={intent.offlineRequirement}
                onChange={(event) =>
                  patch(
                    "offlineRequirement",
                    event.target.value as ProjectBootstrapIntent["offlineRequirement"]
                  )
                }
              >
                <option value="none">None</option>
                <option value="read">Read</option>
                <option value="read-write">Read + write</option>
              </select>
            </label>

            <label>
              <span>AI role</span>
              <select
                value={intent.aiUse}
                onChange={(event) =>
                  patch(
                    "aiUse",
                    event.target.value as ProjectBootstrapIntent["aiUse"]
                  )
                }
              >
                <option value="none">None</option>
                <option value="assistive">Assistive</option>
                <option value="core-feature">Core feature</option>
                <option value="agentic">Agentic</option>
              </select>
            </label>

            <label>
              <span>Extensibility</span>
              <select
                value={intent.extensibilityRequirement}
                onChange={(event) =>
                  patch(
                    "extensibilityRequirement",
                    event.target.value as ProjectBootstrapIntent["extensibilityRequirement"]
                  )
                }
              >
                <option value="none">None</option>
                <option value="configuration">Configuration</option>
                <option value="templates">Templates</option>
                <option value="plugins">Plugins</option>
              </select>
            </label>

            <label>
              <span>Expected lifetime</span>
              <select
                value={intent.expectedLifetime}
                onChange={(event) =>
                  patch(
                    "expectedLifetime",
                    event.target.value as ProjectBootstrapIntent["expectedLifetime"]
                  )
                }
              >
                <option value="temporary">Temporary</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
                <option value="long-lived">Long lived</option>
              </select>
            </label>

            <label>
              <span>Criticality</span>
              <select
                value={intent.criticality}
                onChange={(event) =>
                  patch(
                    "criticality",
                    event.target.value as ProjectBootstrapIntent["criticality"]
                  )
                }
              >
                <option value="low">Low</option>
                <option value="standard">Standard</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </label>

            <label>
              <span>Minimum Blueprint level · optional</span>
              <select
                value={intent.minimumBlueprintLevel ?? ""}
                onChange={(event) =>
                  patch(
                    "minimumBlueprintLevel",
                    (event.target.value || undefined) as ProjectBootstrapIntent["minimumBlueprintLevel"]
                  )
                }
              >
                <option value="">No manual minimum</option>
                {Object.entries(levelLabels).map(([level, label]) => (
                  <option value={level} key={level}>
                    {level} · {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-span">
              <span>External integrations · one per line</span>
              <textarea
                rows={3}
                value={integrationsText}
                onChange={(event) => {
                  setIntegrationsText(event.target.value);
                  setPlan(null);
                  setFeedback(null);
                }}
                placeholder={"GitHub\nVercel\nERP"}
              />
            </label>

            <label className="field-span">
              <span>Deployment target</span>
              <input
                value={intent.deploymentTarget}
                onChange={(event) =>
                  patch("deploymentTarget", event.target.value)
                }
              />
            </label>
          </div>

          <div className="bootstrap-actions">
            <button
              type="button"
              className="primary-button"
              disabled={isPending}
              onClick={preview}
            >
              {isPending ? "Resolving…" : "Generate Bootstrap Plan"}
            </button>
            {plan ? (
              <button
                type="button"
                className="secondary-button"
                disabled={isPending}
                onClick={confirmCanonical}
              >
                Confirm & create canonical project
              </button>
            ) : null}
          </div>

          {feedback ? (
            <div className="context-note" role="status">
              <strong>Factory status</strong>
              <p>{feedback}</p>
            </div>
          ) : null}
        </div>

        <aside className="bootstrap-plan-card" aria-live="polite">
          <div className="section-heading">
            <div>
              <p className="section-kicker">02 · Engineering plan</p>
              <h2>{plan ? "Review before persistence." : "No plan yet."}</h2>
            </div>
            {plan ? (
              <span className="status-chip status-chip-success">
                Deterministic preview
              </span>
            ) : null}
          </div>

          {plan ? (
            <>
              <div className="bootstrap-level">
                <span>Recommended minimum</span>
                <strong>{plan.recommendation.level}</strong>
                <small>{levelLabels[plan.recommendation.level]}</small>
              </div>

              <div className="bootstrap-reasons">
                {plan.recommendation.reasons.map((reason) => (
                  <p key={reason}>{reason}</p>
                ))}
              </div>

              <div className="summary-grid bootstrap-summary">
                <article className="metric-card">
                  <span>Modules</span>
                  <strong>{plan.summary.modules}</strong>
                  <small>Resolved from versioned templates</small>
                </article>
                <article className="metric-card">
                  <span>Quality gates</span>
                  <strong>{plan.summary.gates}</strong>
                  <small>Evidence remains required</small>
                </article>
                <article className="metric-card">
                  <span>Roadmap items</span>
                  <strong>{plan.summary.roadmapItems}</strong>
                  <small>{plan.summary.readyItems} ready at start</small>
                </article>
              </div>

              <div className="bootstrap-roadmap">
                <div className="bootstrap-roadmap-heading">
                  <strong>Dependency-aware starting roadmap</strong>
                  <small>
                    {roadmapPreview.length} of {plan.roadmap.length} shown
                  </small>
                </div>
                {roadmapPreview.map((item) => (
                  <div className="bootstrap-roadmap-row" key={item.id}>
                    <span
                      className={
                        item.status === "ready"
                          ? "status-chip status-chip-success"
                          : "status-chip status-chip-neutral"
                      }
                    >
                      {item.status}
                    </span>
                    <div>
                      <strong>{humanize(item.sourceRequirementId)}</strong>
                      <small>
                        {item.kind} ·{" "}
                        {item.dependsOn.length
                          ? item.dependsOn.length + " dependencies"
                          : "foundation"}
                      </small>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bootstrap-boundary">
                <strong>Authority boundary</strong>
                <p>
                  This plan cannot PASS a Quality Gate, authorize Production, or
                  write canonical state by itself. “Confirm & create” recomputes
                  the plan on the trusted server and requires an authenticated,
                  authorized actor.
                </p>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <strong>Describe the project first.</strong>
              <span>
                The recommended level is derived from explicit risk signals. It
                is not a marketing score and cannot be manually lowered below
                the derived minimum.
              </span>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
