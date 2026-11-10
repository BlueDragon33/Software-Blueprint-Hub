/**
 * Universal Active Next Action v1 — derived, project-scoped prompt proposal.
 * No persistence, no GitHub action, no canonical gate mutation, no release authority.
 * The caller must load a PROJECT_READ-authorized canonical state. User-edited
 * prompt text is an untrusted handoff, never an authorization token.
 */
export const UANA_VERSION = "uana:v1.0" as const;
export type UanaWorkStatus = "planned" | "blocked" | "ready" | "in-progress" | "testing" | "review" | "completed" | "archived";
export type UanaGateStatus = "not-ready" | "candidate" | "pass" | "fail";
export type UanaChoiceId = "inspect" | "continue" | "extend";
export interface UanaWorkRef {
  readonly projectId: string;
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly dependencies: readonly string[];
  readonly qualityGateIds: readonly string[];
}
export interface UanaGateRef {
  readonly projectId: string;
  readonly id: string;
  readonly name: string;
  readonly status: string;
  /** True only when all required evidence IDs have authentic gate-bound provenance. */
  readonly evidenceComplete: boolean;
}
export interface UanaSource {
  readonly projectId: string;
  readonly projectName: string;
  readonly constitutionVersion: string;
  readonly sourceRevision: string;
  readonly projectionRevision: string;
  readonly projectionId: string;
  readonly repository?: string;
  readonly headSha?: string;
  readonly checkpointRef?: string;
  readonly workPackages: readonly UanaWorkRef[];
  readonly gates: readonly UanaGateRef[];
  readonly requiredGateIds: readonly string[];
}
export interface UanaOption {
  readonly id: UanaChoiceId;
  readonly projectId: string;
  readonly title: string;
  readonly description: string;
  readonly objective: string;
  readonly recommended: boolean;
  readonly workPackageId: string;
  readonly isReviewOnly: boolean;
}
export interface UanaProposal {
  readonly schemaVersion: typeof UANA_VERSION;
  readonly context: Readonly<Pick<UanaSource, "projectId" | "projectName" |
    "constitutionVersion" | "sourceRevision" | "projectionId"> & {
    readonly repository: string | null;
    readonly headSha: string | null;
    readonly checkpointRef: string;
  }>;
  readonly options: readonly UanaOption[];
  readonly recommendedId: UanaChoiceId;
  readonly candidateOnly: true;
  readonly requiresOwnerSend: true;
  readonly qualityGatePassed: false;
  readonly productionAuthorized: false;
  readonly derivedNotCanonical: true;
}

const SHA_256 = /^sha256:[a-f0-9]{64}$/;
const GIT_SHA = /^[a-f0-9]{40}$/;
const PROJECT = /^project:[A-Za-z0-9_.:-]{2,110}$/;
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SAFE = /^[^\r\n\x00-\x1f]{1,300}$/;
const WORK_STATUSES = new Set<UanaWorkStatus>(["planned","blocked","ready","in-progress","testing","review","completed","archived"]);
const GATE_STATUSES = new Set<UanaGateStatus>(["not-ready","candidate","pass","fail"]);
function assert(ok: unknown, message: string): asserts ok {
  if (!ok) throw new TypeError("UANA_BLOCKED: " + message);
}
function safe(value: unknown, max = 300): value is string {
  return typeof value === "string" && value.trim().length > 0 &&
    value.length <= max && SAFE.test(value);
}
function validWork(w: UanaWorkRef): boolean {
  return PROJECT.test(w?.projectId) && safe(w?.id, 120) && safe(w?.title, 200) &&
    WORK_STATUSES.has(w.status as UanaWorkStatus) &&
    Array.isArray(w.dependencies) && w.dependencies.length <= 60 &&
    w.dependencies.every(dep => safe(dep, 120)) &&
    Array.isArray(w.qualityGateIds) && w.qualityGateIds.length <= 100 &&
    w.qualityGateIds.every(id => safe(id,120));
}
function validGate(g: UanaGateRef): boolean {
  return PROJECT.test(g?.projectId) && safe(g?.id, 120) && safe(g?.name, 200) &&
    GATE_STATUSES.has(g.status as UanaGateStatus) && typeof g.evidenceComplete === "boolean";
}
function normalizedStatus(value: string): string { return value.toLowerCase(); }
function nextWork(work: readonly UanaWorkRef[]): UanaWorkRef | null {
  const outstanding = work.filter(w => !["completed", "archived"].includes(normalizedStatus(w.status)));
  const priorities = ["blocked", "in-progress", "testing", "review", "ready", "planned"];
  return [...outstanding].sort((a, b) =>
    (priorities.indexOf(normalizedStatus(a.status)) < 0 ? 9 : priorities.indexOf(normalizedStatus(a.status))) -
    (priorities.indexOf(normalizedStatus(b.status)) < 0 ? 9 : priorities.indexOf(normalizedStatus(b.status))) ||
    a.id.localeCompare(b.id))[0] ?? null;
}

export function createUanaProposal(source: UanaSource): UanaProposal | null {
  assert(source && typeof source === "object", "canonical source required");
  assert(PROJECT.test(source.projectId), "canonical project identity required");
  assert(safe(source.projectName, 150), "project name required");
  assert(/^\d+\.\d+\.\d+$/.test(source.constitutionVersion), "published constitution version required");
  assert(SHA_256.test(source.sourceRevision), "exact canonical source revision required");
  assert(source.sourceRevision === source.projectionRevision, "stale prompt projection");
  assert(safe(source.projectionId, 150), "prompt projection id required");
  assert(source.repository === undefined || REPO.test(source.repository), "verified repository or omit");
  assert(source.headSha === undefined || GIT_SHA.test(source.headSha), "verified Git HEAD or omit");
  assert(source.checkpointRef === undefined || safe(source.checkpointRef, 300), "checkpoint must be source-bound");
  assert(Array.isArray(source.workPackages) && source.workPackages.length <= 250 &&
    source.workPackages.every(validWork), "bounded canonical work packages required");
  assert(source.workPackages.every(w => w.projectId === source.projectId),
    "cross-project Work Package blocked");
  assert(Array.isArray(source.gates) && source.gates.length <= 250 &&
    source.gates.every(validGate), "bounded canonical quality gates required");
  assert(source.gates.every(g => g.projectId === source.projectId),
    "cross-project Quality Gate blocked");
  assert(Array.isArray(source.requiredGateIds) && source.requiredGateIds.length <= 250 &&
    source.requiredGateIds.every(id => safe(id,120)) &&
    new Set(source.requiredGateIds).size === source.requiredGateIds.length,
    "canonical required gate list missing or invalid");
  assert(new Set(source.workPackages.map(w => w.id)).size === source.workPackages.length,
    "duplicate Work Package IDs");
  assert(new Set(source.gates.map(g => g.id)).size === source.gates.length,
    "duplicate Gate IDs");
  const active = nextWork(source.workPackages);
  if (!active) return null; // Don't invent a next action if canonical work is all complete/absent.
  const blocked = normalizedStatus(active.status) === "blocked";
  const gateById = new Map(source.gates.map(g => [g.id,g] as const));
  const workById = new Map(source.workPackages.map(w => [w.id,w] as const));
  const knownGateIds = new Set([...source.requiredGateIds,...active.qualityGateIds]);
  const unknownRequired = [...knownGateIds].some(id => {
    const gate = gateById.get(id);
    return gate?.status !== "pass" || gate.evidenceComplete !== true;
  });
  const unfinishedDependency = active.dependencies.some(id =>
    workById.get(id)?.status !== "completed");
  const gateIssues = source.gates.filter(g => normalizedStatus(g.status) !== "pass" ||
    g.evidenceComplete !== true);
  const gated = blocked || gateIssues.length > 0 || unknownRequired || unfinishedDependency ||
    (source.requiredGateIds.length === 0 && source.gates.length === 0);
  const options: UanaOption[] = [
    Object.freeze({id: "inspect", projectId: source.projectId, workPackageId: active.id,
      title: "A — Kiểm tra và giữ nguyên phạm vi",
      description: "Đọc lại bằng chứng, phụ thuộc và Quality Gates trước khi thay đổi.",
      objective: "Kiểm tra trạng thái thực tế và các blocker của " + active.id,
      recommended: false, isReviewOnly: true}),
    Object.freeze({id: "continue", projectId: source.projectId, workPackageId: active.id,
      title: gated ? "B — Gỡ chặn bằng chứng (khuyến nghị)" : "B — Tiếp tục Work Package (khuyến nghị)",
      description: gated ? "Tập trung xử lý Quality Gate/BLOCKED; không triển khai qua gate." :
        "Triển khai bước còn lại trong Work Package với kiểm thử và review.",
      objective: (gated ? "Làm rõ và gỡ chặn " : "Tiếp tục ") + active.id +
        " — " + active.title,
      recommended: true, isReviewOnly: gated})
  ];
  if (!gated) {
    options.push(Object.freeze({id:"extend",projectId:source.projectId,workPackageId:active.id,
      title:"C — Thẩm định mở rộng dài hạn",
      description:"Đánh giá phạm vi lớn hơn, chỉ đề xuất thay đổi sau khi được duyệt.",
      objective:"Thẩm định phương án mở rộng từ " + active.id + " mà không tự mở rộng scope",
      recommended:false,isReviewOnly:true}));
  }
  return Object.freeze({
    schemaVersion:UANA_VERSION,
    context:Object.freeze({
      projectId:source.projectId,projectName:source.projectName,
      constitutionVersion:source.constitutionVersion,
      sourceRevision:source.sourceRevision,projectionId:source.projectionId,
      repository:source.repository ?? null,headSha:source.headSha ?? null,
      checkpointRef:source.checkpointRef ?? ("prompt-projection:" + source.projectionId)
    }),
    options:Object.freeze(options),
    recommendedId:"continue",candidateOnly:true,requiresOwnerSend:true,
    qualityGatePassed:false,productionAuthorized:false,derivedNotCanonical:true
  });
}

export function renderUanaDraft(proposal: UanaProposal, selectedId: UanaChoiceId): string {
  assert(proposal?.schemaVersion === UANA_VERSION && proposal.candidateOnly &&
    proposal.derivedNotCanonical && !proposal.productionAuthorized &&
    !proposal.qualityGatePassed, "untrusted or authoritative proposal");
  const option = proposal.options.find(o => o.id === selectedId);
  assert(option && option.projectId === proposal.context.projectId,
    "option must belong to current project");
  const c = proposal.context;
  return [
    "ACTIVE NEXT ACTION — " + c.projectName + " | UANA v1.0",
    "",
    "Project ID: " + c.projectId,
    "Hiến pháp tham chiếu: Blueprint OS " + c.constitutionVersion +
      " (xác minh bản thực sự đang publish trước thực thi)",
    "Canonical source revision: " + c.sourceRevision,
    "Prompt Projection: " + c.projectionId,
    "Repository: " + (c.repository ?? "CHƯA XÁC MINH — không suy đoán"),
    "Git HEAD: " + (c.headSha ?? "CHƯA XÁC MINH — cần đọc lại trước sửa"),
    "Checkpoint: " + c.checkpointRef,
    "",
    "OWNER CHỌN: " + option.title,
    "Work Package: " + option.workPackageId,
    "Mục tiêu: " + option.objective,
    "Giới hạn: " + (option.isReviewOnly ? "CHỈ KIỂM TRA/ĐỀ XUẤT; chờ gate" : "Chỉ thực hiện phần được cấp quyền"),
    "",
    "NHIỆM VỤ:",
    "1. Xác minh lại đúng projectId, Work Package, checkpoint, source revision và Git HEAD.",
    "2. Không lặp các bước đã PASS. Kiểm tra phụ thuộc, Quality Gates, quyền và dữ liệu nguồn.",
    "3. Thực hiện đúng phạm vi được phép; phân loại PASS/FAIL/BLOCKED/NOT_RUN bằng bằng chứng.",
    "4. Review và readback; ghi checkpoint và đề xuất một Active Next Action kế tiếp.",
    "",
    "RANH GIỚI: Prompt này là bản handoff có thể chỉnh sửa, không phải chứng nhận,",
    "không cấp quyền Owner/ProjectAuthority, không ký PASS, không tự merge/deploy Production.",
    "FREE-only; không tạo hệ thống điều phối, database hay nguồn sự thật thứ hai.",
    "Nếu prompt cũ hoặc dữ liệu không xác minh được, FAIL CLOSED.",
    ""
  ].join("\n");
}
