"use server";

import { createClickPlanCandidate, preflightUnifiedNextAction, analyzePastedCommandResult, recognizedCanonicalCommandId, type CommandEvidencePrompt, type VerifiedCommandTask } from "@blueprint-os/application";
import { redirect } from "next/navigation";
import { loadProjectWorkspace } from "../../../src/server/project-workspace";

type NextActionKind = Parameters<typeof preflightUnifiedNextAction>[0]["actionKind"];

/** Server-authenticated preflight for the single Next Action CTA.
 * Never starts execution, issues grants, approves gates, or dispatches workers.
 * Next.js Server Actions enforce Origin/Host integrity at the framework layer.
 */
export async function continueCanonicalNextAction(
  projectId: string,
  displayedProfileVersion: number,
  displayedActionKind: NextActionKind
): Promise<never> {
  // Bound inputs are UI intent, NOT identity, grant, or permission.
  if (!/^project:[a-z0-9][a-z0-9-]{0,158}$/.test(projectId)) {
    redirect("/");
  }
  const home = `/projects/${encodeURIComponent(projectId)}`;
  const workspace = await loadProjectWorkspace(encodeURIComponent(projectId));
  if (workspace.state !== "ready") {
    // Do not reveal whether the private project exists when access is lost.
    redirect(home);
  }

  // loadProjectWorkspace re-resolves the authenticated server actor and
  // rechecks PROJECT_READ through the canonical ProjectProfile service.
  // Readiness performs an additional PROJECT_READ check against the live DB.
  const latest = await workspace.runtime.readiness.read(
    workspace.actor, workspace.projectId,
    workspace.project.blueprint.requiredGates
  );
  const checked = preflightUnifiedNextAction({
    projectId,
    profileVersion: displayedProfileVersion,
    actionKind: displayedActionKind
  }, {
    projectId: latest.projectId,
    profileVersion: workspace.project.profile.meta.recordVersion,
    nextAction: latest.nextAction
  });

  // A stale action is never silently redirected to a DIFFERENT action.
  // Operator must inspect the current canonical blocker and choose again.
  if (checked.state !== "current") {
    redirect(home + "?nextAction=changed");
  }
  redirect(checked.href);
}


/**
 * R33/R34 review candidate — clicking NEXT ACTION now performs an actual
 * authenticated, source-scoped READ sequence and generates the plan in-process.
 * It is NOT an authenticated execution grant, GitHub Actions dispatch, shell
 * runner, background Work session or Quality Gate decision.
 */
export interface GuidedNextActionResult {
  readonly state: "READ_ONLY_INSPECTED" | "BLOCKED" | "STALE";
  readonly generatedPlan: boolean;
  readonly mode: "auto-read-only" | "requires-granted-runner" | "needs-cmd-result" | "unavailable";
  readonly title: string;
  readonly detail: string;
  readonly nextHref: string | null;
  readonly readback: {
    readonly projectId: string;
    readonly projectProfileVersion: number;
    readonly canonicalActionKind: string;
    readonly currentSourceRevision: "UNVERIFIED";
    readonly workPackagesRead: number;
    readonly gatesRead: number;
    readonly linkedEvidenceCount: number;
  } | null;
  readonly command: CommandEvidencePrompt | null;
  readonly qaPassed: false;
  readonly autoMutation: false;
}

/**
 * Runs the accessible safe part NOW. Requested mode affects depth of the
 * generated prompt, never authority or the permission boundary.
 */
export async function startGuidedNextAction(
  projectId: string,
  displayedProfileVersion: number,
  displayedActionKind: NextActionKind,
  requestedMode: "next" | "end-to-end"
): Promise<GuidedNextActionResult> {
  const empty = (
    state: GuidedNextActionResult["state"], detail: string
  ): GuidedNextActionResult => ({
    state, generatedPlan: false, mode:"unavailable",
    title:"NEXT ACTION chưa thể thực hiện", detail, nextHref:null,
    readback:null, command:null, qaPassed:false, autoMutation:false
  });
  if (!/^project:[a-z0-9][a-z0-9-]{0,158}$/.test(projectId) ||
      !Number.isSafeInteger(displayedProfileVersion) || displayedProfileVersion < 1 ||
      !["next","end-to-end"].includes(requestedMode)) {
    return empty("BLOCKED", "Yêu cầu hoặc phiên bản hồ sơ không hợp lệ.");
  }
  const workspace = await loadProjectWorkspace(encodeURIComponent(projectId));
  if (workspace.state !== "ready") {
    return empty("BLOCKED", "Phiên truy cập hoặc ProjectProfile không còn hợp lệ; không tiết lộ dự án riêng tư.");
  }
  try {
    const latest = await workspace.runtime.readiness.read(
      workspace.actor, workspace.projectId, workspace.project.blueprint.requiredGates
    );
    const profileVersion = workspace.project.profile.meta.recordVersion;
    const checked = preflightUnifiedNextAction({
      projectId, profileVersion:displayedProfileVersion, actionKind:displayedActionKind
    }, {
      projectId:latest.projectId,profileVersion,nextAction:latest.nextAction
    });
    if (checked.state !== "current") {
      return empty("STALE", "Nguồn dữ liệu, quyền hoặc NEXT ACTION đã đổi. Tải lại checkpoint; không chạy kế hoạch cũ.");
    }
    // Both calls independently recheck PROJECT_READ. This is real bounded
    // source inspection, rather than a prompt that claims to have run.
    const [works, gates] = await Promise.all([
      workspace.runtime.workQuality.listWorkPackages(workspace.actor, projectId),
      workspace.runtime.workQuality.listQualityGates(workspace.actor, projectId)
    ]);
    // Exact WorkPackage marker is the only source for CMD mode.
    // An arbitrary label, pasted prompt or query param cannot enable it.
    const candidateWork = works.find(work =>
      (latest.nextAction.kind==="continue-work" || latest.nextAction.kind==="unblock-work") &&
      latest.nextAction.label === (latest.nextAction.kind==="continue-work"
        ? "Continue: " : "Unblock: ") + work.title &&
      (work.status==="ready" || work.status==="in-progress" || work.status==="blocked")
    );
    const commandId = candidateWork
      ? recognizedCanonicalCommandId(candidateWork.acceptanceCriteria) : null;
    const cmdTask: VerifiedCommandTask|null = candidateWork && commandId ? {
      projectId, profileVersion,workPackageId:candidateWork.id,
      commandId,approvedPlanSource:"canonical-work-package-readonly-marker",
      taskPlanRecordVersion:candidateWork.meta.recordVersion
    } : null;
    const step = createClickPlanCandidate({
      projectId, profileVersion, actionKind:latest.nextAction.kind,
      actionLabel:latest.nextAction.label,reason:latest.nextAction.reason,
      readinessState:latest.state,
      evidenceFreshness:latest.evidenceSummary.freshness,
      sourceRevision:null,
      workPackageId:cmdTask?.workPackageId ?? (
        latest.nextAction.kind==="unblock-work"?latest.blockedWork[0]?.id:null)
    },cmdTask);
    // Do not take CMD tasks from the client, model prompt or arbitrary
    // repository text. No trusted canonical command registry is bound here yet.
    const needsRunner = step.mode==="requires-granted-runner";
    const detail = step.mode==="needs-cmd-result"
      ? "Đã tự tạo kế hoạch, kiểm tra WorkPackage và tìm thấy CMD chẩn đoán chỉ đọc được khai báo trong tiêu chí nghiệm thu. Chạy lệnh trên đúng máy/checkout rồi dán kết quả; đây chưa phải QA PASS."
      : needsRunner
      ? "Đã tự sinh kế hoạch và đọc kiểm tra trạng thái, WorkPackage và Quality Gate thật. Bước sửa/chạy tiếp cần runner và grant đúng phạm vi; nút này không tự cấp quyền."
      : "Đã tự sinh kế hoạch và thực hiện kiểm tra dữ liệu chuẩn, WorkPackage, Quality Gate trong phạm vi quyền đọc. Đây chưa phải thực thi sửa mã hay nghiệm thu sản phẩm.";
    return {
      state:needsRunner?"BLOCKED":"READ_ONLY_INSPECTED",
      generatedPlan:true,mode:step.mode,
      title:requestedMode==="next"?"NEXT ACTION — đã thực hiện kiểm tra an toàn":"TỪ ĐẦU TỚI CUỐI — đã thực hiện các bước an toàn khả dụng",
      detail,nextHref:checked.href,
      readback:{
        projectId,projectProfileVersion:profileVersion,canonicalActionKind:latest.nextAction.kind,
        currentSourceRevision:"UNVERIFIED",
        workPackagesRead:works.length,gatesRead:gates.length,
        linkedEvidenceCount:latest.evidenceSummary.linked
      },
      command:step.command,
      qaPassed:false,autoMutation:false
    };
  } catch {
    return empty("BLOCKED","Nguồn Project Registry hoặc phân quyền không đáp ứng. Không phát hành quyền, không suy đoán PASS.");
  }
}

/** CMD evidence is untrusted pasted text, never execution or QA evidence. */
export async function receiveGuidedCmdResult(
  projectId: string,
  profileVersion: number,
  actionKind: NextActionKind,
  commandId: string,
  output: string
): Promise<{state:"REJECTED"|"UNVERIFIED_MANUAL_OUTPUT"; detail:string}> {
  if (typeof output!=="string" || output.length>24000) {
    return {state:"REJECTED",detail:"Đầu ra quá dài hoặc sai định dạng. Không lưu hoặc thực thi dữ liệu."};
  }
  const workspace = await loadProjectWorkspace(encodeURIComponent(projectId));
  if (workspace.state!=="ready") return {state:"REJECTED",detail:"Không có quyền đọc dự án."};
  const latest=await workspace.runtime.readiness.read(
    workspace.actor,workspace.projectId,workspace.project.blueprint.requiredGates
  );
  const checked=preflightUnifiedNextAction({
    projectId,profileVersion,actionKind
  },{
    projectId:latest.projectId,
    profileVersion:workspace.project.profile.meta.recordVersion,
    nextAction:latest.nextAction
  });
  if (checked.state!=="current") return {state:"REJECTED",detail:"NEXT ACTION đã thay đổi."};
  const works=await workspace.runtime.workQuality.listWorkPackages(workspace.actor,projectId);
  const work=works.find(item =>
    (latest.nextAction.kind==="continue-work" || latest.nextAction.kind==="unblock-work") &&
    latest.nextAction.label === (latest.nextAction.kind==="continue-work" ? "Continue: " : "Unblock: ") + item.title &&
    (item.status==="ready" || item.status==="in-progress" || item.status==="blocked")
  );
  if (!work) return {state:"REJECTED",detail:"Không còn WorkPackage liên kết."};
  const canonicalCommand=recognizedCanonicalCommandId(work.acceptanceCriteria);
  if (!canonicalCommand || canonicalCommand!==commandId)
    return {state:"REJECTED",detail:"Lệnh CMD không được khai báo trong nhiệm vụ chuẩn hoặc đã thay đổi."};
  const step=createClickPlanCandidate({
    projectId,profileVersion,actionKind:latest.nextAction.kind,
    actionLabel:latest.nextAction.label,reason:latest.nextAction.reason,
    readinessState:latest.state,evidenceFreshness:latest.evidenceSummary.freshness,
    sourceRevision:null,workPackageId:work.id
  },{
    projectId,profileVersion,workPackageId:work.id,
    commandId:canonicalCommand,approvedPlanSource:"canonical-work-package-readonly-marker",
    taskPlanRecordVersion:work.meta.recordVersion
  });
  if (!step.command) return {state:"REJECTED",detail:"Không có lệnh được xác minh."};
  const analyzed=analyzePastedCommandResult(step.command,output);
  return {
    state:analyzed.status,
    detail:analyzed.observations.join(" ")+" Đây là đầu ra dán thủ công, không đủ xác nhận kiểm thử hay đóng Quality Gate."
  };
}
