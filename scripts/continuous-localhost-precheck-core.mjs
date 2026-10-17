/**
 * Blueprint OS local real-auth E2E readiness — pure, no secrets or network.
 * Supports the self-check CLI and regression tests without granting access.
 */
import { isAbsolute, relative, sep } from "node:path";
import { existsSync, realpathSync, statSync } from "node:fs";
import { connect } from "node:net";

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
/**
 * Return ONLY a sanitized loopback host/port for the exact disposable QA DB.
 * Never echo credentials or permit a remote/production TCP probe. Different
 * Windows PostgreSQL installations may map their isolated instance to 55432.
 */
export function localDisposablePostgresProbe(value){
  if(!safeDisposablePostgres(value))return null;
  const u=new URL(value);
  const port=Number(u.port || "5432");
  if(!Number.isSafeInteger(port) || port<1 || port>65535)return null;
  // A loopback URL must never become a remote DNS or user-provided hostname.
  const host=u.hostname==="[::1]" || u.hostname==="::1" ? "::1" : "127.0.0.1";
  return Object.freeze({host,port});
}

/**
 * PostgreSQL SSLRequest exchange: a read-only 8-byte protocol negotiation.
 * This proves only that localhost speaks the PostgreSQL wire protocol.
 * Never sends a StartupMessage, credentials, SQL, or user data. In
 * particular it DOES NOT prove blueprint_qa_test exists or is disposable.
 */
export function postgresSslReplyAccepted(data){
  return Buffer.isBuffer(data) && data.length===1 &&
    (data[0]===0x53 || data[0]===0x4e); // "S" or "N"
}
export function probeLocalPostgresProtocol(endpoint){
  if(!endpoint || !["127.0.0.1","::1"].includes(endpoint.host) ||
    !Number.isSafeInteger(endpoint.port) ||
    endpoint.port<1 || endpoint.port>65535) return Promise.resolve(false);
  return new Promise(done=>{
    const socket=connect({host:endpoint.host,port:endpoint.port});
    let finished=false;
    const finish=ok=>{
      if(finished)return;
      finished=true;
      socket.destroy();
      done(ok);
    };
    socket.setTimeout(1500,()=>finish(false));
    socket.once("error",()=>finish(false));
    socket.once("close",()=>finish(false));
    socket.once("connect",()=>{
      // 0x04d2162f is the standardized PostgreSQL SSLRequest code.
      // No login or query; the server must respond with one byte S or N.
      socket.write(Buffer.from([0,0,0,8,4,210,22,47]),err=>{
        if(err)finish(false);
      });
    });
    socket.once("data",data=>finish(postgresSslReplyAccepted(data)));
  });
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
