import { encode } from "@auth/core/jwt";
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
