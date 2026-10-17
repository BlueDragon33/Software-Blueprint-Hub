#!/usr/bin/env node
/**
 * Read-only Windows localhost readiness check.
 * - Does not start Docker, create a database, login, read session contents,
 *   assign roles, send a POST or sign grants.
 * - Reports no database credentials, tokens, Principal IDs or cookie contents.
 * - Port 5432 and root HTTP status prove only reachability, NOT authentication.
 */
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { connect } from "node:net";
import {
  classifyLocalE2eConfig, safeLocalhostUrl, safeDisposablePostgres
} from "./continuous-localhost-precheck-core.mjs";

const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
const checks=[];
const check=(name,ok,detail)=>checks.push({name,ok,detail:ok?"":detail});
const exec=(command,args=[])=>{
  const x=spawnSync(command,args,{
    cwd:root,encoding:"utf8",timeout:4000,shell:false,windowsHide:true
  });
  return x.status===0 ? (x.stdout??"").trim() : null;
};
const existsCommand=(name)=>{
  if(process.platform==="win32"){
    const x=exec("where.exe",[name]);
    return x!==null && x.length>0;
  }
  return exec("which",[name])!==null;
};
async function tcp(port){
  return await new Promise(done=>{
    const socket=connect({host:"127.0.0.1",port});
    const finish=(ok)=>{socket.destroy();done(ok);};
    socket.setTimeout(1200,()=>finish(false));
    socket.once("error",()=>finish(false));
    socket.once("connect",()=>finish(true));
  });
}
async function webOk(url){
  if(!safeLocalhostUrl(url))return false;
  try{
    const response=await fetch(new URL("/",url),{
      method:"GET",redirect:"manual",signal:AbortSignal.timeout(2000)
    });
    return response.status>=200 && response.status<500;
  }catch{return false;}
}
const nodeMajor=Number(process.versions.node.split(".")[0]);
check("Node.js 24",nodeMajor===24,
  "Cài Node.js 24 LTS theo yêu cầu engines của repository.");
const git=existsCommand("git");
check("Git",git,"Cài Git for Windows.");
check("pnpm",existsCommand("pnpm"),
  "Cài pnpm 12.4.0 bằng Corepack sau khi cài Node.js.");
check("Docker/Podman hoặc PostgreSQL",existsCommand("docker")||
  existsCommand("podman")||existsCommand("psql"),
  "Cài Docker Desktop hoặc PostgreSQL 16 cho CSDL QA dùng riêng.");
if(git){
  const sha=exec("git",["rev-parse","HEAD"]);
  check("Bản Git đã checkout",Boolean(sha),
    "Chạy lệnh trong repository Blueprint OS đã checkout.");
  if(sha)console.log("HEAD cục bộ: "+sha);
  const branch=exec("git",["branch","--show-current"]);
  check("Nhánh Draft PR #147",
    branch==="feature/universal-goal-continuity-next-action-candidate",
    "Chuyển sang nhánh Draft PR #147, không merge main.");
}
check("PostgreSQL TCP localhost:5432",await tcp(5432),
  "Chưa có PostgreSQL lắng nghe ở 127.0.0.1:5432; không đụng DB Production.");
const base=process.env.BLUEPRINT_REAL_AUTH_E2E_BASE_URL;
check("Web Blueprint OS localhost",await webOk(base),
  "Chưa xác minh web Blueprint OS thật trên URL localhost đã cấu hình.");
for(const c of classifyLocalE2eConfig(process.env,root))
  check(c.id,c.status==="READY",c.hint);
if(safeDisposablePostgres(process.env.DATABASE_URL)){
  console.log("Lưu ý: DB URL đúng mẫu, chưa chứng minh tài khoản DB hoặc migrations.");
}
console.log("\nBLUEPRINT OS — KIỂM TRA CHỈ ĐỌC (không tạo quyền hay phiên)");
for(const c of checks)console.log((c.ok?"[OK] ":"[BLOCKED] ")+
  c.name+(c.detail?" — "+c.detail:""));
const missing=checks.filter(x=>!x.ok);
console.log("\nKẾT LUẬN: "+(missing.length?"BLOCKED":"PREREQUISITES_VISIBLE_ONLY")+
  " ("+missing.length+" hạng mục cần xử lý)");
console.log(missing.length?
  "Next Action: giải quyết hạng mục BLOCKED đầu tiên, sau đó chạy lại tiền kiểm.":
  "Next Action: kiểm tra phiên và quyền thật bằng bộ Playwright opt-in; chưa được coi là E2E PASS.");
if(missing.length)process.exitCode=2;
