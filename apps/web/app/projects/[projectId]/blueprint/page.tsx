import {
  ProjectWorkspaceFrame,
  ProjectWorkspaceState
} from "../_components/project-workspace";
import { loadProjectWorkspace } from "../../../../src/server/project-workspace";

export const dynamic = "force-dynamic";

interface ProjectBlueprintPageProps {
  readonly params: Promise<{ projectId: string }>;
}

const translatedTokens: Readonly<Record<string, string>> = {
  architecture: "Kiến trúc",
  boundaries: "Ranh giới",
  security: "Bảo mật",
  access: "Truy cập",
  governance: "Quản trị",
  project: "Dự án",
  workflow: "Quy trình",
  design: "Thiết kế",
  test: "Kiểm thử",
  quality: "Chất lượng",
  evidence: "Bằng chứng",
  data: "Dữ liệu",
  release: "Phát hành",
  risk: "Rủi ro",
  documentation: "Tài liệu",
  operations: "Vận hành"
};
function displayId(id: string): string {
  return id.split(":").slice(1).map((part) =>
    part.replaceAll("-", " ").split(" ").map((word) => translatedTokens[word] ?? word).join(" ")
  ).join(" · ");
}

export default async function ProjectBlueprintPage({
  params
}: ProjectBlueprintPageProps) {
  const { projectId } = await params;
  const workspace = await loadProjectWorkspace(projectId);

  if (workspace.state !== "ready") {
    return <ProjectWorkspaceState state={workspace.state} />;
  }

  const { profile, blueprint, templateVersions } = workspace.project;

  return (
    <ProjectWorkspaceFrame profile={profile} active="blueprint">
      <section className="workspace-view-heading">
        <div>
          <p className="section-kicker">BẢN THIẾT KẾ</p>
          <h2>Yêu cầu kỹ thuật của dự án</h2>
          <p>
            Các yêu cầu được xác định từ hồ sơ dự án, cấp Blueprint và phiên bản mẫu cụ thể.
          </p>
        </div>
        <span className="status-chip status-chip-success">Dữ liệu chuẩn</span>
      </section>

      <section className="workspace-fact-grid" aria-label="Thông số Blueprint">
        <article className="workspace-fact">
          <span>Mô-đun cần có</span>
          <strong>{blueprint.requiredModules.length}</strong>
          <small>Mô-đun kỹ thuật chuẩn</small>
        </article>
        <article className="workspace-fact">
          <span>Cổng kiểm định</span>
          <strong>{blueprint.requiredGates.length}</strong>
          <small>Điều kiện nghiệm thu cần bằng chứng</small>
        </article>
        <article className="workspace-fact">
          <span>Phiên bản hồ sơ</span>
          <strong>{blueprint.profileRecordVersion}</strong>
          <small>Resolver {blueprint.resolverVersion}</small>
        </article>
      </section>

      <section className="workspace-section">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">MÔ-ĐUN</p>
            <h3>Những phần cần thiết kế hoặc triển khai</h3>
          </div>
          <span className="status-chip status-chip-neutral">
            {blueprint.requiredModules.length} mục bắt buộc
          </span>
        </div>
        <div className="workspace-record-list">
          {blueprint.requiredModules.map((id) => (
            <div className="workspace-record-row" key={id}>
              <div>
                <strong>{displayId(id)}</strong>
                <span>{id}</span>
              </div>
              <span className="status-chip status-chip-neutral">Bắt buộc</span>
            </div>
          ))}
        </div>
      </section>

      <section className="workspace-section">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">CỔNG CHẤT LƯỢNG</p>
            <h3>Chỉ đánh dấu ĐẠT khi có bằng chứng</h3>
          </div>
          <span className="status-chip status-chip-info">
            {blueprint.requiredGates.length} cổng
          </span>
        </div>
        <div className="workspace-record-list">
          {blueprint.requiredGates.map((id) => (
            <div className="workspace-record-row" key={id}>
              <div>
                <strong>{displayId(id)}</strong>
                <span>{id}</span>
              </div>
              <span className="status-chip status-chip-info">Cần kiểm định</span>
            </div>
          ))}
        </div>
      </section>

      <section className="workspace-section">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">NGUỒN MẪU</p>
            <h3>Phiên bản mẫu chuẩn dùng để xác định yêu cầu</h3>
          </div>
        </div>
        <div className="workspace-record-list">
          {templateVersions.map((template) => (
            <div className="workspace-record-row" key={template.id + template.version}>
              <div>
                <strong>{template.id}</strong>
                <span>Phiên bản mẫu</span>
              </div>
              <span className="status-chip status-chip-neutral">
                {template.version}
              </span>
            </div>
          ))}
        </div>
      </section>

      {blueprint.warnings?.length ? (
        <section className="workspace-section workspace-section-warning">
          <div className="workspace-section-heading">
            <div>
              <p className="section-kicker">CẢNH BÁO</p>
              <h3>Cần kiểm tra trước khi triển khai</h3>
            </div>
          </div>
          <ul className="workspace-plain-list">
            {blueprint.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="workspace-record-footer">
        <span>Mã phiên bản tính toán: {blueprint.resolutionId}</span>
        <span>Mã xác thực dữ liệu: {blueprint.inputFingerprint.slice(0, 18)}…</span>
      </footer>
    </ProjectWorkspaceFrame>
  );
}
