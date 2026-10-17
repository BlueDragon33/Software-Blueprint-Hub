/**
 * Blueprint OS local real-auth E2E readiness — pure, no secrets or network.
 * Supports the self-check CLI and regression tests without granting access.
 */
import { isAbsolute, relative, sep } from "node:path";
import { existsSync, realpathSync, statSync } from "node:fs";

const LOOPBACK=new Set(["127.0.0.1","localhost","::1","[::1]"]);
export const REAL_ROLES=["OWNER","EDITOR","VIEWER"];

export function safeLocalhostUrl(value) {
  if (typeof value!=="string" || !value.trim()) return false;
  let u;
  try {u=new URL(value);} catch {return false;}
  return ["http:","https:"].includes(u.protocol) && LOOPBACK.has(u.hostname) &&
    !u.username && !u.password && u.pathname==="/" && !u.search && !u.hash;
}
export function safeDisposablePostgres(value){
  if(typeof value!=="string" || !value.trim()) return false;
  let u;
  try {u=new URL(value);}catch{return false;}
  return (u.protocol==="postgresql:" || u.protocol==="postgres:") &&
    LOOPBACK.has(u.hostname) && u.pathname==="/blueprint_qa_test";
}
export function sessionFileReady(filename,repoDir){
  if(!filename || !isAbsolute(filename) || !existsSync(filename))return false;
  try{
    const path=realpathSync(filename);
    const rel=relative(realpathSync(repoDir),path);
    if(!rel || rel===".." || rel.startsWith(".."+sep)===false && !isAbsolute(rel))
      return false;
    const st=statSync(path);
    return st.isFile() && st.size>=20 && st.size<=120000;
  }catch{return false;}
}
export function classifyLocalE2eConfig(env,repositoryRoot){
  const checks=[];
  const emit=(id,passed,hint)=>checks.push({
    id,status:passed?"READY":"BLOCKED",hint:passed?"":hint
  });
  emit("disposable-project",
    /^project:qa-[a-z0-9-]+$/.test(env.BLUEPRINT_REAL_AUTH_E2E_PROJECT??""),
    "Chọn một Project Profile QA đã tồn tại, ID bắt đầu project:qa-.");
  emit("local-web-origin",safeLocalhostUrl(env.BLUEPRINT_REAL_AUTH_E2E_BASE_URL),
    "Khai báo URL localhost của ứng dụng thật (không dùng Preview).");
  emit("local-disposable-database",safeDisposablePostgres(env.DATABASE_URL),
    "Chỉ dùng PostgreSQL tại localhost, database blueprint_qa_test.");
  for(const role of REAL_ROLES){
    emit(role.toLowerCase()+"-principal",
      /^principal:[0-9a-fA-F-]{36}$/.test(
        env["BLUEPRINT_REAL_AUTH_E2E_"+role+"_PRINCIPAL"]??""),
      "Cần ID Principal "+role+" thật đã được phân quyền trong DB thử nghiệm.");
    emit(role.toLowerCase()+"-session",sessionFileReady(
      env["BLUEPRINT_REAL_AUTH_E2E_"+role+"_STATE"],repositoryRoot),
      "Cần tệp phiên "+role+" được tạo sau đăng nhập thật, nằm ngoài repo.");
  }
  emit("explicit-auth-e2e-opt-in",env.BLUEPRINT_REAL_AUTH_E2E==="true",
    "Chỉ bật BLUEPRINT_REAL_AUTH_E2E=true khi các phiên thật đã sẵn sàng.");
  return checks;
}

/**
 * This repository pins pnpm@12.4.0. On Windows a non-admin cannot usually
 * create Corepack pnpm/pnpx shims in Program Files. A cached Corepack
 * invocation is equally valid without changing global PATH or requiring UAC.
 * Command execution is in the CLI; this decision is pure and testable.
 */
export function classifyPnpmAvailability(directVersion,corepackVersion){
  if(directVersion==="12.4.0")
    return Object.freeze({ready:true,method:"direct"});
  if(corepackVersion==="12.4.0")
    return Object.freeze({ready:true,method:"corepack"});
  return Object.freeze({ready:false,method:null});
}
