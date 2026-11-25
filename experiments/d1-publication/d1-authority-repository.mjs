import { randomUUID } from 'node:crypto';
import { guardedAtomicBatch } from './d1-atomic-cas.mjs';

// Repository candidate. Caller must be the existing authenticated AuthorityService;
// neither Cloudflare Access nor user-supplied identity grants System Owner.
function identityValues(identity) {
  if (typeof identity?.provider !== 'string' || !identity.provider.trim() ||
      typeof identity.providerSubject !== 'string' || !identity.providerSubject.trim()) throw new TypeError('Authenticated identity required');
  return [identity.provider, identity.providerSubject, identity.email ?? null];
}
const frozen = row => Object.freeze({id:row.id,provider:row.provider,providerSubject:row.providerSubject,email:row.email});
const stamp = () => new Date().toISOString();
const roles=new Set(['OWNER','EDITOR','REVIEWER','VIEWER']);
function checkedRole(role){if(!roles.has(role))throw new TypeError('Invalid project role');return role;}
export class D1AuthorityRepository {
  #db; #conflict;
  constructor(db, OwnerBootstrapConflictError) {
    if (!db || typeof db.prepare !== 'function' || typeof db.batch !== 'function' || typeof OwnerBootstrapConflictError !== 'function') throw new TypeError('D1 binding and canonical conflict type required');
    this.#db=db; this.#conflict=OwnerBootstrapConflictError;
  }
  #stmt(sql,...values){return this.#db.prepare(sql).bind(...values);}
  async #one(sql,...values){return await this.#stmt(sql,...values).first();}
  async #all(sql,...values){const result=await this.#stmt(sql,...values).all();if(result.success!==true||!Array.isArray(result.results))throw Error('D1 read unavailable');return result.results;}
  #upsert(identity,id,now){return this.#stmt('INSERT INTO "Principal" ("id","provider","providerSubject","email","createdAt","updatedAt") VALUES (?,?,?,?,?,?) ON CONFLICT("provider","providerSubject") DO UPDATE SET "email"=excluded."email","updatedAt"=excluded."updatedAt"',id,...identity,now,now);}
  async resolvePrincipal(identity) {
    const values=identityValues(identity),now=stamp();
    const results=await this.#db.batch([this.#upsert(values,`principal:${randomUUID()}`,now),this.#stmt('SELECT "id","provider","providerSubject","email" FROM "Principal" WHERE "provider"=? AND "providerSubject"=?',...values.slice(0,2))]);
    if(results.length!==2||results.some(x=>x.success!==true)||results[1].results?.length!==1)throw Error('D1 principal readback unavailable');
    return frozen(results[1].results[0]);
  }
  async bootstrapOwner(identity) {
    const values=identityValues(identity),now=stamp(),id=`principal:${randomUUID()}`,audit=`audit:${randomUUID()}`;
    // Guard before upsert: an existing owner must not be modified even by a failed bootstrap.
    const guard=this.#stmt('INSERT INTO blueprint_atomic_guard(id,ok) SELECT 1,CASE WHEN NOT EXISTS(SELECT 1 FROM "SystemBootstrap" WHERE id=\'system\') THEN 1 ELSE 0 END');
    try {
      const result=await this.#db.batch([guard,this.#stmt('DELETE FROM blueprint_atomic_guard WHERE id=1'),this.#upsert(values,id,now),this.#stmt('INSERT INTO "SystemBootstrap" ("id","ownerPrincipalId","initializedAt") SELECT \'system\',"id",? FROM "Principal" WHERE "provider"=? AND "providerSubject"=?',now,...values.slice(0,2)),this.#stmt('INSERT INTO "AuthorityAuditEvent" ("id","actorPrincipalId","targetPrincipalId","action","detail","createdAt") SELECT ?,"ownerPrincipalId","ownerPrincipalId",\'SYSTEM_OWNER_BOOTSTRAPPED\',?,? FROM "SystemBootstrap" WHERE id=\'system\'',audit,JSON.stringify({provider:values[0]}),now),this.#stmt('SELECT p."id",p."provider",p."providerSubject",p."email" FROM "Principal" p JOIN "SystemBootstrap" b ON b."ownerPrincipalId"=p."id" WHERE b.id=\'system\' AND p."provider"=? AND p."providerSubject"=?',...values.slice(0,2))]);
      if(result.length!==6||result.some(x=>x.success!==true)||result[5].results?.length!==1)throw Error('D1 bootstrap readback unavailable');
      return frozen(result[5].results[0]);
    } catch(error) {
      // Do not reinterpret an ambiguous transport failure as success. The
      // current owner readback only classifies a known constraint failure.
      if (/CHECK constraint failed: ok|UNIQUE constraint failed: SystemBootstrap\.id/.test(String(error)) && await this.#one('SELECT "id" FROM "SystemBootstrap" WHERE id=\'system\'')) throw new this.#conflict();
      throw error;
    }
  }
  async isSystemOwner(principalId){return Boolean(await this.#one('SELECT 1 AS ok FROM "SystemBootstrap" WHERE id=\'system\' AND "ownerPrincipalId"=?',principalId));}
  async findProjectRole(projectId,principalId){const row=await this.#one('SELECT "role" FROM "ProjectAuthority" WHERE "projectId"=? AND "principalId"=?',projectId,principalId);return row?checkedRole(row.role):null;}
  async listProjectRolesForPrincipal(principalId){return Object.freeze((await this.#all('SELECT "projectId","principalId","role" FROM "ProjectAuthority" WHERE "principalId"=? ORDER BY "projectId","role"',principalId)).map(row=>Object.freeze({...row,role:checkedRole(row.role)})));}
  async setProjectRole(assignment,audit){
    checkedRole(assignment.role);
    if(audit.projectId!==assignment.projectId||audit.targetPrincipalId!==assignment.principalId||audit.action!=='PROJECT_ROLE_SET')throw new TypeError('Role audit identity mismatch');
    const now=stamp();
    // Recheck System Owner OR the same-project OWNER role inside the write.
    const cas=this.#stmt('INSERT INTO "ProjectAuthority" ("projectId","principalId","role","createdAt","updatedAt") SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM "SystemBootstrap" WHERE id=\'system\' AND "ownerPrincipalId"=?) OR EXISTS(SELECT 1 FROM "ProjectAuthority" WHERE "projectId"=? AND "principalId"=? AND "role"=\'OWNER\') ON CONFLICT("projectId","principalId") DO UPDATE SET "role"=excluded."role","updatedAt"=excluded."updatedAt"',assignment.projectId,assignment.principalId,assignment.role,now,now,audit.actorPrincipalId,assignment.projectId,audit.actorPrincipalId);
    const append=this.#stmt('INSERT INTO "AuthorityAuditEvent" ("id","actorPrincipalId","targetPrincipalId","projectId","action","detail","createdAt") VALUES (?,?,?,?,?,?,?)',`audit:${randomUUID()}`,audit.actorPrincipalId,audit.targetPrincipalId??null,audit.projectId??null,audit.action,audit.detail==null?null:JSON.stringify(audit.detail),now);
    await guardedAtomicBatch(this.#db,cas,[append]);
    return Object.freeze({...assignment});
  }
}
