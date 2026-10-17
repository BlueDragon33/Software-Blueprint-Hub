#!/usr/bin/env node
/**
 * Read-only Windows localhost readiness check.
 * - Does not start Docker, create a database, login, read session contents,
 *   assign roles, send a POST or sign grants.
 * - Reports no database credentials, tokens, Principal IDs or cookie contents.
 * - Safe disposable DB loopback port and root HTTP status prove only reachability, NOT authentication.
 */
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { connect } from "node:net";
import {
  classifyLocalE2eConfig, safeLocalhostUrl, safeDisposablePostgres,
  classifyPnpmAvailability, localDisposablePostgresProbe, probeLocalPostgresProtocol
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
async function tcp(host,port){
  return await new Promise(done=>{
    const socket=connect({host,port});
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
// Probe exact versions, not just PATH: Corepack may be installed and pnpm
// usable on Windows without permission to write nodejs/pnpm[x] shims.
// Fixed command strings (no user data). Disable Corepack network and
// package.json auto-pin to preserve the preflight's read-only contract.
const pnpmProbeEnvironment={
  ...process.env, COREPACK_ENABLE_NETWORK:"0",COREPACK_ENABLE_AUTO_PIN:"0",
  COREPACK_ENABLE_DOWNLOAD_PROMPT:"0"
};
const packageManagerVersion=(command)=>{
  const runner=process.platform==="win32" ? "cmd.exe" : command;
  const args=process.platform==="win32"
    ? ["/d","/s","/c",command+" --version"]
    : ["--version"];
  const result=spawnSync(runner,args,{
    cwd:root,env:pnpmProbeEnvironment,encoding:"utf8",timeout:7000,
    shell:false,windowsHide:true
  });
  return result.status===0 ? (result.stdout??"").trim() : null;
};
const directPnpmVersion=packageManagerVersion("pnpm");
const corepackPnpmVersion=directPnpmVersion==="12.4.0"
  ? null
  : (()=>{
    const runner=process.platform==="win32" ? "cmd.exe" : "corepack";
    const args=process.platform==="win32"
      ? ["/d","/s","/c","corepack pnpm --version"]
      : ["pnpm","--version"];
    const result=spawnSync(runner,args,{
      cwd:root,env:pnpmProbeEnvironment,encoding:"utf8",timeout:7000,
      shell:false,windowsHide:true
    });
    return result.status===0 ? (result.stdout??"").trim() : null;
  })();
const pnpmStatus=classifyPnpmAvailability(
  directPnpmVersion,corepackPnpmVersion);
check("pnpm",pnpmStatus.ready,
  "Không tìm thấy pnpm 12.4.0 qua lệnh trực tiếp hoặc Corepack ngoại tuyến. Thử corepack pnpm --version (không cần Admin).");
if(pnpmStatus.method==="corepack")
  console.log("pnpm 12.4.0 qua Corepack: OK (không cần Administrator hay ghi Program Files).");
// Command availability is not the same as service availability: Windows
// PostgreSQL often runs as a service while psql.exe is not in PATH.
const localDbTools=existsCommand("docker")||
  existsCommand("podman")||existsCommand("psql");
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
const configuredDbProbe=localDisposablePostgresProbe(process.env.DATABASE_URL);
const dbProbe=configuredDbProbe??{host:"127.0.0.1",port:5432};
check("PostgreSQL TCP localhost:"+dbProbe.port,await tcp(dbProbe.host,dbProbe.port),
  "Chưa có PostgreSQL QA lắng nghe trên cổng localhost đã cấu hình; không đụng DB Production.");
const postgresWireProtocol=await probeLocalPostgresProtocol(dbProbe);
check("PostgreSQL protocol localhost:"+dbProbe.port,postgresWireProtocol,
  "Cổng localhost không trả lời như PostgreSQL; chưa được coi là PostgreSQL. Không cài đặt đè hoặc tự tạo database.");
check("Docker/Podman hoặc PostgreSQL",localDbTools||postgresWireProtocol,
  "Chưa có công cụ DB trong PATH hoặc phản hồi PostgreSQL hợp lệ; hãy kiểm tra dịch vụ trước khi cài thêm.");
if(!localDbTools && postgresWireProtocol)
  console.log("PostgreSQL localhost đã phản hồi giao thức thật, không cần cài Docker hay đưa psql.exe vào PATH chỉ để tiền kiểm.");
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
