import type { ProjectReadinessSnapshot } from "@blueprint-os/core";

type CanonicalNextAction = Pick<ProjectReadinessSnapshot, "projectId" | "nextAction">;

/**
 * Central presentation contract shared by Constitution 1.3.0 projects.
 *
 * This intentionally returns ONLY a project-scoped navigation target, not a
 * "run/approve/publish" command. It is unsafe to infer executable authority
 * from a readiness projection. A Work-mode target requires a real supported
 * host integration proving the session belongs to the same ChatGPT Project;
 * until that capability exists, never synthesize a Work deep link.
 */
export interface UnifiedNextActionPresentation {
  readonly label: "Tiếp tục nhiệm vụ";
  readonly description: string;
  readonly href: string;
  readonly actionKind: CanonicalNextAction["nextAction"]["kind"];
  readonly behavior: "navigate-to-canonical-workspace";
  readonly workHandoff: {
    readonly state: "not-required" | "requires-verified-session";
    readonly href: null;
    readonly reason: string;
  };
  readonly buttonCount: 1;
}

const routeForKind: Record<CanonicalNextAction["nextAction"]["kind"], string> = {
  "define-gate": "quality",
  "resolve-failed-gate": "quality",
  "review-candidate": "quality",
  "prepare-gate": "quality",
  "unblock-work": "roadmap",
  "continue-work": "roadmap",
  "verify-release": "release-orchestration"
};

/** A single action may combine safe subsequent tasks, never bypass their gates. */
export function unifiedNextActionPresentation(
  snapshot: CanonicalNextAction,
  options: Readonly<{ requiresWork?: boolean }> = {}
): UnifiedNextActionPresentation {
  if (!snapshot.projectId.startsWith("project:")) {
    throw new TypeError("Unified Next Action requires a canonical project identity");
  }
  const route = routeForKind[snapshot.nextAction.kind];
  if (!route) throw new TypeError("Unknown canonical Next Action kind");
  return Object.freeze({
    label: "Tiếp tục nhiệm vụ" as const,
    description: snapshot.nextAction.label,
    href: `/projects/${encodeURIComponent(snapshot.projectId)}/${route}`,
    actionKind: snapshot.nextAction.kind,
    behavior: "navigate-to-canonical-workspace" as const,
    workHandoff: Object.freeze({
      state: options.requiresWork ? "requires-verified-session" as const : "not-required" as const,
      href: null,
      reason: options.requiresWork
        ? "Work mode requires a verified same-project host session; a generic Chat URL is not a valid Work handoff."
        : "Continue locally with the project's canonical workflow."
    }),
    buttonCount: 1 as const
  });
}
