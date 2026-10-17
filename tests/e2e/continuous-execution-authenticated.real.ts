import { test, expect, type Page, type APIResponse } from "@playwright/test";
import { createPrismaClient } from "../../packages/persistence/src/client";
import { requireRealAuthEnvironment, type AuthenticatedRole } from "./continuous-authenticated-environment";

const env=requireRealAuthEnvironment();
const path="/projects/"+encodeURIComponent(env.projectId);
const prisma=createPrismaClient(env.databaseURL);
const runPost=(r:APIResponse):boolean=>
  r.request().method()==="POST" && r.url().includes("/projects/");
const buttonName="Kiểm tra lại READY bằng dữ liệu thật";

async function verifyPersistedActors():Promise<void>{
  const p=await prisma.projectProfile.findUnique({where:{projectId:env.projectId}});
  if(!p)throw new Error("BLOCKED_REAL_AUTH_E2E_PROJECT_PROFILE_NOT_IN_DATABASE");
  for(const role of ["OWNER","EDITOR","VIEWER"] as const){
    const principalId=env.principalIds[role];
    const [principal,assigned,systemOwner]=await Promise.all([
      prisma.principal.findUnique({where:{id:principalId}}),
      prisma.projectAuthority.findUnique({where:{
        projectId_principalId:{projectId:env.projectId,principalId}
      }}),
      prisma.systemBootstrap.findUnique({where:{id:"system"}})
    ]);
    const correct=principal!==null && (role==="OWNER"
      ? assigned?.role==="OWNER" || systemOwner?.ownerPrincipalId===principalId
      : assigned?.role===role && systemOwner?.ownerPrincipalId!==principalId);
    if(!correct) throw new Error("BLOCKED_REAL_AUTH_E2E_"+role+"_PERSISTED_ROLE_MISMATCH");
  }
}

async function openProfile(page:Page,role:AuthenticatedRole):Promise<void>{
  const response=await page.goto(path);
  if(!response || !response.ok())
    throw new Error("BLOCKED_REAL_AUTH_E2E_"+role+"_PROJECT_ROUTE_UNAVAILABLE");
  await expect(page.getByText("Đăng nhập để mở dự án này.")).toHaveCount(0);
  await expect(page.getByRole("heading",{name:"Thực hiện nhiệm vụ liên tục"})).toBeVisible();
  await expect(page.getByText("Không thể xác minh dữ liệu chuẩn hoặc phiên làm việc.")).toHaveCount(0);
}

test.beforeAll(async()=>{await verifyPersistedActors();});
test.afterAll(async()=>{await prisma.$disconnect();});

test.describe("actual Owner browser (external provider-authenticated session only)",()=>{
  test.use({storageState:env.states.OWNER});
  test("authenticated OWNER can read its canonical preflight and only scoped Owner controls",async({page})=>{
    await openProfile(page,"OWNER");
    await expect(page.getByText(/Profile v\d+/)).toBeVisible();
    await expect(page.getByRole("button",{name:buttonName})).toBeVisible();
    // Control can only exist when a real canonical READY Work Package + HEAD
    // are available, otherwise report a genuine blocker rather than invent it.
    const owner=page.getByText(/Owner: xác nhận tám điều kiện tiền kiểm|Quản lý biên bản tiền kiểm đã xác nhận/);
    await expect(owner).toBeVisible();
    if(!env.expectGrant){
      await expect(page.getByRole("button",{
        name:"Thực hiện nhiệm vụ liên tục — bước khảo sát được ký"})).toHaveCount(0);
    }
  });
  test("real valid Server Action POST accepts localhost Origin; hostile Origin is denied",async({page})=>{
    await openProfile(page,"OWNER");
    const valid=page.getByRole("button",{name:buttonName});
    await expect(valid).toBeVisible();
    await valid.click();
    await expect(page).toHaveURL(/continuous=checked/);
    await page.goto(path);
    let intercepted=false;
    await page.route("**/projects/**",async route=>{
      if(!intercepted && route.request().method()==="POST"){
        intercepted=true;
        await route.continue({headers:{
          ...route.request().headers(),origin:"https://invalid-blueprint-origin.example"
        }});
      }else await route.continue();
    });
    const reply=page.waitForResponse(r=>r.request().method()==="POST" &&
      r.url().includes("/projects/"));
    await page.getByRole("button",{name:buttonName}).click();
    const status=(await reply).status();
    expect(intercepted).toBe(true);
    expect(status).toBeGreaterThanOrEqual(400);
    await page.unrouteAll({behavior:"ignoreErrors"});
    await page.goto(path);
    await expect(page.getByRole("heading",{name:"Thực hiện nhiệm vụ liên tục"})).toBeVisible();
  });
  test("explicit opt-in only: attest and revoke by real Owner, with durable CAS/replay readback",async({page})=>{
    test.skip(!env.canMutate,"REAL OWNER WRITES BLOCKED until explicit disposable-db opt-in");
    await openProfile(page,"OWNER");
    const previous=await prisma.continuousPreflightReceipt.findFirst({
      where:{projectId:env.projectId},orderBy:{sequence:"desc"}
    });
    // Require an initially un-attested test project to avoid overwriting
    // someone else's genuine decision or leaving an unreverted state.
    if(previous?.decision==="attest"){
      throw new Error("BLOCKED_REAL_AUTH_E2E_TEST_PROJECT_ALREADY_ATTESTED");
    }
    const disclose=page.getByText("Owner: xác nhận tám điều kiện tiền kiểm trước khi thực thi");
    await expect(disclose).toBeVisible();
    await disclose.click();
    const box=page.locator("details").filter({has:disclose});
    await box.getByRole("textbox",{name:/Nhận xét/}).fill(
      "Manual isolated acceptance: reviewed 8 canonical factors; QA and deployment remain blocked.");
    await box.getByRole("checkbox",{name:/Tôi xác nhận quyết định/}).check();
    await box.getByRole("button",{name:"Owner: lưu biên bản tiền kiểm có xác thực"}).click();
    await expect(page).toHaveURL(/continuous=preflight-attested/);
    const attested=await prisma.continuousPreflightReceipt.findFirst({
      where:{projectId:env.projectId},orderBy:{createdAt:"desc"}
    });
    expect(attested?.decision).toBe("attest");
    expect(attested?.actorPrincipalId).toBe(env.principalIds.OWNER);
    await page.goto(path);
    await page.getByText("Quản lý biên bản tiền kiểm đã xác nhận").click();
    const revoker=page.locator("details").filter({
      hasText:"Quản lý biên bản tiền kiểm đã xác nhận"
    });
    await revoker.getByRole("textbox",{name:/Nhận xét/}).fill(
      "Explicit revocation in disposable real-session E2E, preserve immutable audit and lock execution.");
    await revoker.getByRole("checkbox",{name:/Tôi xác nhận quyết định/}).check();
    await revoker.getByRole("button",{name:"Owner: thu hồi biên bản tiền kiểm"}).click();
    await expect(page).toHaveURL(/continuous=preflight-revoked/);
    const after=await prisma.continuousPreflightReceipt.findFirst({
      where:{projectId:env.projectId},orderBy:{createdAt:"desc"}
    });
    expect(after?.decision).toBe("revoke");
    expect(after?.sequence).toBe((attested?.sequence??0)+1);
    await expect(page.getByRole("button",{
      name:"Thực hiện nhiệm vụ liên tục — bước khảo sát được ký"})).toHaveCount(0);
  });
});

test.describe("real Editor browser (cannot sign Owner preflight)",()=>{
  test.use({storageState:env.states.EDITOR});
  test("Editor sees engineering readback but no Owner confirmation",async({page})=>{
    await openProfile(page,"EDITOR");
    await expect(page.getByRole("button",{name:buttonName})).toBeVisible();
    await expect(page.getByText("Owner: xác nhận tám điều kiện tiền kiểm trước khi thực thi")).toHaveCount(0);
    await expect(page.getByText("Quản lý biên bản tiền kiểm đã xác nhận")).toHaveCount(0);
  });
});

test.describe("real Viewer browser (no mutation grants)",()=>{
  test.use({storageState:env.states.VIEWER});
  test("Viewer reads its project but cannot confirm Owner or mutate Work/Gate",async({page})=>{
    await openProfile(page,"VIEWER");
    await expect(page.getByText("Owner: xác nhận tám điều kiện tiền kiểm trước khi thực thi")).toHaveCount(0);
    await expect(page.getByRole("button",{name:/Xác nhận tạo hồ sơ/})).toHaveCount(0);
    await expect(page.getByRole("button",{name:/Xác nhận PLANNED/})).toHaveCount(0);
    await expect(page.getByRole("button",{name:"Thực hiện nhiệm vụ liên tục — bước khảo sát được ký"})).toHaveCount(0);
  });
});
