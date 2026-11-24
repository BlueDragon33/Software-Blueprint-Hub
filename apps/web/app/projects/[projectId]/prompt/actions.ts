"use server";

import type { WorkPackage } from "@blueprint-os/contracts";
import { prepareNextActionIntake } from "../../../../../../packages/application/src/next-action-intake.candidate.mjs";

import { revalidatePath } from "next/cache";

import { resolveWebActor } from "../../../../src/auth/server-actor";
import { getBlueprintServerRuntime } from "../../../../src/server/runtime";

export type PromptRegenerationResult =
  | Readonly<{ ok: true; projectionId: string }>
  | Readonly<{ ok: false; message: string }>;

export async function regeneratePromptAction(
  projectId: string
): Promise<PromptRegenerationResult> {
  const actor = await resolveWebActor();
  if (!actor) {
    return Object.freeze({
      ok: false,
      message: "Sign in before generating a canonical Prompt Projection."
    });
  }

  try {
    const runtime = getBlueprintServerRuntime();
    const projection = await runtime.prompts.generateAndRecord(actor, projectId);
    revalidatePath(
      `/projects/${encodeURIComponent(projectId)}/prompt`
    );
    return Object.freeze({ ok: true, projectionId: projection.id });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The trusted server could not generate the Prompt Projection.";
    return Object.freeze({ ok: false, message });
  }
}

/** Canonical Next Action intake. Only authenticated PROJECT_MUTATE may create.
 * Approval here is approval to save a PLANNED work item, NOT an Agent execution token.
 */
export type NextActionSubmission = Readonly<{
  projectId: string;
  requestId: string;
  sourceRevision: string;
  kind: "addition" | "other";
  content: string;
  selectedWorkPackageId: string | null;
}>;

export type NextActionSaveResult =
  | Readonly<{ ok: true; mode: "navigate" | "saved"; workPackageId: string | null; status: "planned" | "unchanged" }>
  | Readonly<{ ok: false; message: string }>;

export async function saveReviewedNextActionAction(input: NextActionSubmission): Promise<NextActionSaveResult> {
  const actor = await resolveWebActor();
  if (!actor) return { ok: false, message: "Cần đăng nhập để duyệt nhiệm vụ trong Workspace." };
  if (!input || typeof input.projectId !== "string") return { ok: false, message: "Thông tin dự án không hợp lệ." };
  try {
    const runtime = getBlueprintServerRuntime();
    const project = await runtime.profiles.read(actor, input.projectId);
    if (!project) return { ok: false, message: "Không tìm thấy dự án hoặc chưa có quyền truy cập." };
    const [currentSourceRevision, existingWorkPackages] = await Promise.all([
      runtime.prompts.currentSourceRevisionFromProfile(actor, input.projectId, project),
      runtime.workQuality.listWorkPackages(actor, input.projectId)
    ]);
    const plan = prepareNextActionIntake(input, {
      authorizedProjectId: input.projectId, currentSourceRevision, existingWorkPackages,
      now: new Date().toISOString()
    });
    if (plan.kind === "navigate") return { ok: true, mode: "navigate", workPackageId: null, status: "unchanged" };
    if (plan.kind === "already-saved") return { ok: true, mode: "saved", workPackageId: plan.workPackageId, status: "planned" };
    const record: WorkPackage = {
      ...plan.workPackage,
      dependencies: [...plan.workPackage.dependencies],
      acceptanceCriteria: [plan.workPackage.acceptanceCriteria[0], ...plan.workPackage.acceptanceCriteria.slice(1)],
      qualityGateIds: [...plan.workPackage.qualityGateIds],
      meta: { ...plan.workPackage.meta }
    };
    try {
      await runtime.workQuality.createWorkPackage(actor, record);
    } catch (writeError) {
      // One bounded idempotency readback. Never ignore unrelated write failures.
      const reread = await runtime.workQuality.listWorkPackages(actor, input.projectId);
      const replay = prepareNextActionIntake(input, {
        authorizedProjectId: input.projectId,
        currentSourceRevision: await runtime.prompts.currentSourceRevisionFromProfile(actor, input.projectId, project),
        existingWorkPackages: reread, now: new Date().toISOString()
      });
      if (replay.kind !== "already-saved" || replay.workPackageId !== record.id) throw writeError;
    }
    const base = "/projects/" + encodeURIComponent(input.projectId);
    revalidatePath(base);
    revalidatePath(base + "/prompt");
    return { ok: true, mode: "saved", workPackageId: record.id, status: "planned" };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    if (reason.includes("stale source revision")) return { ok: false, message: "Dữ liệu đã thay đổi. Tải lại Workspace để duyệt đúng phiên bản." };
    if (reason.includes("request id conflict")) return { ok: false, message: "Mã yêu cầu đã được sử dụng cho nội dung khác. Vui lòng xem lại trước khi gửi." };
    if (reason.includes("unknown selected work")) return { ok: false, message: "Công việc gốc không còn hợp lệ. Tải lại Workspace." };
    return { ok: false, message: "Không thể ghi Work Package bằng quyền và nguồn hiện tại. Chưa chạy Agent hoặc thay đổi Gate." };
  }
}
