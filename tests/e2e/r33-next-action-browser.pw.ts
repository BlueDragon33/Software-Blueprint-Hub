import { encode } from "@auth/core/jwt";
import { createBlueprintServerRuntime, closeBlueprintServerRuntime } from "../../packages/runtime/src";
import { expect, test, type Page } from "@playwright/test";

// Browser → Next.js → Auth.js JWT → PostgreSQL canonical authority.
// These are synthetic QA principals on an isolated database, not human logins.
const baseUrl="http://127.0.0.1:3000";
async function signIn(page:Page,subject:string) {
  const secret=process.env.AUTH_SECRET;
  if(!secret) throw new Error("QA AUTH_SECRET is required");
  const name="authjs.session-token";
  const token=await encode({
    secret,salt:name,token:{
      sub:subject,email:subject+"@example.test",
      blueprintProvider:"github",blueprintProviderSubject:subject
    }
  });
  await page.context().addCookies([{
    name,value:token,url:baseUrl,httpOnly:true,secure:false,sameSite:"Lax"
  }]);
}
const route="/projects/project%3Ap6-registry-beta";

test("synthetic Owner: one-click reads real canonical state without execution",async({page})=>{
  await signIn(page,"p6-e2e-owner");
  await page.goto(route);
  await expect(page.getByRole("heading",{name:/Define required gate/})).toBeVisible();
  await page.getByRole("button",{name:/NEXT ACTION — TỰ LẬP KẾ HOẠCH & KIỂM TRA/}).click();
  const result=page.getByRole("status").filter({hasText:"Trạng thái: READ_ONLY_INSPECTED"});
  await expect(result).toBeVisible();
  await expect(result).toContainText("Phạm vi: Bước hiện hành");
  await expect(result).toContainText("Đã thực hiện");
  await expect(result).toContainText("Chưa thực hiện / chờ điều kiện");
  await expect(result).toContainText("Nguồn: UNVERIFIED");
  await expect(result).toContainText("Không tự nâng QA PASS");
  // No registered CMD marker exists for the current define-gate checkpoint.
  await expect(page.getByLabel(/Dán stdout\/stderr/)).toHaveCount(0);
});
test("synthetic Viewer: can inspect but cannot gain execution approval",async({page})=>{
  await signIn(page,"r33-qa-viewer");
  await page.goto(route);
  await expect(page.getByRole("heading",{name:/Define required gate/})).toBeVisible();
  await page.getByRole("button",{name:/KIỂM TRA TOÀN BỘ KẾ HOẠCH \(TRONG QUYỀN HIỆN CÓ\)/}).click();
  const result=page.getByRole("status").filter({hasText:"Trạng thái: READ_ONLY_INSPECTED"});
  await expect(result).toBeVisible();
  await expect(result).toContainText("Phạm vi: Toàn bộ công việc có thể kiểm tra");
  await expect(result).toContainText("Quality Gate");
  await expect(result).toContainText("Chưa chạy sửa mã");
  await expect(result).toContainText("Không tự nâng QA PASS");
});
test("synthetic no-access principal: canonical project and NEXT ACTION are forbidden",async({page})=>{
  await signIn(page,"p7-e2e-no-access");
  await page.goto(route);
  await expect(page.getByRole("heading",{name:"Bạn không có quyền truy cập dự án này."})).toBeVisible();
  await expect(page.getByRole("button",{name:/NEXT ACTION —/})).toHaveCount(0);
});


async function prepareSyntheticCmdCheckpoint() {
  // Never touch a live database. This fixture only runs inside the ephemeral CI service.
  if(!process.env.DATABASE_URL?.endsWith("/blueprint_r33_browser_qa") ||
     !/^[a-f0-9]{40}$/.test(process.env.BLUEPRINT_QA_EXACT_SHA ?? "") ||
     process.env.BLUEPRINT_ALLOW_LOCAL_HTTP_AUTH!=="true") {
    throw new Error("R33 synthetic CMD fixture is restricted to disposable browser QA");
  }
  const runtime=createBlueprintServerRuntime(process.env.DATABASE_URL);
  const now=new Date().toISOString();
  try {
    const owner=await runtime.authority.resolveIdentity({
      provider:"github",providerSubject:"p6-e2e-owner",email:"p6-e2e@example.test"
    });
    const id="project:p6-registry-beta";
    const resolved=await runtime.profiles.read({principalId:owner.id},id);
    if(!resolved) throw new Error("Expected isolated QA project");
    const required=resolved.blueprint.requiredGates;
    for(let i=0;i<required.length;i++){
      const gateId=required[i]!;
      const evidenceId="evidence:r33-qa-"+i;
      const doc={
        id:gateId,projectId:id,name:"Synthetic QA "+gateId,
        requirements:["Synthetic fixture only; no real approval"],
        status:"pass",evidenceIds:[evidenceId],
        meta:{schemaVersion:"1.0.0",recordVersion:1,createdAt:now,updatedAt:now}
      };
      await runtime.prisma.qualityGate.upsert({
        where:{id:gateId},
        create:{id:gateId,projectId:id,schemaVersion:"1.0.0",recordVersion:1,status:"pass",document:doc},
        update:{status:"pass",document:doc}
      });
      const evidence={
        id:evidenceId,gateId,kind:"test" as const,
        source:"synthetic-disposable-browser-fixture",
        revision:process.env.BLUEPRINT_QA_EXACT_SHA!,
        createdAt:now
      };
      await runtime.prisma.gateEvidence.upsert({
        where:{id:evidenceId},
        create:{id:evidenceId,gateId,kind:"test",source:evidence.source,
          revision:evidence.revision,document:evidence},
        update:{source:evidence.source,revision:evidence.revision,document:evidence}
      });
    }
    const foundation=await runtime.prisma.workPackage.findUniqueOrThrow({
      where:{id:"work-package:p6-beta-foundation"}
    });
    const foundationDoc=foundation.document as Record<string,unknown>;
    await runtime.prisma.workPackage.update({
      where:{id:foundation.id},
      data:{status:"completed",document:{...foundationDoc,status:"completed"}}
    });
    const task=await runtime.prisma.workPackage.findUniqueOrThrow({
      where:{id:"work-package:p6-beta-dashboard"}
    });
    const doc=task.document as Record<string,unknown>;
    await runtime.prisma.workPackage.update({
      where:{id:task.id},
      data:{status:"ready",document:{
        ...doc,status:"ready",
        acceptanceCriteria:["BLUEPRINT_CMD_READONLY:git-status"]
      }}
    });
  } finally {
    await closeBlueprintServerRuntime(runtime);
  }
}
test("synthetic CMD task: show allowlisted command; reject malformed paste and preserve input",async({page})=>{
  await prepareSyntheticCmdCheckpoint();
  await signIn(page,"p6-e2e-owner");
  await page.goto(route);
  await expect(page.getByRole("heading",{name:/Continue: Ship readiness dashboard/})).toBeVisible();
  await page.getByRole("button",{name:/NEXT ACTION — TỰ LẬP KẾ HOẠCH & KIỂM TRA/}).click();
  const result=page.getByRole("status").filter({hasText:"READ_ONLY_INSPECTED"});
  await expect(result).toContainText("CMD — nhiệm vụ có bước chẩn đoán chỉ đọc");
  await expect(result).toContainText("git status --short --branch");
  const input=page.getByLabel(/Dán stdout\/stderr/);
  await input.fill("fatal: not a git repository");
  await page.getByRole("button",{name:/TIẾP NHẬN KẾT QUẢ CMD/}).click();
  await expect(page.getByRole("status").filter({hasText:"Đầu ra không giống"})).toBeVisible();
  await expect(input).toHaveValue("fatal: not a git repository");
  await input.fill("## main\\n M README.md");
  await page.getByRole("button",{name:/TIẾP NHẬN KẾT QUẢ CMD/}).click();
  await expect(page.getByRole("status").filter({hasText:"chưa xác minh máy nguồn"})).toBeVisible();
  await expect(input).toHaveValue("");
  await expect(result).toContainText("Không tự nâng QA PASS");
});
test("a stale browser Action is rejected after canonical profile changes",async({page})=>{
  await signIn(page,"p6-e2e-owner");
  await page.goto(route);
  await expect(page.getByRole("heading",{name:/Continue: Ship readiness dashboard/})).toBeVisible();
  const url=process.env.DATABASE_URL;
  if(!url?.endsWith("/blueprint_r33_browser_qa")) throw new Error("Disposable QA DB required");
  const runtime=createBlueprintServerRuntime(url);
  try {
    const profile=await runtime.prisma.projectProfile.findUniqueOrThrow({
      where:{id:"profile:p6-registry-beta"}
    });
    const doc=profile.document as Record<string,unknown>;
    const meta=doc.meta as Record<string,unknown>;
    const nextVersion=profile.recordVersion+1;
    await runtime.prisma.projectProfile.update({
      where:{id:profile.id},data:{
        recordVersion:nextVersion,
        document:{...doc,meta:{...meta,recordVersion:nextVersion}}
      }
    });
  } finally {
    await closeBlueprintServerRuntime(runtime);
  }
  await page.getByRole("button",{name:/NEXT ACTION — TỰ LẬP KẾ HOẠCH & KIỂM TRA/}).click();
  await expect(page.getByRole("status").filter({hasText:"Trạng thái: STALE"})).toBeVisible();
  await expect(page.getByRole("button",{name:/TẢI LẠI NEXT ACTION HIỆN HÀNH/})).toBeVisible();
});
