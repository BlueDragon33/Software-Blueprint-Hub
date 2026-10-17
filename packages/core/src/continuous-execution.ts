import type { WorkPackage, QualityGate } from "@blueprint-os/contracts";

/**
 * Read-only engineering readiness. Canonical records are supplied only by a
 * server adapter after PROJECT_READ; this function never grants execution.
 * A signed issuer/workflow grant and re-check at POST are separate capabilities.
 */
export interface ContinuousProjectSnapshot {
  readonly projectId: string;
  readonly profileVersion: number;
  readonly canonicalRevision: string | null;
  readonly appHead: string | null;
  readonly canMutate: boolean;
  readonly requiredGateIds: readonly string[];
  readonly workPackages: readonly WorkPackage[];
  readonly gates: readonly QualityGate[];
}

export interface ContinuousExecutionAssessment {
  readonly state: "UNVERIFIED" | "BLOCKED" | "READ_ONLY" | "READY_WORK_FOUND";
  readonly nextWorkId: string | null;
  readonly nextWorkTitle: string | null;
  readonly reasons: readonly string[];
  readonly preflightEvidenceReady: boolean;
  readonly canDispatch: false;
}

const sha = (value: string | null): boolean =>
  typeof value === "string" && /^[a-f0-9]{40}$/.test(value);

export function assessCanonicalContinuousReadiness(
  input: ContinuousProjectSnapshot
): ContinuousExecutionAssessment {
  const reasons: string[] = [];
  const finish = (
    state: ContinuousExecutionAssessment["state"],
    work: WorkPackage | null = null
  ): ContinuousExecutionAssessment => Object.freeze({
    state, nextWorkId: work?.id ?? null, nextWorkTitle: work?.title ?? null,
    reasons: Object.freeze([...reasons]),
    preflightEvidenceReady: false,
    canDispatch: false as const
  });

  if (!/^project:[a-z][a-z0-9-]+$/.test(input.projectId) ||
      !Number.isInteger(input.profileVersion) || input.profileVersion < 1 ||
      !input.canonicalRevision?.trim() || !sha(input.appHead)) {
    reasons.push("Canonical project revision or verified repository HEAD is missing.");
    return finish("UNVERIFIED");
  }
  const workById = new Map<string, WorkPackage>();
  const gateById = new Map<string, QualityGate>();
  for (const w of input.workPackages) {
    if (w.projectId !== input.projectId || workById.has(w.id)) {
      reasons.push("Work identity is duplicated or belongs to a different project.");
      return finish("UNVERIFIED");
    }
    workById.set(w.id, w);
  }
  for (const g of input.gates) {
    if (g.projectId !== input.projectId || gateById.has(g.id)) {
      reasons.push("Gate identity is duplicated or belongs to a different project.");
      return finish("UNVERIFIED");
    }
    gateById.set(g.id, g);
  }
  for (const w of input.workPackages) {
    if (w.dependencies.some(dep => dep === w.id || !workById.has(dep))) {
      reasons.push("Work dependency is missing or self-referential.");
      return finish("UNVERIFIED");
    }
  }
  const visiting = new Set<string>(), visited = new Set<string>();
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return false;
    if (visited.has(id)) return true;
    visiting.add(id);
    for (const dep of workById.get(id)?.dependencies ?? []) {
      if (!visit(dep)) return false;
    }
    visiting.delete(id);
    visited.add(id);
    return true;
  };
  if ([...workById.keys()].some(id => !visit(id))) {
    reasons.push("Cyclic work dependencies must be repaired.");
    return finish("UNVERIFIED");
  }
  // A missing gate is a real blocker, not permission to invent PASS.
  for (const id of input.requiredGateIds) {
    if (!gateById.has(id)) reasons.push("Required gate is missing: " + id);
  }
  for (const gate of gateById.values()) {
    if (gate.status === "fail") reasons.push("Recorded gate failed: " + gate.id);
    if (gate.status === "pass" && gate.evidenceIds.length === 0)
      reasons.push("Gate claims PASS without linked evidence: " + gate.id);
  }
  if (reasons.length) return finish("BLOCKED");
  if (!input.canMutate) {
    reasons.push("PROJECT_READ does not imply permission to change or execute work.");
    return finish("READ_ONLY");
  }
  const ready = input.workPackages
    .filter(w => w.status === "ready" &&
      w.acceptanceCriteria.length > 0 &&
      w.dependencies.every(dep => workById.get(dep)?.status === "completed") &&
      w.qualityGateIds.every(id => gateById.has(id) &&
        gateById.get(id)?.status !== "fail"))
    .sort((a,b) => a.id.localeCompare(b.id));
  if (!ready.length) {
    reasons.push("No dependency-satisfied canonical READY work exists.");
    return finish("BLOCKED");
  }
  // No automatic dispatch: an independently verified signed execution grant,
  // explicit owner adoption, trusted runner and POST-side readback are absent.
  reasons.push("Signed execution grant and live runner authorization remain separate.");
  return finish("READY_WORK_FOUND", ready[0]);
}


export interface ContinuousRecoveryAction {
  readonly id: string;
  readonly kind: "automatic-readback" | "human-confirm-gate" | "human-review" | "authority-grant" | "prepare-work";
  readonly label: string;
  readonly explanation: string;
  readonly requiresConfirmation: boolean;
  readonly canChangeCanonicalState: boolean;
}

/**
 * Real next-step recovery guidance only; never raises a gate to PASS.
 * Automatic source readback is a bounded, non-mutating retry of trusted reads.
 * Mutating repair is only available through an explicit PROJECT_MUTATE action.
 */
export function planContinuousRecovery(
  source: ContinuousProjectSnapshot,
  result: ContinuousExecutionAssessment
): readonly ContinuousRecoveryAction[] {
  const actions: ContinuousRecoveryAction[] = [];
  const append = (item: ContinuousRecoveryAction): void => { actions.push(Object.freeze(item)); };
  if (result.state === "UNVERIFIED") {
    append({id:"source-readback",kind:"automatic-readback",
      label:"Tự kiểm tra lại nguồn dự án",
      explanation:"Đọc lại Project Profile, revision và GitHub HEAD từ máy chủ có xác thực. Không tạo dữ liệu hoặc quyền giả.",
      requiresConfirmation:false,canChangeCanonicalState:false});
    return Object.freeze(actions);
  }
  if (result.state === "READ_ONLY") {
    append({id:"request-project-role",kind:"human-review",
      label:"Yêu cầu người quản trị dự án cấp quyền phù hợp",
      explanation:"Chỉ PROJECT_READ không cho phép sửa hồ sơ hoặc thực thi.",
      requiresConfirmation:true,canChangeCanonicalState:false});
    return Object.freeze(actions);
  }
  const existing = new Set(source.gates.map(g => g.id));
  for (const gateId of [...new Set(source.requiredGateIds)].filter(id=>!existing.has(id))) {
    append({id:gateId,kind:"human-confirm-gate",
      label:"Xác nhận tạo hồ sơ Gate còn thiếu: "+gateId,
      explanation:"Chỉ tạo hồ sơ NOT_READY bằng tiêu chí thật do người có quyền nhập; không PASS hoặc cấp quyền thực thi.",
      requiresConfirmation:true,canChangeCanonicalState:true});
  }
  for (const gate of source.gates.filter(g=>g.status==="fail" ||
      (g.status==="pass" && gateEvidenceIsMissing(gate)))) {
    append({id:gate.id,kind:"human-review",
      label:"Kiểm tra lại Gate: "+gate.name,
      explanation:"Phải khắc phục bằng chứng/đánh giá theo Project Authority và reviewer độc lập.",
      requiresConfirmation:true,canChangeCanonicalState:false});
  }
  if (result.state==="READY_WORK_FOUND") {
    append({id:result.nextWorkId ?? "next-work",kind:"authority-grant",
      label:"Xác thực workflow, issuer và quyền thực thi",
      explanation:"Nhiệm vụ kỹ thuật READY chưa phải signed grant; không thể tự cấp quyền hoặc khởi chạy.",
      requiresConfirmation:true,canChangeCanonicalState:false});
  } else if (!actions.length) {
    append({id:"work-graph",kind:"prepare-work",
      label:"Chuẩn bị Work Package đủ điều kiện READY",
      explanation:"Hoàn thiện phụ thuộc, tiêu chí chấp nhận và Quality Gate trong hồ sơ chuẩn.",
      requiresConfirmation:true,canChangeCanonicalState:false});
  }
  return Object.freeze(actions);
}

function gateEvidenceIsMissing(gate: QualityGate): boolean {
  return gate.evidenceIds.length===0;
}
