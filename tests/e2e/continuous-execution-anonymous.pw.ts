import { expect, test } from "@playwright/test";

/**
 * Actual Chromium + Next.js + HTTP, but deliberately NO user session.
 * This cannot and does not assert authenticated Owner/Editor/Viewer UI E2E.
 * PostgreSQL service identity tests cover those role policies separately.
 */
test.describe("isolated browser unauthenticated continuous-execution fail-closed",()=>{
  test("existing project requires sign-in and leaks no execution controls",async({page})=>{
    await page.goto("/projects/project%3Aqa-existing-russian");
    await expect(page.getByText("Đăng nhập để mở dự án này.")).toBeVisible();
    await expect(page.getByRole("button",{name:/Thực hiện nhiệm vụ liên tục/})).toHaveCount(0);
    await expect(page.getByRole("button",{name:/Owner: lưu biên bản/})).toHaveCount(0);
    await expect(page.getByRole("button",{name:/PLANNED.*READY/})).toHaveCount(0);
  });
  test("new project also requires sign-in, not pre-populated READY",async({page})=>{
    await page.goto("/projects/project%3Aqa-new-offline-app");
    await expect(page.getByText("Đăng nhập để mở dự án này.")).toBeVisible();
    await expect(page.getByText("READY_WORK_FOUND")).toHaveCount(0);
    await expect(page.getByRole("button",{name:/Thực hiện nhiệm vụ liên tục/})).toHaveCount(0);
  });
  test("anonymous HTTP forged cross-site Server Action POST is rejected",async({request})=>{
    const response=await request.post("/projects/project%3Aqa-existing-russian",{
      headers:{
        origin:"https://untrusted.invalid",
        "next-action":"0000000000000000000000000000000000000000",
        "content-type":"text/plain;charset=UTF-8"
      },
      data:"[]",failOnStatusCode:false
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
