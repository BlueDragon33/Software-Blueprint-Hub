import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir:"./browser",testMatch:"**/*.pw.ts",fullyParallel:false,retries:0,workers:1,
  reporter:process.env.D1_BROWSER_REPORT ? [["list"],["json",{outputFile:process.env.D1_BROWSER_REPORT}]] : [["list"]],
  use:{baseURL:"http://127.0.0.1:3000",trace:"retain-on-failure"},
  projects:[
    {name:"desktop-chromium",use:{...devices["Desktop Chrome"]}},
    {name:"tablet-chromium",use:{...devices["Desktop Chrome"],viewport:{width:834,height:1194},hasTouch:true}},
    {name:"mobile-chromium",use:{...devices["Pixel 7"]}}
  ]
});
