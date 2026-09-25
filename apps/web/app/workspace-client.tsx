"use client";

import { useMemo, useState } from "react";

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

export function BlueprintWorkspace() {
  const [stage, setStage] = useState<WorkspaceStage>("project");
  const [projectName, setProjectName] = useState("Software Blueprint Hub");
  const [projectType, setProjectType] = useState("Web application");
  const [blueprintLevel, setBlueprintLevel] =
    useState<keyof typeof levelDescriptions>("B4");
  const [workTitle, setWorkTitle] = useState(
    "Ship the first verified vertical slice"
  );
  const [gateReady, setGateReady] = useState(false);

  const stages = useMemo(() => workspaceStageState(stage), [stage]);

  const promptText = [
    "# Blueprint OS Execution Prompt",
    "",
    "Project: " + projectName,
    "Blueprint level: " + blueprintLevel,
    "",
    "## Work Package",
    "- [ready] " + workTitle,
    "",
    "## Quality Gate",
    "- [" + (gateReady ? "candidate" : "not-ready") + "] Human UX acceptance",
    "",
    "## Constraints",
    "- Execute only against this source revision.",
    "- Do not infer PASS from Work Package completion.",
    "- Regenerate if canonical state changes."
  ].join("\n");

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
          <a className="nav-item nav-item-active" href="#workspace">
            <span aria-hidden="true">◫</span>
            Project workspace
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
            <strong>Foundation</strong>
            <span>FND-009 in progress</span>
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
              <strong>4 / 5</strong>
              <div className="readiness-track" aria-hidden="true">
                <span />
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
                  onClick={() => setStage(item.id)}
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
              {stage === "project" && (
                <div className="stage-panel">
                  <div className="section-heading">
                    <div>
                      <p className="section-kicker">01 · Project profile</p>
                      <h2>Define what is being built.</h2>
                    </div>
                    <span className="status-chip status-chip-info">Draft</span>
                  </div>

                  <div className="field-grid">
                    <label>
                      <span>Project name</span>
                      <input
                        value={projectName}
                        onChange={(event) => setProjectName(event.target.value)}
                      />
                    </label>
                    <label>
                      <span>Project type</span>
                      <input
                        value={projectType}
                        onChange={(event) => setProjectType(event.target.value)}
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
                              onClick={() =>
                                setBlueprintLevel(
                                  level as keyof typeof levelDescriptions
                                )
                              }
                            >
                              <strong>{level}</strong>
                              <span>{description}</span>
                            </button>
                          )
                        )}
                      </div>
                    </label>
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
                      Resolved
                    </span>
                  </div>

                  <div className="summary-grid">
                    <article className="metric-card">
                      <span>Level</span>
                      <strong>{blueprintLevel}</strong>
                      <small>{levelDescriptions[blueprintLevel]}</small>
                    </article>
                    <article className="metric-card">
                      <span>Modules</span>
                      <strong>8</strong>
                      <small>Architecture, data, UX, security + 4</small>
                    </article>
                    <article className="metric-card">
                      <span>Quality gates</span>
                      <strong>5</strong>
                      <small>Evidence required before release</small>
                    </article>
                  </div>

                  <div className="requirement-list">
                    {[
                      ["Architecture", "System boundaries + contracts"],
                      ["Data", "Source of truth + migration"],
                      ["Security", "Authority + trust model"],
                      ["UI / UX", "Critical journey + accessibility"]
                    ].map(([name, detail]) => (
                      <div className="requirement-row" key={name}>
                        <div>
                          <strong>{name}</strong>
                          <span>{detail}</span>
                        </div>
                        <span className="status-chip status-chip-neutral">
                          Required
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stage === "work" && (
                <div className="stage-panel">
                  <div className="section-heading">
                    <div>
                      <p className="section-kicker">03 · Work package</p>
                      <h2>Turn the blueprint into dependency-aware work.</h2>
                    </div>
                    <span className="status-chip status-chip-warning">Ready</span>
                  </div>

                  <label className="stacked-field">
                    <span>Work package title</span>
                    <input
                      value={workTitle}
                      onChange={(event) => setWorkTitle(event.target.value)}
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
                    <span
                      className={
                        gateReady
                          ? "status-chip status-chip-success"
                          : "status-chip status-chip-warning"
                      }
                    >
                      {gateReady ? "Candidate" : "Not ready"}
                    </span>
                  </div>

                  <div className="evidence-list">
                    {[
                      ["CI revision", "Exact revision must be green", true],
                      ["Contract checks", "No schema or projection drift", true],
                      [
                        "Human UX review",
                        "Critical journey is understandable",
                        gateReady
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

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setGateReady((value) => !value)}
                  >
                    {gateReady ? "Remove UX evidence" : "Add UX review evidence"}
                  </button>
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
                      Deterministic
                    </span>
                  </div>

                  <div className="prompt-card">
                    <div className="prompt-toolbar">
                      <span>execution-prompt:v1</span>
                      <span>source · sha256:9fe2…71c4</span>
                    </div>
                    <pre>{promptText}</pre>
                  </div>
                </div>
              )}

              <div className="stage-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setStage(previousWorkspaceStage(stage))}
                  disabled={stage === "project"}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setStage(nextWorkspaceStage(stage))}
                  disabled={stage === "prompt"}
                >
                  Continue
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
                <small>{levelDescriptions[blueprintLevel]}</small>
              </div>
              <div className="context-block">
                <span className="context-label">Active work</span>
                <strong>FND-009</strong>
                <small>App Shell vertical slice</small>
              </div>
              <div className="context-note">
                <strong>Foundation rule</strong>
                <p>
                  UI state is never domain authority. Canonical mutation wiring is
                  completed at the trusted server boundary.
                </p>
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
