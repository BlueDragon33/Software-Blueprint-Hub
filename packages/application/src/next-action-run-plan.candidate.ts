/**
 * R33/R34 candidate — a click generates the plan for THIS checkpoint and
 * immediately carries out its permitted read-only stage. No prompt copy.
 * This is not a background agent, workflow grant, shell, or execution authority.
 */
import {
  buildNextActionBlueprintCandidate,
  type NextActionBlueprintInput,
  type NextActionBlueprintCandidate
} from "./next-action-blueprint.candidate";

export type SafeCommandId = "git-head" | "git-status" | "node-version";
export interface VerifiedCommandTask {
  readonly projectId: string;
  readonly profileVersion: number;
  readonly workPackageId: string;
  readonly commandId: SafeCommandId;
  readonly approvedPlanSource: "trusted-canonical-task-registry";
  readonly taskPlanRevision: string;
}
export interface CommandEvidencePrompt {
  readonly workPackageId: string;
  readonly commandId: SafeCommandId;
  readonly displayCommand: string;
  readonly shell: "cmd";
  readonly instruction: string;
  readonly evidenceStatus: "pasted-output-unverified";
}
/** Fixed diagnostic commands; never compile arbitrary strings from prompt/chat. */
export const registeredReadOnlyCommands: Readonly<Record<SafeCommandId,string>> = Object.freeze({
  "git-head": "git rev-parse HEAD",
  "git-status": "git status --porcelain=v1",
  "node-version": "node --version"
});
const SHA=/^[a-f0-9]{40}$/;
const WORK=/^[a-zA-Z][a-zA-Z0-9:._/-]{1,159}$/;

export interface ClickPlanCandidate {
  readonly mode: "auto-read-only" | "requires-granted-runner" | "needs-cmd-result";
  readonly prompt: string;
  readonly blueprint: NextActionBlueprintCandidate;
  readonly steps: readonly string[];
  readonly command: CommandEvidencePrompt | null;
  readonly mayExecuteMutation: false;
  readonly mayLaunchWork: false;
  readonly resultIsQaPass: false;
}
export function createClickPlanCandidate(
  input: NextActionBlueprintInput,
  verifiedCommandTask?: VerifiedCommandTask | null
): ClickPlanCandidate {
  const blueprint=buildNextActionBlueprintCandidate(input);
  const steps=[
    "reauthorize-actor-and-project-read",
    "revalidate-profile-recordVersion-and-canonical-action",
    "inspect-fresh-readiness-evidence-and-blockers"
  ];
  let mode: ClickPlanCandidate["mode"]="auto-read-only";
  let command: CommandEvidencePrompt|null=null;
  if (verifiedCommandTask) {
    if (verifiedCommandTask.projectId!==input.projectId ||
        verifiedCommandTask.profileVersion!==input.profileVersion ||
        verifiedCommandTask.workPackageId!==input.workPackageId ||
        verifiedCommandTask.approvedPlanSource!=="trusted-canonical-task-registry" ||
        !WORK.test(verifiedCommandTask.workPackageId) ||
        !SHA.test(verifiedCommandTask.taskPlanRevision) ||
        !(verifiedCommandTask.commandId in registeredReadOnlyCommands)) {
      throw new TypeError("CMD plan is not trusted, current and canonically bound");
    }
    mode="needs-cmd-result";
    command=Object.freeze({
      workPackageId:verifiedCommandTask.workPackageId,
      commandId:verifiedCommandTask.commandId,
      displayCommand:registeredReadOnlyCommands[verifiedCommandTask.commandId],
      shell:"cmd",
      instruction:"Chạy lệnh chỉ đọc tại đúng checkout được xác nhận. Dán toàn bộ stdout/stderr, không dán token, mật khẩu hoặc dữ liệu riêng tư.",
      evidenceStatus:"pasted-output-unverified"
    });
    steps.push("display-vetted-read-only-cmd-and-receive-redacted-output");
  } else if (input.actionKind==="continue-work" || input.actionKind==="unblock-work") {
    mode="requires-granted-runner";
    steps.push("stop-before-mutation-without-scoped-runner-grant");
  } else {
    steps.push("present-fresh-priority-and-authorized-workspace-path");
  }
  return Object.freeze({
    mode, prompt:blueprint.endToEndPrompt, blueprint,
    steps:Object.freeze(steps),
    command, mayExecuteMutation:false, mayLaunchWork:false, resultIsQaPass:false
  });
}

export interface SafeCommandAnalysis {
  readonly accepted: boolean;
  readonly status: "UNVERIFIED_MANUAL_OUTPUT" | "REJECTED";
  readonly observations: readonly string[];
  readonly mayCloseQualityGate: false;
}
export function analyzePastedCommandResult(
  command: CommandEvidencePrompt,
  output: string
): SafeCommandAnalysis {
  if (!Object.values(registeredReadOnlyCommands).includes(command.displayCommand) ||
      !Object.hasOwn(registeredReadOnlyCommands,command.commandId) ||
      registeredReadOnlyCommands[command.commandId]!==command.displayCommand ||
      typeof output!=="string" || output.trim().length===0 || output.length>24000) {
    return {accepted:false,status:"REJECTED",observations:["Thiếu kết quả hợp lệ hoặc vượt giới hạn kích thước."],mayCloseQualityGate:false};
  }
  const observations:string[]=[];
  if (command.commandId==="git-head") {
    const sha=output.trim();
    observations.push(SHA.test(sha)?"Chuỗi có hình thức Git SHA-40; chưa xác thực nguồn chạy.":"Kết quả không có hình thức Git SHA-40.");
  } else if (command.commandId==="git-status") {
    observations.push(output.trim()? "Có dòng trạng thái Git được cung cấp; chưa xác minh máy nguồn.":"Không có thay đổi được báo cáo.");
  } else {
    observations.push(/^v\d+\.\d+\.\d+/.test(output.trim())?"Có phiên bản Node trong kết quả; chưa xác minh máy nguồn.":"Không nhận diện được phiên bản Node.");
  }
  return {accepted:true,status:"UNVERIFIED_MANUAL_OUTPUT",observations,mayCloseQualityGate:false};
}
