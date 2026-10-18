// Blueprint OS 1.3.0 R16-R20: structural candidate contract for MANAGED handoffs.
// Not a ChatGPT host-UI hook and not constitutional ratification.
export const NEXT_ACTION_LABEL = "Hỗ trợ / Next Action";
const SHA = /^[a-f0-9]{40}$/i;
const fail = (why) => { throw Error("NEXT_ACTION_HANDOFF_BLOCKED: " + why); };
const isObject = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const hasKeys = (x, keys) => isObject(x) &&
  Object.keys(x).sort().join("|") === [...keys].sort().join("|");
const validText = (s, min, max) => typeof s === "string" &&
  s.length >= min && s.length <= max && s.trim() === s &&
  !/[\u0000-\u001f\u007f]/.test(s);
const authKeys = ["autoApprove", "merge", "publish", "ratify", "d1ShutdownAccepted"];

/**
 * Contract covers the handoff emitter under Blueprint OS ownership.
 * A present descriptor is not evidence that the ChatGPT client rendered
 * a button; only a real UI/browser observation can establish that.
 */
export function validateManagedNextAction(handoff) {
  if (!hasKeys(handoff, ["schema", "scope", "repository", "sourceSha", "state",
    "mode", "actions", "fallbackPrompt", "authority"])) fail("unexpected/missing envelope fields");
  if (handoff.schema !== "blueprint-next-action-handoff/v1" ||
    handoff.scope !== "blueprint-workflow" ||
    !validText(handoff.repository, 3, 150) ||
    !SHA.test(handoff.sourceSha) ||
    !validText(handoff.state, 4, 240)) fail("scope or freshness");
  if (handoff.mode !== "interactive" && handoff.mode !== "text-fallback") fail("render mode");
  if (!Array.isArray(handoff.actions) || handoff.actions.length !== 1) fail("exactly one executable next action");
  const action = handoff.actions[0];
  if (!hasKeys(action, ["id", "label", "kind", "query", "button"])) fail("action fields");
  if (action.id !== "blueprint-next-action" ||
    action.label !== NEXT_ACTION_LABEL ||
    action.kind !== "issue-next-turn" ||
    !validText(action.query, 15, 3000)) fail("action must be actionable");
  if (handoff.fallbackPrompt !== action.query) fail("fallback must repeat exact action");
  if (handoff.mode === "interactive") {
    if (!hasKeys(action.button, ["component", "enabled", "actionId"]) ||
      action.button.component !== "button" || action.button.enabled !== true ||
      action.button.actionId !== action.id) fail("interactive control missing or inert");
  } else if (action.button !== null) fail("text-only surface must not claim a rendered button");
  if (!hasKeys(handoff.authority, authKeys) ||
    authKeys.some((key) => handoff.authority[key] !== false)) fail("self-granted authority");
  return Object.freeze({
    valid: true, actionCount: 1, label: NEXT_ACTION_LABEL,
    outputContract: "VALIDATED_DESIGN_ONLY", controlRendered: "UNVERIFIED",
    releaseAuthorized: false, ownerUXAccepted: false
  });
}

export function composeManagedNextAction({
  repository, sourceSha, state, query, interactiveSupported = true
}) {
  const action = {
    id: "blueprint-next-action", label: NEXT_ACTION_LABEL,
    kind: "issue-next-turn", query,
    button: interactiveSupported
      ? { component: "button", enabled: true, actionId: "blueprint-next-action" }
      : null
  };
  const handoff = {
    schema: "blueprint-next-action-handoff/v1", scope: "blueprint-workflow",
    repository, sourceSha, state,
    mode: interactiveSupported ? "interactive" : "text-fallback",
    actions: [action], fallbackPrompt: query,
    authority: {
      autoApprove: false, merge: false, publish: false,
      ratify: false, d1ShutdownAccepted: false
    }
  };
  validateManagedNextAction(handoff);
  return handoff;
}
