import { realpathSync, statSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, relative, isAbsolute, sep } from "node:path";

export type AuthenticatedRole="OWNER"|"EDITOR"|"VIEWER";
export const ROLES=["OWNER","EDITOR","VIEWER"] as const;

/**
 * Opt-in ONLY. In CI, with no real actor sessions, this suite must never
 * claim authenticated E2E success. Real sessions are issued through the
 * actual Auth.js/App-Manager SSO provider, NOT from seed scripts.
 */
export function requireRealAuthEnvironment(configuration: NodeJS.ProcessEnv=process.env): {
  baseURL: string;
  projectId: string;
  databaseURL: string;
  principalIds: Readonly<Record<AuthenticatedRole,string>>;
  states: Readonly<Record<AuthenticatedRole,string>>;
  canMutate: boolean;
  expectGrant: boolean;
} {
  if (configuration.BLUEPRINT_REAL_AUTH_E2E!=="true") throw new Error("BLOCKED_REAL_AUTH_E2E_NOT_ENABLED");
  const base=configuration.BLUEPRINT_REAL_AUTH_E2E_BASE_URL?.trim()??"";
  let url:URL;
  try {url=new URL(base);}catch{throw new Error("BLOCKED_REAL_AUTH_E2E_BASE_URL_MISSING");}
  if (!["localhost","127.0.0.1","[::1]","::1"].includes(url.hostname) ||
      !["http:","https:"].includes(url.protocol) ||
      url.username || url.password || url.pathname!=="/" || url.search || url.hash) {
    throw new Error("BLOCKED_REAL_AUTH_E2E_REQUIRES_LOCALHOST");
  }
  const db=configuration.DATABASE_URL??"";
  let parsed:URL;
  try{parsed=new URL(db);}catch{throw new Error("BLOCKED_REAL_AUTH_E2E_DATABASE_URL_MISSING");}
  if (!["localhost","127.0.0.1","[::1]","::1"].includes(parsed.hostname) ||
      parsed.pathname!=="/blueprint_qa_test") {
    throw new Error("BLOCKED_REAL_AUTH_E2E_REQUIRES_DISPOSABLE_POSTGRES");
  }
  const projectId=configuration.BLUEPRINT_REAL_AUTH_E2E_PROJECT?.trim()??"";
  if (!/^project:qa-[a-z0-9-]+$/.test(projectId)) {
    throw new Error("BLOCKED_REAL_AUTH_E2E_CANONICAL_PROJECT_REQUIRED");
  }
  const principalIds={} as Record<AuthenticatedRole,string>;
  const states={} as Record<AuthenticatedRole,string>;
  const repositoryRoot=resolve(process.cwd());
  for(const role of ROLES){
    const principal=configuration["BLUEPRINT_REAL_AUTH_E2E_"+role+"_PRINCIPAL"]??"";
    const filename=configuration["BLUEPRINT_REAL_AUTH_E2E_"+role+"_STATE"]??"";
    if(!/^principal:[0-9a-fA-F-]{36}$/.test(principal) || !filename ||
       !isAbsolute(filename) || !existsSync(filename)){
      throw new Error("BLOCKED_REAL_AUTH_E2E_REAL_"+role+"_SESSION_REQUIRED");
    }
    const file=realpathSync(filename);
    const rel=relative(repositoryRoot,file);
    if(!rel || (!rel.startsWith(".."+sep) && rel!=="..") && !isAbsolute(rel)){
      throw new Error("BLOCKED_REAL_AUTH_E2E_SESSIONS_MUST_STAY_OUTSIDE_REPOSITORY");
    }
    const st=statSync(file);
    if(!st.isFile() || st.size<20 || st.size>120000){
      throw new Error("BLOCKED_REAL_AUTH_E2E_INVALID_"+role+"_SESSION_STATE");
    }
    principalIds[role]=principal;states[role]=file;
  }
  if(new Set(Object.values(principalIds)).size!==3 ||
     new Set(Object.values(states)).size!==3){
    throw new Error("BLOCKED_REAL_AUTH_E2E_ACTORS_MUST_BE_DISTINCT");
  }
  return {
    baseURL:url.origin,projectId,databaseURL:db,principalIds,states,
    canMutate:configuration.BLUEPRINT_REAL_AUTH_E2E_ALLOW_OWNER_WRITES==="true",
    expectGrant:configuration.BLUEPRINT_REAL_AUTH_E2E_EXPECT_SIGNED_GRANT==="true"
  };
}


/**
 * Compares a server-produced digest of the authenticated browser Principal
 * with the independent canonical QA Principal for the asserted role.
 * The raw Principal ID and all cookies/tokens stay out of the HTML.
 * This helper never creates or signs sessions and cannot grant authority.
 */
export function assertRealSessionPrincipalBinding(
  role: AuthenticatedRole,
  observed: string | null,
  expected: Readonly<Record<AuthenticatedRole,string>>
): void {
  const principal=expected[role];
  const digest=(value:string):string =>
    createHash("sha256").update(value).digest("hex");
  if (!/^principal:[0-9a-fA-F-]{36}$/.test(principal) ||
      !observed || !/^[a-f0-9]{64}$/.test(observed) ||
      observed!==digest(principal) ||
      ROLES.some(other=>other!==role && observed===digest(expected[other]))) {
    // Never print raw Principal IDs, session state or credential values.
    throw new Error("BLOCKED_REAL_AUTH_E2E_"+role+"_SESSION_PRINCIPAL_MISMATCH");
  }
}
