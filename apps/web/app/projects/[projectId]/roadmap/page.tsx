import {
  ProjectWorkspaceFrame,
  ProjectWorkspaceState
} from "../_components/project-workspace";
import { loadProjectWorkspace } from "../../../../src/server/project-workspace";
import { submitIssue115Intake } from "./actions";

export const dynamic = "force-dynamic";

interface ProjectRoadmapPageProps {
  readonly params: Promise<{ projectId: string }>;
  readonly searchParams?: Promise<{ issue115?: string }>;
}

function statusClass(status: string): string {
  if (status === "completed") return "status-chip-success";
  if (status === "blocked") return "status-chip-warning";
  if (status === "review" || status === "testing") return "status-chip-info";
  return "status-chip-neutral";
}

export default async function ProjectRoadmapPage({
  params, searchParams
}: ProjectRoadmapPageProps) {
  const { projectId } = await params;
  const workspace = await loadProjectWorkspace(projectId);

  if (workspace.state !== "ready") {
    return <ProjectWorkspaceState state={workspace.state} />;
  }

  const workPackages = await workspace.runtime.workQuality.listWorkPackages(
    workspace.actor,
    workspace.projectId
  );

  // Rendering a form is not authorization. Each POST re-resolves actor and
  // PROJECT_MUTATE, then checks the canonical profile record version again.
  const eligibleIssue115 = workspace.projectId === "project:blueprint-os" &&
    await workspace.runtime.authority.can(workspace.actor, workspace.projectId, "PROJECT_MUTATE");
  const existingIssue115 = workPackages.find(
    (item) => item.id === "work:p2-115-blueprint-signed-source-inspection"
  );
  const issue115Query = (await searchParams)?.issue115;
  // A URL query parameter is not an admission receipt. Only claim successful
  // readback after the current canonical WorkPackage AND all four distinct
  // unapproved gates are read from the runtime, not from client navigation.
  const issue115GateReadback = existingIssue115
    ? await workspace.runtime.workQuality.listQualityGates(
      workspace.actor, workspace.projectId
    )
    : [];
  const issue115TrackedGates = issue115GateReadback.filter(item =>
    existingIssue115?.qualityGateIds.includes(item.gate.id));
  const issue115Confirmed = existingIssue115?.status === "blocked" &&
    existingIssue115.meta.recordVersion === 1 &&
    existingIssue115.qualityGateIds.length === 4 &&
    new Set(existingIssue115.qualityGateIds).size === 4 &&
    issue115TrackedGates.length === 4 &&
    issue115TrackedGates.every(item =>
      item.gate.status === "not-ready" &&
      item.gate.meta.recordVersion === 1 &&
      item.evidence.length === 0) &&
    (issue115Query === "created" || issue115Query === "already-present");

  const completed = workPackages.filter(
    (item) => item.status === "completed"
  ).length;
  const blocked = workPackages.filter(
    (item) => item.status === "blocked"
  ).length;

  return (
    <ProjectWorkspaceFrame
      profile={workspace.project.profile}
      active="roadmap"
    >
      <section className="workspace-view-heading">
        <div>
          <p className="section-kicker">Roadmap</p>
          <h2>Dependency-aware Work Packages</h2>
          <p>
            Canonical execution state. Numbering does not determine order;
            dependencies do.
          </p>
        </div>
        <span className="status-chip status-chip-success">Canonical</span>
      </section>

      <section className="workspace-fact-grid" aria-label="Roadmap summary">
        <article className="workspace-fact">
          <span>Total work</span>
          <strong>{workPackages.length}</strong>
          <small>Canonical Work Packages</small>
        </article>
        <article className="workspace-fact">
          <span>Completed</span>
          <strong>{completed}</strong>
          <small>Completion does not auto-pass gates</small>
        </article>
        <article className="workspace-fact">
          <span>Blocked</span>
          <strong>{blocked}</strong>
          <small>Resolve dependencies before execution</small>
        </article>
      </section>

      {workspace.projectId === "project:blueprint-os" ? (
        <section className="workspace-section" aria-labelledby="p2-115-title">
          <div className="workspace-section-heading">
            <div>
              <p className="section-kicker">P2 Issue #115 · Review preparation</p>
              <h3 id="p2-115-title">Nhập hồ sơ kỹ thuật ở trạng thái bị chặn</h3>
            </div>
            <span className="status-chip status-chip-warning">Không phê chuẩn</span>
          </div>
          <p>
            Hồ sơ đề xuất đã cố định: một Work Package và bốn Quality Gate
            NOT_READY. Thao tác này chỉ ghi hồ sơ để xem xét, không tạo issuer,
            không chạy Gateway/Worker/QA, không đổi Quality Gate sang PASS.
          </p>
          {issue115Confirmed ? (
            <p role="status">Đã đọc lại Work Package từ dữ liệu canonical. Trạng thái: BLOCKED (không có quyền thực thi).</p>
          ) : null}
          {existingIssue115 ? (
            <p>Work Package hiện có: {existingIssue115.id} · v{existingIssue115.meta.recordVersion} · {existingIssue115.status}. Kiểm tra bốn Gate trước khi chạy bất kỳ công việc nào.</p>
          ) : eligibleIssue115 ? (
            <form action={submitIssue115Intake.bind(
              null, workspace.projectId, workspace.project.profile.meta.recordVersion
            )}>
              <p>Project Profile v{workspace.project.profile.meta.recordVersion}. Chỉ người có quyền PROJECT_MUTATE mới được nhập hồ sơ.</p>
              <label>
                <input name="confirmBlockedIntake" type="checkbox" required />
                Tôi xác nhận chỉ tạo hồ sơ BLOCKED/NOT_READY để trình xét duyệt.
              </label>
              <div>
                <button className="primary-button" type="submit">
                  Nhập hồ sơ đề xuất và kiểm tra dữ liệu đã lưu
                </button>
              </div>
            </form>
          ) : (
            <p>Chưa có hồ sơ nhập. Chỉ người có quyền PROJECT_MUTATE mới thấy thao tác ghi; vui lòng yêu cầu Project Authority xem xét.</p>
          )}
        </section>
      ) : null}

      <section className="workspace-section">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">Execution graph</p>
            <h3>Work packages and dependencies</h3>
          </div>
        </div>

        {workPackages.length ? (
          <div className="workspace-card-list">
            {workPackages.map((workPackage) => (
              <article className="workspace-work-card" key={workPackage.id}>
                <div className="workspace-work-card-heading">
                  <div>
                    <h4>{workPackage.title}</h4>
                    <span>{workPackage.id}</span>
                  </div>
                  <span
                    className={"status-chip " + statusClass(workPackage.status)}
                  >
                    {workPackage.status}
                  </span>
                </div>

                <p>{workPackage.purpose}</p>

                <div className="workspace-work-meta">
                  <div>
                    <strong>Dependencies</strong>
                    {workPackage.dependencies.length ? (
                      <ul>
                        {workPackage.dependencies.map((dependency) => (
                          <li key={dependency}>{dependency}</li>
                        ))}
                      </ul>
                    ) : (
                      <span>None</span>
                    )}
                  </div>
                  <div>
                    <strong>Quality gates</strong>
                    {workPackage.qualityGateIds.length ? (
                      <ul>
                        {workPackage.qualityGateIds.map((gateId) => (
                          <li key={gateId}>{gateId}</li>
                        ))}
                      </ul>
                    ) : (
                      <span>None</span>
                    )}
                  </div>
                </div>

                <details className="workspace-acceptance">
                  <summary>Acceptance criteria</summary>
                  <ul>
                    {workPackage.acceptanceCriteria.map((criterion) => (
                      <li key={criterion}>{criterion}</li>
                    ))}
                  </ul>
                </details>
              </article>
            ))}
          </div>
        ) : (
          <div className="workspace-empty-inline">
            No canonical Work Package exists for this project yet.
          </div>
        )}
      </section>
    </ProjectWorkspaceFrame>
  );
}
