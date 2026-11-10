"use server";

import { revalidatePath } from "next/cache";

import { resolveWebActor } from "../../../../src/auth/server-actor";
import { getBlueprintServerRuntime } from "../../../../src/server/runtime";
import { loadProjectWorkspace } from "../../../../src/server/project-workspace";

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

/**
 * UANA is an editable prompt and never an authorization capability.
 * Verify current PROJECT_READ authority + exact canonical revision immediately
 * before offering a derived draft to the clipboard. It does not send a chat turn.
 */
export async function verifyUanaSourceForCopyAction(
  projectId: string,
  expectedSourceRevision: string,
  expectedProjectionId: string
): Promise<Readonly<{ ok: boolean; message: string }>> {
  if (!/^project:[A-Za-z0-9_.:-]{2,110}$/.test(projectId) ||
      !/^sha256:[a-f0-9]{64}$/.test(expectedSourceRevision) ||
      typeof expectedProjectionId !== "string" ||
      expectedProjectionId.length < 1 || expectedProjectionId.length > 150) {
    return {ok:false,message:"Dữ liệu đề xuất không hợp lệ. Hãy tải lại Prompt Workspace."};
  }
  try {
    const workspace = await loadProjectWorkspace(projectId);
    if (workspace.state !== "ready" || workspace.projectId !== projectId)
      return {ok:false,message:"Không có quyền đọc trạng thái dự án hoặc phiên đăng nhập đã hết hạn."};
    const [actual, page] = await Promise.all([
      workspace.runtime.prompts.currentSourceRevisionFromProfile(
        workspace.actor, workspace.projectId, workspace.project
      ),
      workspace.runtime.prompts.historyPage(workspace.actor, workspace.projectId, 1)
    ]);
    if (actual !== expectedSourceRevision ||
        page.latest?.id !== expectedProjectionId ||
        page.latest.sourceRevision !== actual)
      return {ok:false,message:"Checkpoint hoặc Prompt Projection đã thay đổi. Hãy tải lại trang và xem xét lại gợi ý."};
    return {ok:true,message:"Nguồn vẫn trùng khớp. Đây không phải phê duyệt thực thi hoặc Quality Gate PASS."};
  } catch {
    return {ok:false,message:"Không xác minh được nguồn theo quyền dự án hiện tại. Dừng an toàn."};
  }
}
