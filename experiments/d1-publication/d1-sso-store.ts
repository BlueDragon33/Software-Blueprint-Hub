// Internal identity link port. The application must still verify both upstream
// identity proofs before calling linkExistingOwner; no external role is trusted.
import type { D1Binding, D1Result, SqlValue } from './d1-domain-store.ts';
const issuer='application-management';
interface Link {issuer:string;subject:string;principalId:string;revokedAt:Date|null}
interface Owner {id:string;provider:string;providerSubject:string;email:string|null}
function one(r:D1Result):Record<string,unknown>|null{if(r.success!==true||!Array.isArray(r.results)||r.results.length>1)throw Error('SSO read unavailable');if(!r.results.length)return null;const x=r.results[0];if(!x||typeof x!=='object'||Array.isArray(x))throw Error('SSO row invalid');return x as Record<string,unknown>}
function string(v:unknown){if(typeof v!=='string'||!v.trim())throw TypeError('SSO string invalid');return v}
function link(row:Record<string,unknown>|null):Link|null{if(!row)return null;if(row.issuer!==issuer)throw Error('SSO issuer mismatch');const date=row.revokedAt===null?null:new Date(string(row.revokedAt));if(date&&date.toISOString()!==row.revokedAt)throw Error('SSO timestamp mismatch');return {issuer,subject:string(row.subject),principalId:string(row.principalId),revokedAt:date}}
export class D1SsoStore {
  constructor(private readonly db:D1Binding){}
  private stmt(sql:string,...values:SqlValue[]){return this.db.prepare(sql).bind(...values)}
  private linkRead(subject:string){return this.stmt('SELECT issuer,subject,"principalId","revokedAt" FROM "AppManagementSsoLink" WHERE issuer=? AND subject=?',issuer,subject)}
  async findLink(subject:string){return link(one(await this.linkRead(string(subject)).all()))}
  async currentOwner():Promise<Owner|null>{const r=one(await this.stmt('SELECT p.id,p.provider,p."providerSubject",p.email FROM "SystemBootstrap" b JOIN "Principal" p ON p.id=b."ownerPrincipalId" WHERE b.id=\'system\'').all());return r?{id:string(r.id),provider:string(r.provider),providerSubject:string(r.providerSubject),email:r.email===null?null:string(r.email)}:null}
  async findPrincipal(id:string){const row=one(await this.stmt('SELECT id FROM "Principal" WHERE id=?',id).all());return row?{id:string(row.id)}:null}
  async linkExistingOwner(subject:string,ownerId:string,provider:string,providerSubject:string){
    // Current immutable provider identity and owner membership are rechecked
    // inside this batch; existing revoked or conflicting links are not overwritten.
    const identity=[string(ownerId),string(provider),string(providerSubject)];string(subject);
    const guard=this.stmt('INSERT INTO blueprint_atomic_guard(id,ok) SELECT 1,CASE WHEN EXISTS(SELECT 1 FROM "SystemBootstrap" b JOIN "Principal" p ON p.id=b."ownerPrincipalId" WHERE b.id=\'system\' AND p.id=? AND p.provider=? AND p."providerSubject"=?) THEN 1 ELSE 0 END',...identity);
    const mutation=this.stmt('INSERT INTO "AppManagementSsoLink" (issuer,subject,"principalId") SELECT ?,?,? WHERE NOT EXISTS(SELECT 1 FROM "AppManagementSsoLink" WHERE issuer=? AND (subject=? OR "principalId"=?))',issuer,subject,ownerId,issuer,subject,ownerId);
    const rs=await this.db.batch([guard,this.stmt('DELETE FROM blueprint_atomic_guard WHERE id=1'),mutation,this.linkRead(subject)]);
    if(rs.length!==4||rs.some(r=>r.success!==true))throw Error('SSO write result unavailable; reconcile before retry');
    const found=link(one(rs[3]!));if(!found||found.revokedAt||found.principalId!==ownerId)throw Error('SSO link conflict');return found;
  }
}
