"use client";

import type {
  PromptProjection,
  QualityGate,
  WorkPackage
} from "@blueprint-os/contracts";
import { useMemo, useState, useTransition } from "react";

import {
  bootstrapOwnerAction,
  createCanonicalProjectAction,
  createCanonicalWorkAction,
  generateCanonicalPromptAction,
  generatePromptPreviewAction,
  resolveBlueprintPreviewAction,
  type BlueprintPreviewResult
} from "./actions";
import {
  nextWorkspaceStage,
  previousWorkspaceStage,
  workspaceStageState,
  type WorkspaceStage
} from "../src/workspace/journey";

const levelDescriptions = {
  B0: "Micro utility",
  B1: "Small application",
  B2: "Product",
  B3: "Integrated system",
  B4: "Extensible platform",
  B5: "Critical system"
} as const;

type ResolvedPreview = Extract<BlueprintPreviewResult, { readonly ok: true }>;

function humanizeRequirement(id: string): string {
  return id
    .split(":")
    .slice(1)
    .join(" · ")
    .replaceAll("-", " ");
}

export function BlueprintWorkspace() {
  const [stage, setStage] = useState<WorkspaceStage>("project");
  const [projectName, setProjectName] = useState("Software Blueprint Hub");
  const [projectType, setProjectType] = useState("web-application");
  const [blueprintLevel, setBlueprintLevel] =
    useState<keyof typeof levelDescriptions>("B4");
  const [workTitle, setWorkTitle] = useState(
    "Ship the first verified vertical slice"
  );
  const [resolution, setResolution] = useState<ResolvedPreview | null>(null);
  const [canonicalIds, setCanonicalIds] = useState<{
    readonly projectId: string;
    readonly profileId: string;
    readonly workPackageId: string;
    readonly qualityGateId: string;
  } | null>(null);
  const [canonicalWork, setCanonicalWork] = useState<WorkPackage | null>(null);
  const [canonicalGate, setCanonicalGate] = useState<QualityGate | null>(null);
  const [projection, setProjection] = useState<PromptProjection | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const stages = useMemo(() => workspaceStageState(stage), [stage]);

  function invalidatePreview(): void {
    setResolution(null);
    setCanonicalIds(null);
    setCanonicalWork(null);
    setCanonicalGate(null);
    setProjection(null);
    setFeedback(null);
  }

  function resolvePreview(): void {
    setFeedback(null);
    startTransition(async () => {
      const result = await resolveBlueprintPreviewAction({
        projectName,
        projectType,
        blueprintLevel
      });

      if (!result.ok) {
        setResolution(null);
        setProjection(null);
        setFeedback(
          result.message +
            (result.details.length ? " " + result.details.join(" · ") : "")
        );
        return;
      }

      setResolution(result);
      setProjection(null);
      setStage("blueprint");
    });
  }

  function createCanonicalProject(): void {
    setFeedback(null);
    startTransition(async () => {
      const result = await createCanonicalProjectAction({
        projectName,
        projectType,
        blueprintLevel
      });

      if (!result.ok) {
        setFeedback(result.message);
        return;
      }

      setResolution({
        ok: true,
        profile: result.value.profile,
        blueprint: result.value.blueprint,
        templateVersions: result.value.templateVersions
      });
      setCanonicalIds(result.value.ids);
      setCanonicalWork(null);
      setCanonicalGate(null);
      setProjection(null);
      setStage("blueprint");
    });
  }

  function initializeOwner(): void {
    setFeedback(null);
    startTransition(async () => {
      const result = await bootstrapOwnerAction();
      setFeedback(
        result.ok
          ? "Blueprint OS Owner initialized. Canonical project mutations are now available."
          : result.message
      );
    });
  }

  function persistCanonicalWork(): void {
    if (!resolution || !canonicalIds) {
      setStage("gate");
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const result = await createCanonicalWorkAction({
        profile: resolution.profile,
        ids: canonicalIds,
        workTitle
      });

      if (!result.ok) {
        setFeedback(result.message);
        return;
      }

      setCanonicalWork(result.value.workPackage);
      setCanonicalGate(result.value.qualityGate);
      setProjection(null);
      setStage("gate");
    });
  }


  function generatePrompt(): void {
    if (!resolution) {
      setFeedback("Resolve the Project Profile before generating a prompt.");
      setStage("project");
      return;
    }

    if (canonicalIds && (!canonicalWork || !canonicalGate)) {
      setFeedback(
        "Persist the canonical Work Package and Quality Gate before generating from canonical state."
      );
      setStage("work");
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      if (canonicalIds) {
        const result = await generateCanonicalPromptAction(
          resolution.profile.projectId
        );
        if (!result.ok) {
          setProjection(null);
          setFeedback(result.message);
          return;
        }
        setProjection(result.value);
        setStage("prompt");
        return;
      }

      const result = await generatePromptPreviewAction({
        profile: resolution.profile,
        blueprint: resolution.blueprint,
        templateVersions: resolution.templateVersions,
        workTitle,
        gateReady: false
      });

      if (!result.ok) {
        setProjection(null);
        setFeedback(
          result.message +
            (result.details.length ? " " + result.details.join(" · ") : "")
        );
        return;
      }

      setProjection(result.projection);
      setStage("prompt");
    });
  }

  function continueJourney(): void {
    if (stage === "project") {
      resolvePreview();
      return;
    }

    if (stage === "work") {
      persistCanonicalWork();
      return;
    }

    if (stage === "gate") {
      generatePrompt();
      return;
    }

    setStage(nextWorkspaceStage(stage));
  }

  function openStage(target: WorkspaceStage): void {
    if (target !== "project" && !resolution) {
      setFeedback("Resolve the Project Profile before opening later stages.");
      setStage("project");
      return;
    }

    if (
      canonicalIds &&
      (target === "gate" || target === "prompt") &&
      (!canonicalWork || !canonicalGate)
    ) {
      setFeedback(
        "Persist the canonical Work Package and Quality Gate before opening later canonical stages."
      );
      setStage("work");
      return;
    }

    if (target === "prompt" && !projection) {
      generatePrompt();
      return;
    }

    setFeedback(null);
    setStage(target);
  }

  const moduleCount = resolution?.blueprint.requiredModules.length;
  const gateCount = resolution?.blueprint.requiredGates.length;

  return (
    <div className="workspace-shell">
      <aside className="sidebar" aria-label="Blueprint OS navigation">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">B</span>
          <div>
            <strong>Blueprint OS</strong>
            <span>Engineering Control Center</span>
          </div>
        </div>

        <nav className="primary-nav" aria-label="Primary navigation">
          <a className="nav-item" href="/">
            <span aria-hidden="true">◫</span>
            Projects
          </a>
          <a className="nav-item nav-item-active" href="/projects/new">
            <span aria-hidden="true">＋</span>
            New project
          </a>
          <a className="nav-item" href="#knowledge">
            <span aria-hidden="true">◇</span>
            Knowledge library
          </a>
          <a className="nav-item" href="#decisions">
            <span aria-hidden="true">◎</span>
            Decisions
          </a>
          <a className="nav-item" href="#settings">
            <span aria-hidden="true">⚙</span>
            Settings
          </a>
        </nav>

        <div className="sidebar-status">
          <span className="status-dot" aria-hidden="true" />
          <div>
            <strong>Phase 6</strong>
            <span>P6-001 · Project registry</span>
          </div>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="topbar">
          <div>
            <p className="topbar-kicker">Project 0001</p>
            <strong>{projectName}</strong>
          </div>
          <div className="topbar-actions">
            <span className="environment-badge">Preview</span>
            <button className="avatar-button" aria-label="Open account menu">
              BN
            </button>
          </div>
        </header>

        <main id="workspace" className="workspace-content">
          <section className="hero-panel" aria-labelledby="workspace-title">
            <div>
              <p className="eyebrow">Vertical slice</p>
              <h1 id="workspace-title">Build with evidence, not guesswork.</h1>
              <p className="lede">
                Move from a project profile to a resolved blueprint, work package,
                quality gate, and deterministic execution prompt in one guided flow.
              </p>
            </div>

            <div className="readiness-card" aria-label="Blueprint readiness">
              <span>Blueprint readiness</span>
              <strong>{resolution ? "4 / 5" : "1 / 5"}</strong>
              <div className="readiness-track" aria-hidden="true">
                <span style={{ width: resolution ? "80%" : "20%" }} />
              </div>
              <small>Current focus: {stage}</small>
            </div>
          </section>

          <ol className="journey" aria-label="Vertical slice progress">
            {stages.map((item, index) => (
              <li
                key={item.id}
                className={"journey-item journey-" + item.status}
              >
                <button
                  type="button"
                  onClick={() => openStage(item.id)}
                  aria-current={item.status === "current" ? "step" : undefined}
                >
                  <span className="journey-index" aria-hidden="true">
                    {item.status === "complete" ? "✓" : index + 1}
                  </span>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.status}</small>
                  </span>
                </button>
              </li>
            ))}
          </ol>

          <section className="workbench" aria-live="polite">
            <div className="workbench-main">
              <div className="permission-banner">
                <div>
                  <strong>{canonicalIds ? "Canonical mode" : "Preview mode"}</strong>
                  <span>
                    {canonicalIds
                      ? "Project/Profile and subsequent Work/Gate state are persisted through authorized application services."
                      : "Preview resolution is read-only. Sign in and create canonical state before treating this workspace as project truth."}
                  </span>
                </div>
                <span
                  className={
                    canonicalIds
                      ? "status-chip status-chip-success"
                      : "status-chip status-chip-neutral"
                  }
                >
                  {canonicalIds ? "Persisted" : "Read / preview"}
                </span>
              </div>

              {isPending && (
                <div className="system-state" role="status">
                  <span className="state-spinner" aria-hidden="true" />
                  Processing against versioned Blueprint contracts…
                </div>
              )}

              {feedback && (
                <div className="system-state system-state-error" role="alert">
                  <strong>Action needs attention</strong>
                  <span>{feedback}</span>
                </div>
              )}

              {stage === "project" && (
                <div className="stage-panel">
                  <div className="section-heading">
                    <div>
                      <p className="section-kicker">01 · Project profile</p>
                      <h2>Define what is being built.</h2>
                    </div>
                    <span className="status-chip status-chip-info">
                      {resolution ? "Resolved" : "Draft"}
                    </span>
                  </div>

                  <div className="field-grid">
                    <label>
                      <span>Project name</span>
                      <input
                        value={projectName}
                        onChange={(event) => {
                          setProjectName(event.target.value);
                          invalidatePreview();
                        }}
                      />
                    </label>
                    <label>
                      <span>Project type</span>
                      <input
                        value={projectType}
                        onChange={(event) => {
                          setProjectType(event.target.value);
                          invalidatePreview();
                        }}
                      />
                    </label>
                    <label className="field-span">
                      <span>Blueprint level</span>
                      <div
                        className="level-grid"
                        role="radiogroup"
                        aria-label="Blueprint level"
                      >
                        {Object.entries(levelDescriptions).map(
                          ([level, description]) => (
                            <button
                              key={level}
                              type="button"
                              role="radio"
                              aria-checked={blueprintLevel === level}
                              className={
                                blueprintLevel === level
                                  ? "level-card level-card-active"
                                  : "level-card"
                              }
                              onClick={() => {
                                setBlueprintLevel(
                                  level as keyof typeof levelDescriptions
                                );
                                invalidatePreview();
                              }}
                            >
                              <strong>{level}</strong>
                              <span>{description}</span>
                            </button>
                          )
                        )}
                      </div>
                    </label>
                  </div>

                  <div className="stage-actions stage-actions-inline">
                    <a className="secondary-button" href="/api/auth/signin">
                      Sign in
                    </a>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={initializeOwner}
                      disabled={isPending}
                    >
                      Initialize Owner
                    </button>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={createCanonicalProject}
                      disabled={isPending}
                    >
                      Create canonical project
                    </button>
                  </div>
                </div>
              )}

              {stage === "blueprint" && (
                <div className="stage-panel">
                  <div className="section-heading">
                    <div>
                      <p className="section-kicker">02 · Resolved blueprint</p>
                      <h2>See the engineering depth this project requires.</h2>
                    </div>
                    <span className="status-chip status-chip-success">
                      {resolution ? "Resolved" : "Empty"}
                    </span>
                  </div>

                  {resolution ? (
                    <>
                      <div className="summary-grid">
                        <article className="metric-card">
                          <span>Level</span>
                          <strong>{blueprintLevel}</strong>
                          <small>{levelDescriptions[blueprintLevel]}</small>
                        </article>
                        <article className="metric-card">
                          <span>Modules</span>
                          <strong>{moduleCount}</strong>
                          <small>Resolved from versioned templates</small>
                        </article>
                        <article className="metric-card">
                          <span>Quality gates</span>
                          <strong>{gateCount}</strong>
                          <small>Evidence required before PASS</small>
                        </article>
                      </div>

                      <div className="requirement-list">
                        {resolution.blueprint.requiredModules
                          .slice(0, 6)
                          .map((id) => (
                            <div className="requirement-row" key={id}>
                              <div>
                                <strong>{humanizeRequirement(id)}</strong>
                                <span>{id}</span>
                              </div>
                              <span className="status-chip status-chip-neutral">
                                Required
                              </span>
                            </div>
                          ))}
                      </div>
                    </>
                  ) : (
                    <div className="empty-state">
                      <strong>No resolved blueprint yet.</strong>
                      <span>Return to Project and resolve the profile first.</span>
                    </div>
                  )}
                </div>
              )}

              {stage === "work" && (
                <div className="stage-panel">
                  <div className="section-heading">
                    <div>
                      <p className="section-kicker">03 · Work package</p>
                      <h2>Turn the blueprint into dependency-aware work.</h2>
                    </div>
                    <span className="status-chip status-chip-warning">
                      {canonicalWork ? "Persisted" : "Ready"}
                    </span>
                  </div>

                  <label className="stacked-field">
                    <span>Work package title</span>
                    <input
                      value={workTitle}
                      onChange={(event) => {
                        setWorkTitle(event.target.value);
                        setCanonicalWork(null);
                        setCanonicalGate(null);
                        setProjection(null);
                      }}
                    />
                  </label>

                  <div className="detail-card">
                    <span className="detail-label">Purpose</span>
                    <p>
                      Deliver one end-to-end slice that proves the current contracts
                      before broader feature expansion.
                    </p>
                  </div>

                  <div className="detail-card">
                    <span className="detail-label">Dependencies</span>
                    <div className="dependency-list">
                      <span>FND-004 · Authority</span>
                      <span>FND-006 · Profile service</span>
                      <span>FND-008 · Prompt projection</span>
                    </div>
                  </div>
                </div>
              )}

              {stage === "gate" && (
                <div className="stage-panel">
                  <div className="section-heading">
                    <div>
                      <p className="section-kicker">04 · Quality gate</p>
                      <h2>PASS is a decision backed by evidence.</h2>
                    </div>
                    <span className="status-chip status-chip-warning">
                      {canonicalGate ? "Persisted · Not ready" : "Preview · Not ready"}
                    </span>
                  </div>

                  <div className="evidence-list">
                    {[
                      ["CI revision", "Exact revision must be green", true],
                      ["Contract checks", "No schema or projection drift", true],
                      [
                        "Human UX review",
                        "Must be recorded by an authorized reviewer against an exact revision",
                        false
                      ]
                    ].map(([title, detail, done]) => (
                      <div className="evidence-row" key={String(title)}>
                        <span
                          className={
                            done
                              ? "evidence-check evidence-check-done"
                              : "evidence-check"
                          }
                          aria-hidden="true"
                        >
                          {done ? "✓" : "·"}
                        </span>
                        <span>
                          <strong>{title}</strong>
                          <small>{detail}</small>
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="context-note">
                    <strong>Evidence boundary</strong>
                    <p>
                      This UI cannot manufacture Human UX evidence. The gate remains
                      not-ready until a trusted reviewer records evidence with source
                      and exact revision.
                    </p>
                  </div>
                </div>
              )}

              {stage === "prompt" && (
                <div className="stage-panel">
                  <div className="section-heading">
                    <div>
                      <p className="section-kicker">05 · Execution prompt</p>
                      <h2>Project state becomes an executable handoff.</h2>
                    </div>
                    <span className="status-chip status-chip-success">
                      {projection ? "Deterministic" : "Empty"}
                    </span>
                  </div>

                  {projection ? (
                    <div className="prompt-card">
                      <div className="prompt-toolbar">
                        <span>{projection.templateVersion}</span>
                        <span>{projection.sourceRevision.slice(0, 24)}…</span>
                      </div>
                      <pre>{projection.content}</pre>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <strong>No execution prompt yet.</strong>
                      <span>
                        Complete the Gate step and generate a projection from server
                        state.
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="stage-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setStage(previousWorkspaceStage(stage))}
                  disabled={stage === "project" || isPending}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={continueJourney}
                  disabled={stage === "prompt" || isPending}
                >
                  {isPending
                    ? "Processing…"
                    : stage === "project"
                      ? "Resolve blueprint"
                      : stage === "work" && canonicalIds
                        ? "Persist work & gate"
                        : stage === "gate"
                          ? canonicalIds
                            ? "Generate canonical prompt"
                            : "Generate preview prompt"
                          : "Continue"}
                </button>
              </div>
            </div>

            <aside className="context-panel" aria-label="Project context">
              <div className="context-block">
                <span className="context-label">Project</span>
                <strong>{projectName || "Untitled project"}</strong>
                <small>{projectType}</small>
              </div>
              <div className="context-block">
                <span className="context-label">Blueprint</span>
                <strong>{blueprintLevel}</strong>
                <small>
                  {resolution
                    ? String(moduleCount) + " modules · " + String(gateCount) + " gates"
                    : "Not resolved"}
                </small>
              </div>
              <div className="context-block">
                <span className="context-label">Active work</span>
                <strong>FND-009</strong>
                <small>App Shell vertical slice</small>
              </div>
              <div className="context-note">
                <strong>Authority boundary</strong>
                <p>
                  Preview actions cannot write canonical project state. Production
                  mutation requires an authenticated actor and application-service
                  authorization.
                </p>
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
