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
  readonly approvedPlanSource: "canonical-work-package-readonly-marker";
  readonly taskPlanRecordVersion: number;
}
export interface CommandEvidencePrompt {
  readonly workPackageId: string;
  readonly workPackageRecordVersion: number;
  readonly commandId: SafeCommandId;
  readonly displayCommand: string;
  readonly shell: "cmd";
  readonly instruction: string;
  readonly evidenceStatus: "pasted-output-unverified";
}
/** Fixed diagnostic commands; never compile arbitrary strings from prompt/chat. */
export const registeredReadOnlyCommands: Readonly<Record<SafeCommandId,string>> = Object.freeze({
  "git-head": "git rev-parse HEAD",
  "git-status": "git status --short --branch",
  "node-version": "node --version"
});
const SHA=/^[a-f0-9]{40}$/;
const WORK=/^[a-zA-Z][a-zA-Z0-9:._/-]{1,159}$/;


/**
 * Read-only CMD task opt-in is stored as an EXACT acceptance criterion in the
 * existing canonical WorkPackage, not inferred from free-text prompts/titles.
 * Only allowlisted read-only commands may appear. This grants no execution.
 */
export function recognizedCanonicalCommandId(criteria: readonly string[]): SafeCommandId | null {
  const matches=criteria.filter(x=>x.startsWith("BLUEPRINT_CMD_READONLY:"));
  if (matches.length!==1) return null;
  const id=matches[0]!.slice("BLUEPRINT_CMD_READONLY:".length);
  return Object.hasOwn(registeredReadOnlyCommands,id)?id as SafeCommandId:null;
}

/**
 * Resolve the SAME canonical task that the readiness projection selected.
 * A duplicate title must never switch the selected WorkPackage.
 * continue-work is selected by lowest canonical ID among non-completed tasks;
 * unblock-work uses the exact blocked WorkPackage ID from the snapshot.
 */
export function resolveCanonicalNextWork<T extends {
  readonly id: string; readonly title: string; readonly status: string;
  readonly purpose: string; readonly acceptanceCriteria: readonly string[];
  readonly meta: Readonly<{recordVersion: number}>;
}>(
  next: Readonly<{
    kind: string; label: string; blockedWorkId: string | null;
  }>,
  works: readonly T[]
): T | null {
  if (next.kind==="continue-work") {
    const target=works.filter(work=>work.status!=="completed")
      .sort((a,b)=>a.id.localeCompare(b.id))[0];
    return target && next.label==="Continue: "+target.title ? target : null;
  }
  if (next.kind==="unblock-work" && next.blockedWorkId) {
    const target=works.find(work=>work.id===next.blockedWorkId);
    return target && next.label==="Unblock: "+target.title ? target : null;
  }
  return null;
}

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
        verifiedCommandTask.taskPlanRecordVersion!==input.workPackageRecordVersion ||
        verifiedCommandTask.approvedPlanSource!=="canonical-work-package-readonly-marker" ||
        !WORK.test(verifiedCommandTask.workPackageId) ||
        !Number.isSafeInteger(verifiedCommandTask.taskPlanRecordVersion) ||
        verifiedCommandTask.taskPlanRecordVersion < 1 ||
        !Object.hasOwn(registeredReadOnlyCommands,verifiedCommandTask.commandId) ||
        recognizedCanonicalCommandId(input.workPackageAcceptanceCriteria ?? []) !== verifiedCommandTask.commandId) {
      throw new TypeError("CMD plan is not trusted, current and canonically bound");
    }
    mode="needs-cmd-result";
    command=Object.freeze({
      workPackageId:verifiedCommandTask.workPackageId,
      workPackageRecordVersion:verifiedCommandTask.taskPlanRecordVersion,
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
    if (!SHA.test(sha)) return {accepted:false,status:"REJECTED",observations:["Git HEAD không phải SHA-40 hợp lệ."],mayCloseQualityGate:false};
    observations.push("Chuỗi có hình thức Git SHA-40; chưa xác thực nguồn chạy.");
  } else if (command.commandId==="git-status") {
    if (!/^##(?:\s|$)/.test(output.trimStart()))
      return {accepted:false,status:"REJECTED",observations:["Đầu ra không giống git status --short --branch."],mayCloseQualityGate:false};
    observations.push("Có dòng trạng thái Git được cung cấp; chưa xác minh máy nguồn.");
  } else {
    if (!/^v\d+\.\d+\.\d+$/.test(output.trim()))
      return {accepted:false,status:"REJECTED",observations:["Kết quả Node không đúng phiên bản semver."],mayCloseQualityGate:false};
    observations.push("Có phiên bản Node trong kết quả; chưa xác minh máy nguồn.");
  }
  return {accepted:true,status:"UNVERIFIED_MANUAL_OUTPUT",observations,mayCloseQualityGate:false};
}
