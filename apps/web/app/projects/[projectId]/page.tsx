import Link from "next/link";
import { ProjectWorkspaceFrame, ProjectWorkspaceState } from "./_components/project-workspace";
import { ReadinessOverview } from "./_components/readiness-overview";
import { loadProjectWorkspace } from "../../../src/server/project-workspace";
import { readAuthenticatedContinuousPreflight } from "../../../src/server/continuous-execution-preflight";
import {
  recheckContinuousExecutionPreflight,
  retryContinuousSourceRead,
  confirmCreateMissingQualityGate,
  executeSignedContinuousDiscovery
} from "./continuous-execution-action";
import { ContinuousPreflightFocusRefresh } from "./_components/continuous-preflight-focus-refresh";
import { readVerifiedContinuousExecutionOffer } from "../../../src/server/continuous-execution-offer";

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
  const offer = continuous ? await readVerifiedContinuousExecutionOffer(workspace,continuous)
    .catch(() => null) : null;
  const queryState = (await searchParams)?.continuous;
  const checked = queryState === "checked" || queryState === "rechecked";

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
      <ContinuousPreflightFocusRefresh />

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
            (continuous?.assessment.state === "READY_WORK_FOUND"
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
        {queryState === "gate-recorded" ? (
          <p role="status">Đã xác minh hồ sơ Quality Gate NOT_READY trong cơ sở dữ liệu
            chuẩn. Đây không phải Quality Gate PASS hoặc quyền khởi chạy.</p>
        ) : null}
        {continuous ? (
          <section aria-labelledby="continuous-recovery-title">
            <h4 id="continuous-recovery-title">Tự khắc phục và giải quyết điểm nghẽn</h4>
            <p className="readiness-provenance-note">
              Hệ thống tự đọc nguồn chuẩn và thử lại lỗi kết nối tạm thời một lần.
              Nếu có quyết định chuyên môn hoặc thay đổi hồ sơ bắt buộc, chỉ
              hiển thị bước xác nhận cụ thể; không tự cấp quyền.
              Khi trở lại trang, trạng thái được cập nhật tự động.
            </p>
            {continuous.recoveryActions.slice(0,5).map(action => (
              <details key={action.kind + action.id}
                className="canonical-disclosure">
                <summary>{action.label}</summary>
                <div className="canonical-disclosure-body">
                  <p>{action.explanation}</p>
                  {action.kind==="automatic-readback" ? (
                    <form action={retryContinuousSourceRead.bind(
                      null,workspace.projectId,continuous.profileVersion)}>
                      <button className="secondary-button" type="submit">
                        Tự kiểm tra và phục hồi kết nối
                      </button>
                    </form>
                  ) : null}
                  {action.kind==="human-confirm-gate" &&
                    continuous.canMutate && continuous.canonicalRevision &&
                    continuous.appHead ? (
                    <form action={confirmCreateMissingQualityGate.bind(
                      null,workspace.projectId,continuous.profileVersion,
                      continuous.canonicalRevision,continuous.appHead,action.id)}>
                      <label>
                        Tên Gate
                        <input name="gateName" required minLength={4}
                          maxLength={120} placeholder="Tên tiêu chí cần kiểm tra" />
                      </label>
                      <label>
                        Điều kiện nghiệm thu đo được
                        <textarea name="acceptanceRequirement" required
                          minLength={12} maxLength={600}
                          placeholder="Mô tả đầu ra, cách kiểm tra và bằng chứng cần thu thập" />
                      </label>
                      <label>
                        <input name="confirmCreateNotReady" type="checkbox" required />
                        Tôi xác nhận chỉ tạo hồ sơ NOT_READY để chuẩn bị kiểm định.
                      </label>
                      <button className="secondary-button" type="submit">
                        Xác nhận tạo hồ sơ và đọc lại dữ liệu
                      </button>
                    </form>
                  ) : null}
                  {action.kind==="human-review" ||
                   action.kind==="prepare-work" ? (
                    <Link className="text-link" href={
                      "/projects/"+encodeURIComponent(workspace.projectId)+
                      (action.kind==="human-review" &&
                        action.id!=="request-project-role" ? "/quality" : "/roadmap")
                    }>Mở hồ sơ chuẩn để xử lý điểm nghẽn →</Link>
                  ) : null}
                  {action.kind==="authority-grant" ? (
                    <Link className="text-link" href={
                      "/projects/"+encodeURIComponent(workspace.projectId)+
                      "/prompt/workflow"}>
                      Xem workflow và các điều kiện cấp quyền →</Link>
                  ) : null}
                </div>
              </details>
            ))}
          </section>
        ) : null}
        {offer && continuous?.canonicalRevision && continuous.appHead ? (
          <form action={executeSignedContinuousDiscovery.bind(
            null,workspace.projectId,continuous.profileVersion,
            continuous.canonicalRevision,continuous.appHead
          )}>
            <button className="primary-button" type="submit"
              aria-describedby="continuous-execution-gate">
              Thực hiện nhiệm vụ liên tục — bước khảo sát được ký
            </button>
          </form>
        ) : (
          <p role="status" className="readiness-provenance-note">
            Chưa có lệnh thực thi được ký và thẩm định cho phiên bản hiện tại.
            Nút thực thi sẽ tự xuất hiện sau khi nguồn chuẩn, workflow,
            quyền cấp phép và tác vụ READY được xác thực lại.
          </p>
        )}
        {queryState==="submitted-for-qa" ? (
          <p role="status">Đã thực hiện bước khảo sát có chữ ký và ghi nhật ký.
            Kết quả gửi kiểm tra độc lập; không tự PASS Quality Gate.</p>
        ) : null}
        {queryState==="task-stopped" ? (
          <p role="alert">Lượt thực thi đã dừng theo điều kiện an toàn.
            Xem nhật ký chuẩn; không tự chạy lại grant đã sử dụng.</p>
        ) : null}
        <p id="continuous-execution-gate" className="readiness-provenance-note">
          Nút khởi chạy chỉ nhận grant server-side đã xác thực, kiểm tra lại phiên/HEAD
          và thực hiện một bước DISCOVER bằng executor chỉ đọc, có nhật ký.
          Mỗi bước tiếp theo phải có grant và QA riêng. Chỉ bật
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
