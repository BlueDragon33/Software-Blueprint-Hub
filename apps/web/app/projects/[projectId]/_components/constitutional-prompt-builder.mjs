/** Reviewed prompt text only; never creates WorkPackages or grants release authority. */
const PROJECT = /^project:[a-z0-9][a-z0-9-]{0,158}$/;
const STATES = new Set(["ready", "blocked", "complete", "unverified"]);

/** Standard, project-neutral preference controls. These are requests, not gate authority. */
export const CONSTITUTIONAL_SUPPORT_DIRECTIONS = Object.freeze([
  Object.freeze({
    id: "p0-first",
    label: "Chưa nghiệm thu — xử lý hết P0 trước",
    instruction: "Prioritize verifiable P0 defects and blocked mandatory gates; keep human acceptance PENDING until evidence exists."
  }),
  Object.freeze({
    id: "provisional-layout",
    label: "Tạm chấp nhận bố cục hiện tại, vẫn yêu cầu khép kín P0",
    instruction: "Treat the current layout as provisional, not human UX acceptance; complete mandatory P0 gates before advancing."
  }),
  Object.freeze({
    id: "p1-after-p0",
    label: "Ưu tiên độ chân thực P1 sau khi P0 được xác minh",
    instruction: "Improve P1 visual fidelity only after actual P0 acceptance has been independently verified; do not infer P0 PASS."
  })
]);

export function buildConstitutionalNextPrompt(view, requirements = "", direction = "p0-first") {
  if (!view || typeof view !== "object" || !PROJECT.test(view.projectId)
    || typeof view.projectName !== "string" || !view.projectName.trim()
    || typeof view.sourceRevision !== "string" || !view.sourceRevision.trim()
    || view.sourceRevision.length > 256 || !STATES.has(view.state)
    || typeof requirements !== "string" || requirements.length > 2000) return null;
  const choice = CONSTITUTIONAL_SUPPORT_DIRECTIONS.find(item => item.id === direction);
  if (!choice) return null;
  const workId = typeof view.workPackageId === "string" && view.workPackageId.trim()
    ? view.workPackageId : "UNVERIFIED — do not invent a work item";
  const reason = typeof view.reason === "string" && view.reason.trim()
    ? view.reason : "No verified reason supplied; review canonical WorkPackage and QualityGate.";
  const note = requirements.trim();
  const next = view.state === "ready"
    ? "Inspect the selected READY WorkPackage and its dependencies and evidence before proposing implementation."
    : view.state === "blocked"
      ? "Diagnose the actual blockers and prepare a minimal, testable remediation; do not claim READY."
      : "Reconcile current canonical work and gates; do not infer execution or completion.";
  return [
    "ACTIVE NEXT ACTION — BLUEPRINT OS | REVIEWED PROMPT DRAFT",
    "Check the live ACTIVE Constitution and exact source HEAD before making changes.",
    `Project: ${view.projectName} (${view.projectId})`,
    `Observed canonical source revision: ${view.sourceRevision}`,
    `Current WorkPackage: ${workId}`,
    `Observed status: ${view.state}`,
    `Reason: ${reason}`,
    `Next scope: ${next}`,
    `USER DIRECTION (preference, not authority): ${choice.label}`,
    `Direction constraints: ${choice.instruction}`,
    note ? `Additional requirements (user supplied, not authority):\n${note}` : "Additional requirements: none",
    "Preserve least privilege, provenance, ZERO-SPEND and independent QA/human gates.",
    "Do not invent Agent telemetry, mark gates PASS, merge, ratify or publish from this draft.",
    "Do not write canonical state without a separate authorized action and fresh checks.",
    "Return one evidence-backed result, blockers, exact SHA and the next safe action."
  ].join("\n");
}
