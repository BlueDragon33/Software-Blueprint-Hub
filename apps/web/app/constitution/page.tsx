import Link from "next/link";

import {
  CONSTITUTION_POLICY_ID,
  CONSTITUTION_POLICY_VERSION,
  buildConstitutionPropagationProjection,
  constitutionAuthorityStages,
  centuryGradePillarDefinitions
} from "@blueprint-os/application";
import type {
  CanonicalConstitutionAmendmentRecord,
  ConstitutionPropagationProjection,
  GovernedRepositoryAdoptionSnapshot,
  GovernedRepositoryDefinition
} from "@blueprint-os/application";
import { AppShell, StatusChip } from "@blueprint-os/ui";

import { resolveWebActor } from "../../src/auth/server-actor";
import { getBlueprintServerRuntime } from "../../src/server/runtime";
import governedRegistryJson from "../../../../control/constitution-governed-repositories.json";
import ecosystemSnapshotJson from "../../../../control/constitution-ecosystem-snapshot.json";
import { ConstitutionAuthorityConsole } from "./constitution-authority-console";

export const dynamic = "force-dynamic";


interface GovernedRegistryFile {
  readonly schemaVersion: "1.0.0";
  readonly policyId: string;
  readonly repositories: readonly GovernedRepositoryDefinition[];
}

interface EcosystemSnapshotFile {
  readonly schemaVersion: "1.0.0";
  readonly source: "github-default-branch-snapshot";
  readonly policyId: string;
  readonly activePolicyVersion: string;
  readonly repositories: readonly GovernedRepositoryAdoptionSnapshot[];
}

function loadPropagationProjection(): ConstitutionPropagationProjection {
  const registry = governedRegistryJson as unknown as GovernedRegistryFile;
  const snapshot = ecosystemSnapshotJson as unknown as EcosystemSnapshotFile;

  if (registry.schemaVersion !== "1.0.0" || snapshot.schemaVersion !== "1.0.0") {
    throw new TypeError("Unsupported Constitution ecosystem control schema");
  }
  if (
    registry.policyId !== CONSTITUTION_POLICY_ID ||
    snapshot.policyId !== CONSTITUTION_POLICY_ID
  ) {
    throw new TypeError("Constitution ecosystem policy identity drift");
  }
  if (snapshot.activePolicyVersion !== CONSTITUTION_POLICY_VERSION) {
    throw new TypeError("Constitution ecosystem snapshot policy version is stale");
  }

  return buildConstitutionPropagationProjection({
    policyId: registry.policyId,
    activePolicyVersion: snapshot.activePolicyVersion,
    governedRepositories: registry.repositories,
    snapshots: snapshot.repositories
  });
}

export default async function ConstitutionCenterPage() {
  const actor = await resolveWebActor();
  let canManage = false;
  let amendments: readonly CanonicalConstitutionAmendmentRecord[] = [];
  let propagation: ConstitutionPropagationProjection | null = null;

  if (actor) {
    const runtime = getBlueprintServerRuntime();
    canManage = await runtime.authority.canExerciseConstitutionalAuthority(actor);
    if (canManage) {
      amendments = await runtime.constitutionAuthority.list(actor);
      propagation = loadPropagationProjection();
    }
  }

  return (
    <AppShell>
      <main className="constitution-center-page">
        <nav className="constitution-center-breadcrumbs" aria-label="Breadcrumb">
          <Link className="text-link" href="/">
            Projects
          </Link>
          <span aria-hidden="true">/</span>
          <span>Constitution Center</span>
        </nav>

        <header className="constitution-center-hero">
          <div>
            <p className="eyebrow">Universal governance authority</p>
            <h1>Constitution Center</h1>
            <p className="lede">
              Software-Blueprint-Hub obeys the active Constitution and is also
              the canonical system for proposing, ratifying, publishing and
              propagating future Constitution versions.
            </p>
          </div>
          <div className="constitution-center-status">
            <StatusChip tone="success">Policy {CONSTITUTION_POLICY_VERSION}</StatusChip>
            <StatusChip tone="info">Constitutional authority separated</StatusChip>
            <StatusChip tone="warning">Production authority separate</StatusChip>
          </div>
        </header>

        <section className="constitution-center-facts" aria-label="Current Constitution authority">
          <article>
            <span>Policy</span>
            <strong>{CONSTITUTION_POLICY_ID}</strong>
            <small>Machine-readable universal authority</small>
          </article>
          <article>
            <span>Current version</span>
            <strong>{CONSTITUTION_POLICY_VERSION}</strong>
            <small>Published baseline</small>
          </article>
          <article>
            <span>Mandatory pillars</span>
            <strong>{centuryGradePillarDefinitions.length}</strong>
            <small>No project may silently remove one</small>
          </article>
          <article>
            <span>Amendment stages</span>
            <strong>{constitutionAuthorityStages.length}</strong>
            <small>Proposal through verification</small>
          </article>
        </section>

        <section
          className="constitution-center-section"
          aria-labelledby="constitution-authority-set-title"
        >
          <div className="workspace-section-heading">
            <div>
              <p className="section-kicker">Atomic authority set</p>
              <h2 id="constitution-authority-set-title">
                One law version, four synchronized authority components
              </h2>
              <p>
                The normative Constitution, machine contract, Universal
                Blueprint template and application policy version must agree
                exactly. Full Release Gate records a source-revision-bound
                attestation; manual publication data is not trusted.
              </p>
            </div>
            <StatusChip tone="success">CI atomicity enforced</StatusChip>
          </div>
          <div className="constitution-prompt-rules">
            <article>
              <h3>Normative law</h3>
              <p><code>docs/UNIVERSAL-CONSTITUTION.md</code></p>
            </article>
            <article>
              <h3>Machine authority</h3>
              <p>
                Contract + Universal template + policy version must carry the
                same constitutional version.
              </p>
            </article>
            <article>
              <h3>Publication provenance</h3>
              <p>
                Exact Git revision, CI run ID and authority-set digest are
                required. Production authority remains separate.
              </p>
            </article>
          </div>
        </section>

        <section className="constitution-center-section" aria-labelledby="constitution-pillars-title">
          <div className="workspace-section-heading">
            <div>
              <p className="section-kicker">Active law</p>
              <h2 id="constitution-pillars-title">Century-grade universal pillars</h2>
              <p>
                Blueprint Level changes implementation depth. It never removes a
                pillar.
              </p>
            </div>
            <Link className="secondary-button" href="/compass/acceptance">
              Open self-audit
            </Link>
          </div>

          <div className="constitution-pillar-grid">
            {centuryGradePillarDefinitions.map((pillar, index) => (
              <article key={pillar.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{pillar.label}</h3>
                  <code>{pillar.id}</code>
                  <p>{pillar.requirementIds.join(" · ")}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <ConstitutionAuthorityConsole
          canManage={canManage}
          amendments={amendments}
        />

        {canManage && propagation ? (
          <section
            className="constitution-center-section constitution-propagation"
            aria-labelledby="constitution-propagation-title"
          >
            <div className="workspace-section-heading">
              <div>
                <p className="section-kicker">CA-005 · Ecosystem propagation</p>
                <h2 id="constitution-propagation-title">
                  Constitution adoption across governed repositories
                </h2>
                <p>
                  This is a provenance-bound read model. It can identify stale
                  adoption and generate migration plans, but it cannot mutate
                  external repositories, PASS project gates or authorize
                  Production.
                </p>
              </div>
              <StatusChip
                tone={
                  propagation.migrationRequiredRepositories === 0 &&
                  propagation.blockedRepositories === 0
                    ? "success"
                    : "warning"
                }
              >
                {propagation.currentRepositories} / {propagation.totalRepositories} current
              </StatusChip>
            </div>

            <div className="constitution-propagation-metrics">
              <article>
                <span>Governed repositories</span>
                <strong>{propagation.totalRepositories}</strong>
              </article>
              <article>
                <span>Current policy</span>
                <strong>{propagation.currentRepositories}</strong>
              </article>
              <article>
                <span>Migration required</span>
                <strong>{propagation.migrationRequiredRepositories}</strong>
              </article>
              <article>
                <span>Blocked / unverified</span>
                <strong>{propagation.blockedRepositories}</strong>
              </article>
            </div>

            <div className="constitution-propagation-list">
              {propagation.repositories.map((item) => (
                <article key={item.repository}>
                  <div className="constitution-propagation-primary">
                    <div>
                      <strong>{item.repository}</strong>
                      <small>
                        {item.projectId} · {item.blueprintLevel} · {item.branch}
                      </small>
                    </div>
                    <StatusChip
                      tone={
                        item.state === "current"
                          ? "success"
                          : item.state === "migration-required"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {item.state}
                    </StatusChip>
                  </div>

                  <dl>
                    <div>
                      <dt>Observed policy</dt>
                      <dd>{item.observedPolicyVersion ?? "unverified"}</dd>
                    </div>
                    <div>
                      <dt>Source revision</dt>
                      <dd>
                        {item.sourceRevision
                          ? item.sourceRevision.slice(0, 12) + "…"
                          : "unavailable"}
                      </dd>
                    </div>
                    <div>
                      <dt>Role</dt>
                      <dd>{item.role}</dd>
                    </div>
                  </dl>

                  {item.migrationPlan ? (
                    <details className="canonical-disclosure">
                      <summary>
                        Migration plan
                        <span>
                          {item.migrationPlan.fromPolicyVersion} →{" "}
                          {item.migrationPlan.toPolicyVersion}
                        </span>
                      </summary>
                      <div className="canonical-disclosure-body">
                        <ol>
                          {item.migrationPlan.requiredSteps.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    </details>
                  ) : null}

                  {item.blockers.length ? (
                    <p className="constitution-propagation-blockers">
                      {item.blockers.join(" · ")}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>

            <p className="readiness-provenance-note">
              {propagation.boundaryNote}
            </p>
          </section>
        ) : null}

        <section className="constitution-center-section" aria-labelledby="amendment-flow-title">
          <div className="workspace-section-heading">
            <div>
              <p className="section-kicker">Amendment protocol</p>
              <h2 id="amendment-flow-title">Changing the Constitution is a gated lifecycle</h2>
              <p>
                The system may draft and analyze automatically, but ratification
                and publication remain separately authorized human-controlled
                stages.
              </p>
            </div>
          </div>

          <ol className="constitution-stage-list">
            {constitutionAuthorityStages.map((stage) => (
              <li key={stage.id}>
                <div className="constitution-stage-index">
                  {String(stage.order).padStart(2, "0")}
                </div>
                <div className="constitution-stage-copy">
                  <div>
                    <h3>{stage.label}</h3>
                    {stage.humanAuthorityRequired ? (
                      <StatusChip tone="warning">Human authority required</StatusChip>
                    ) : (
                      <StatusChip>Analysis / controlled execution</StatusChip>
                    )}
                  </div>
                  <p>{stage.purpose}</p>
                  <small>Canonical output: {stage.canonicalOutput}</small>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="constitution-center-section constitution-prompt-architecture" aria-labelledby="prompt-architecture-title">
          <div className="workspace-section-heading">
            <div>
              <p className="section-kicker">Prompt Architecture v2</p>
              <h2 id="prompt-architecture-title">Prompts coordinate work; they do not own authority</h2>
              <p>
                Each constitutional stage gets a separate prompt projection with
                exact source digest, scope, evidence duties and forbidden
                actions.
              </p>
            </div>
          </div>

          <div className="constitution-authority-stack" aria-label="Prompt authority precedence">
            <strong>Human Constitutional Authority</strong>
            <span>↓</span>
            <strong>Universal Constitution</strong>
            <span>↓</span>
            <strong>Project Blueprint / Work / Quality</strong>
            <span>↓</span>
            <strong>Stage-specific Prompt Projection</strong>
            <span>↓</span>
            <strong>AI / Human execution</strong>
          </div>

          <div className="constitution-prompt-rules">
            <article>
              <h3>Every prompt carries</h3>
              <p>
                Policy version, amendment/project identity, source digest,
                applicable law surface, blockers, evidence requirements and
                stale/regeneration rules.
              </p>
            </article>
            <article>
              <h3>AI may</h3>
              <p>
                Analyze, compare, draft, propose migrations, prepare review
                briefs and produce evidence candidates.
              </p>
            </article>
            <article>
              <h3>AI may not</h3>
              <p>
                Ratify a Constitution, publish it by itself, fabricate PASS,
                override canonical state or authorize Production.
              </p>
            </article>
          </div>
        </section>

        <section className="constitution-center-boundary">
          <p className="section-kicker">Authority boundary</p>
          <h2>Constitutional authority is powerful, but not unlimited.</h2>
          <p>
            Software-Blueprint-Hub may change the Constitution only through the
            amendment protocol. It cannot weaken the law merely to make itself
            pass. Project authority, Constitutional authority and Production
            authority remain independent.
          </p>
          <div className="constitution-center-actions">
            <Link className="secondary-button" href="/compass">
              System Compass
            </Link>
            <Link className="primary-button" href="/compass/acceptance">
              Constitutional self-audit
            </Link>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
