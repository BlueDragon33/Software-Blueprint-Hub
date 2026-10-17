import Link from "next/link";
import { ProjectWorkspaceFrame, ProjectWorkspaceState } from "./_components/project-workspace";
import { ReadinessOverview } from "./_components/readiness-overview";
import { loadProjectWorkspace } from "../../../src/server/project-workspace";
import { readAuthenticatedContinuousPreflight } from "../../../src/server/continuous-execution-preflight";
import { recheckContinuousExecutionPreflight } from "./continuous-execution-action";

export const dynamic = "force-dynamic";

interface ProjectPageProps {
  readonly params: Promise<{ projectId: string }>;
  readonly searchParams?: Promise<{ continuous?: string }>;
}

export default async function ProjectOverviewPage({ params, searchParams }: ProjectPageProps) {
  const { projectId } = await params;
  const workspace = await loadProjectWorkspace(projectId);

  if (workspace.state !== "ready") {
    return <ProjectWorkspaceState state={workspace.state} />;
  }

  const readiness = await workspace.runtime.readiness.read(
    workspace.actor,
    workspace.projectId,
    workspace.project.blueprint.requiredGates
  );

  // All reads are project-scoped and resolved after authenticated PROJECT_READ.
  // Failing HEAD/evidence reads never enable a continuous execution action.
  const continuous = await readAuthenticatedContinuousPreflight(workspace)
    .catch(() => null);
  const checked = (await searchParams)?.continuous === "checked";

  return (
    <ProjectWorkspaceFrame
      profile={workspace.project.profile}
      active="overview"
    >
      <section className="workspace-view-heading">
        <div>
          <p className="section-kicker">Overview</p>
          <h2>Readiness, blockers and the next engineering action</h2>
        </div>
        <span className="status-chip status-chip-success">Canonical</span>
      </section>

      <ReadinessOverview readiness={readiness} />

      <section className="workspace-section" aria-labelledby="continuous-execution-title">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">Blueprint OS R15–R22</p>
            <h3 id="continuous-execution-title">Thực hiện nhiệm vụ liên tục</h3>
            <p>
              Tiền kiểm lấy hồ sơ, Work Package, Quality Gate và revision trực
              tiếp từ nguồn có xác thực. Không có quyền thực thi chỉ từ nút bấm.
            </p>
          </div>
          <span className={"status-chip " +
            (continuous?.assessment.state === "ENGINEERING_READY"
              ? "status-chip-info" : "status-chip-warning")}>
            {continuous?.assessment.state ?? "UNVERIFIED"}
          </span>
        </div>
        {checked ? (
          <p role="status">
            Đã thực hiện lại tiền kiểm trong phiên đăng nhập. Kết quả bên dưới
            vẫn không phải phê chuẩn thực thi hoặc Quality Gate PASS.
          </p>
        ) : null}
        {continuous ? (
          <>
            <p>
              {continuous.assessment.nextWorkId
                ? "Nhiệm vụ kỹ thuật tiếp theo: " +
                  continuous.assessment.nextWorkTitle +
                  " (" + continuous.assessment.nextWorkId + ")"
                : "Chưa có nhiệm vụ READY đủ điều kiện để thực thi."}
            </p>
            {continuous.assessment.reasons.map(reason => (
              <p key={reason} className="readiness-provenance-note">{reason}</p>
            ))}
            <p className="readiness-provenance-note">
              Profile v{continuous.profileVersion} · Canonical revision:
              {" "}<code>{continuous.canonicalRevision ?? "UNVERIFIED"}</code>
              {" "}· Live HEAD:
              {" "}<code>{continuous.appHead ?? "UNVERIFIED"}</code>
            </p>
            {continuous.canonicalRevision && continuous.appHead ? (
              <form action={recheckContinuousExecutionPreflight.bind(
                null, workspace.projectId, continuous.profileVersion,
                continuous.canonicalRevision, continuous.appHead
              )}>
                <button className="secondary-button registry-action" type="submit">
                  Kiểm tra lại READY bằng dữ liệu thật
                </button>
              </form>
            ) : null}
            {continuous.selectedWorkflowId ? (
              <p>
                <Link className="text-link"
                  href={"/projects/" + encodeURIComponent(workspace.projectId) +
                    "/prompt/workflow?workflowId=" +
                    encodeURIComponent(continuous.selectedWorkflowId)}>
                  Xem workflow có nguồn gốc và kiểm tra HEAD trong phạm vi →
                </Link>
              </p>
            ) : null}
          </>
        ) : (
          <p role="status">Không thể xác minh dữ liệu chuẩn hoặc phiên làm việc.
            Nút thực thi phải giữ trạng thái khóa.</p>
        )}
        <button className="primary-button" type="button" disabled
          aria-describedby="continuous-execution-gate">
          Thực hiện nhiệm vụ liên tục — chưa được cấp quyền
        </button>
        <p id="continuous-execution-gate" className="readiness-provenance-note">
          Một Work Package READY không phải signed execution grant. Chỉ bật
          thực thi sau khi Project Authority phê chuẩn đúng workflow, issuer,
          runtime và actor; POST phải kiểm tra lại HEAD, quyền và bằng chứng.
          Không tự merge, xuất bản hay đánh dấu PASS.
        </p>
      </section>

      <section className="workspace-fact-grid" aria-label="Project overview facts">
        <article className="workspace-fact">
          <span>Profile version</span>
          <strong>{workspace.project.profile.meta.recordVersion}</strong>
          <small>{workspace.project.profile.meta.updatedAt}</small>
        </article>
        <article className="workspace-fact">
          <span>Required modules</span>
          <strong>{workspace.project.blueprint.requiredModules.length}</strong>
          <small>Open Blueprint for the full requirement set</small>
        </article>
        <article className="workspace-fact">
          <span>Blueprint level</span>
          <strong>{workspace.project.profile.blueprintLevel}</strong>
          <small>{workspace.project.profile.projectType}</small>
        </article>
      </section>
    </ProjectWorkspaceFrame>
  );
}
