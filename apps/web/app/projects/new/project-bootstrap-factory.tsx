"use client";

import type {
  ProjectBootstrapIntent,
  ProjectBootstrapPlan
} from "@blueprint-os/application";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";

import {
  createCanonicalProjectFromBootstrapAction,
  createProjectBootstrapPreviewAction,
  generatePromptPreviewAction
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
  name: "",
  projectType: "web-application",
  primaryUsers: [],
  jobsToBeDone: [],
  dataSensitivity: "internal",
  persistence: "server",
  authentication: "required",
  authorization: "role-based",
  offlineRequirement: "none",
  externalIntegrations: [],
  aiUse: "assistive",
  extensibilityRequirement: "configuration",
  expectedLifetime: "years",
  deploymentTarget: "",
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

interface BuilderPromptPreview {
  readonly content: string;
  readonly sourceRevision: string;
  readonly planFingerprint: string;
  readonly nextWorkId: string;
}

// This is an execution draft from the existing PromptProjection path, not a canonical work order.
function composeBuilderPrompt(
  source: BuilderPromptPreview,
  plan: ProjectBootstrapPlan,
  extraRequirements: string
): string {
  const next = plan.roadmap.find((item) => item.id === source.nextWorkId);
  if (source.planFingerprint !== plan.intentFingerprint || !next) {
    return "";
  }

  const lines = [
    source.content.trimEnd(),
    "",
    "## Initial app-builder context (BOOTSTRAP PREVIEW ONLY)",
    "Constitution: ACTIVE 1.3.0; verify live authority and repository HEAD before executing.",
    "This project's canonical Git revision is NOT VERIFIED in this preview.",
    `Project intent fingerprint: ${plan.intentFingerprint}`,
    `Primary users: ${plan.profile.primaryUsers.join("; ")}`,
    `User jobs: ${plan.profile.jobsToBeDone.join("; ")}`,
    `Data sensitivity: ${plan.profile.dataSensitivity}; persistence: ${plan.profile.persistence}`,
    `Offline requirement: ${plan.profile.offlineRequirement ?? "not declared"}`,
    `Deployment target: ${plan.profile.deploymentTarget}`,
    `NEXT READY WORK: ${next.title} (${next.sourceRequirementId})`,
    `Purpose: ${next.purpose}`,
    `Dependencies: ${next.dependsOn.join(", ") || "none"}`,
    `Relevant quality gates: ${next.qualityGateIds.join(", ") || "see required Blueprint gates"}`,
    "Deliver only this bounded slice. Verify behavior with focused regressions,",
    "report exact tested revision, unresolved blockers and ONE next safe action.",
    "Do not automatically create canonical state, approve a Quality Gate, merge,",
    "ratify or deploy from this text. Human prompt approval is not release authority."
  ];
  const notes = extraRequirements.trim();
  if (notes) {
    lines.push("", "## Additional requirements entered by the builder (UNVERIFIED)", notes);
  }
  return lines.join("\n") + "\n";
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
  const intentEpoch = useRef(0);
  const [builderDraft, setBuilderDraft] = useState<BuilderPromptPreview | null>(null);
  const [extraRequirements, setExtraRequirements] = useState("");
  const [approvedPrompt, setApprovedPrompt] = useState<string | null>(null);
  const [builderStatus, setBuilderStatus] = useState<string | null>(null);

  const roadmapPreview = useMemo(
    () => plan?.roadmap.slice(0, 12) ?? [],
    [plan]
  );

  const nextReadyWork = plan?.roadmap.find(
    (item) => item.status === "ready" && item.kind === "module"
  ) ?? plan?.roadmap.find((item) => item.status === "ready") ?? null;
  const builderPrompt = builderDraft && plan
    ? composeBuilderPrompt(builderDraft, plan, extraRequirements)
    : "";

  function invalidatePreview(): void {
    intentEpoch.current += 1;
    setPlan(null);
    setBuilderDraft(null);
    setApprovedPrompt(null);
    setBuilderStatus(null);
    setFeedback(null);
  }

  function patch<K extends keyof ProjectBootstrapIntent>(
    key: K,
    value: ProjectBootstrapIntent[K]
  ): void {
    setIntent((current) => ({ ...current, [key]: value }));
    invalidatePreview();
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
    const version = ++intentEpoch.current;
    const request = currentIntent();
    setPlan(null);
    setBuilderDraft(null);
    setApprovedPrompt(null);
    setBuilderStatus(null);
    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await createProjectBootstrapPreviewAction(request);
        if (version !== intentEpoch.current) return;
        if (!result.ok) {
          setFeedback(result.message);
          return;
        }
        setPlan(result.plan);
        setFeedback(
          "Bootstrap Plan resolved. Review the recommendation and roadmap before creating canonical state."
        );
      } catch {
        if (version === intentEpoch.current) {
          setFeedback("Cannot generate Bootstrap Plan. No project state was created; check the runtime.");
        }
      }
    });
  }

  function generateNextPrompt(): void {
    if (isPending) return;
    const version = ++intentEpoch.current;
    const request = currentIntent();
    setBuilderDraft(null);
    setApprovedPrompt(null);
    setBuilderStatus("Đang lập kế hoạch và tạo prompt công việc tiếp theo…");
    setFeedback(null);
    startTransition(async () => {
      try {
        // One explicit click: resolve the read-only Bootstrap Plan if needed,
        // then project the first READY Work item using the canonical prompt builder.
        const resolved = plan ?? await createProjectBootstrapPreviewAction(request).then(
          (result) => {
            if (!result.ok) throw new Error(result.message);
            return result.plan;
          }
        );
        if (version !== intentEpoch.current) return;
        if (!resolved) {
          throw new Error("Không tạo được Bootstrap Plan. Không có dữ liệu để tạo prompt.");
        }
        setPlan(resolved);
        const next = resolved.roadmap.find(
          (item) => item.status === "ready" && item.kind === "module"
        ) ?? resolved.roadmap.find((item) => item.status === "ready");
        if (!next) {
          setBuilderStatus("Không có công việc READY. Cần xử lý các phụ thuộc trước khi lập prompt.");
          return;
        }
        const result = await generatePromptPreviewAction({
          profile: resolved.profile,
          blueprint: resolved.blueprint,
          templateVersions: resolved.activatedTemplates.map(
            ({ id, version }) => ({ id, version })
          ),
          workTitle: next.title,
          gateReady: false
        });
        if (version !== intentEpoch.current) return;
        if (!result.ok) {
          setBuilderStatus(result.message);
          return;
        }
        setBuilderDraft({
          content: result.projection.content,
          sourceRevision: result.projection.sourceRevision,
          planFingerprint: resolved.intentFingerprint,
          nextWorkId: next.id
        });
        setBuilderStatus("Đã tạo prompt. Xem lại, bổ sung yêu cầu nếu cần và bấm duyệt nội dung.");
      } catch (error) {
        if (version === intentEpoch.current) {
          setBuilderStatus(
            error instanceof Error && error.message
              ? error.message
              : "Không tạo được prompt. Chưa ghi dữ liệu dự án hoặc cấp quyền phê duyệt."
          );
        }
      }
    });
  }

  function approveBuilderPrompt(): void {
    if (!builderPrompt || isPending) return;
    setApprovedPrompt(builderPrompt);
    setBuilderStatus("Prompt text approved for manual use only. No canonical gate or release approved.");
  }

  async function copyApprovedPrompt(): Promise<void> {
    if (!approvedPrompt || approvedPrompt !== builderPrompt) return;
    try {
      await navigator.clipboard.writeText(approvedPrompt);
      setBuilderStatus("Approved prompt copied. Paste it into your chosen coding assistant.");
    } catch {
      setBuilderStatus("Clipboard access blocked. Select the prompt text and copy manually.");
    }
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
          <a className="secondary-button registry-action" href="/constitution#constitution-authority-set-title">
            Theo Hiến pháp 1.3.0
          </a>
        </div>
      </header>

          <section className="bootstrap-builder-assistant" aria-labelledby="builder-assistant-title">
            <div>
              <p className="section-kicker">03 · Lập trình viên</p>
              <h3 id="builder-assistant-title">Hỗ trợ lập trình theo Hiến pháp</h3>
              <p className="bootstrap-helper-info">
                Một lần bấm để tự lập Bootstrap Plan và sinh prompt công việc READY
                tiếp theo. Thêm yêu cầu riêng, xem trước và duyệt nội dung trước khi dùng.
              </p>
            </div>
            <div className="bootstrap-actions">
              <button
                type="button"
                className="primary-button"
                disabled={isPending}
                onClick={generateNextPrompt}
              >
                Tạo prompt công việc tiếp theo
              </button>
            </div>
            {!plan ? (
              <p className="bootstrap-helper-info" role="status">
                Điền tên dự án, người dùng, nhiệm vụ và nơi chạy ở biểu mẫu phía dưới, rồi bấm nút tạo prompt ở đây. Không cần bấm Generate Bootstrap Plan riêng.
              </p>
            ) : nextReadyWork ? (
              <p className="bootstrap-helper-info">
                Công việc có thể bắt đầu: <strong>{nextReadyWork.title}</strong>
              </p>
            ) : (
              <p role="status">Không có công việc READY; cần kiểm tra các phụ thuộc trước.</p>
            )}
            <label className="stacked-field" htmlFor="bootstrap-extra-requirements">
              Yêu cầu riêng (có thể nhập trước khi tạo prompt)
            </label>
            <textarea
              id="bootstrap-extra-requirements"
              value={extraRequirements}
              rows={3}
              placeholder="Thêm tiêu chí, phạm vi, thiết bị cần hỗ trợ, yêu cầu không được thay đổi..."
              onChange={(event) => {
                setExtraRequirements(event.target.value);
                setApprovedPrompt(null);
                setBuilderStatus("Yêu cầu đã thay đổi. Hãy xem và duyệt lại prompt nếu đã tạo.");
              }}
            />
            {builderDraft && builderPrompt ? (
              <>
                <label className="stacked-field" htmlFor="bootstrap-prompt-review">
                  Xem trước prompt — nguồn {builderDraft.sourceRevision.slice(0, 20)}…
                </label>
                <textarea
                  id="bootstrap-prompt-review"
                  className="bootstrap-prompt-output"
                  readOnly
                  rows={12}
                  value={builderPrompt}
                />
              </>
            ) : null}
            <div className="bootstrap-actions">
              <button
                type="button"
                className="primary-button"
                disabled={!builderPrompt || isPending || approvedPrompt === builderPrompt}
                onClick={approveBuilderPrompt}
              >
                Duyệt nội dung prompt
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={!approvedPrompt || approvedPrompt !== builderPrompt}
                onClick={() => { void copyApprovedPrompt(); }}
              >
                Sao chép prompt đã duyệt
              </button>
            </div>
            {builderStatus ? <p role="status" className="bootstrap-helper-info">{builderStatus}</p> : null}
            <small className="bootstrap-helper-info">
              Duyệt ở đây chỉ xác nhận văn bản để sử dụng; không thay thế Owner,
              Reviewer A/B, Quality Gate hoặc quyền Production.
            </small>
          </section>

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

          <div className="context-note" role="note">
            <strong>Start with one real user journey</strong>
            <p>
              Identify who needs the app, one specific task they must finish,
              and the observable result that proves it works. Confirm where
              their data belongs, whether offline use matters, and which
              integrations are genuinely necessary. An unfamiliar risk or
              permission is not automatically safe.
            </p>
            <p>
              Reuse an existing governed product when its owner fits the need.
              This preview proposes a starting slice and its checks; it is not
              finished product content, Quality Gate PASS, or release approval.
            </p>
          </div>

          <div className="field-grid">
            <label>
              <span>Project name</span>
              <input
                placeholder="e.g. Class attendance tracker"
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
                placeholder="e.g. Teacher who records daily attendance"
                value={primaryUsersText}
                onChange={(event) => {
                  setPrimaryUsersText(event.target.value);
                  invalidatePreview();
                }}
              />
            </label>

            <label className="field-span">
              <span>Jobs to be done · one per line</span>
              <textarea
                rows={3}
                placeholder="e.g. Record attendance and verify a saved class summary"
                value={jobsText}
                onChange={(event) => {
                  setJobsText(event.target.value);
                  invalidatePreview();
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
                  invalidatePreview();
                }}
                placeholder={"Existing service API (only if justified)"}
              />
            </label>

            <label className="field-span">
              <span>Deployment target</span>
              <input
                placeholder="e.g. Local desktop, offline browser or existing web host"
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
