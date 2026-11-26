// Canonical identity-link port. Upstream OAuth/PKCE proof remains in the application.
import type { BlueprintPrismaClient } from "@blueprint-os/persistence";
export interface ExistingSsoOwner {id:string;provider:string;providerSubject:string;email:string|null}
export interface ExistingSsoLink {issuer:string;subject:string;principalId:string;revokedAt:Date|null}
export interface SsoIdentityStore {
  findLink(subject:string):Promise<ExistingSsoLink|null>;
  currentOwner():Promise<ExistingSsoOwner|null>;
  findPrincipal(id:string):Promise<{id:string}|null>;
  linkExistingOwner(subject:string,ownerId:string,provider:string,providerSubject:string):Promise<ExistingSsoLink>;
}
const issuer="application-management";
export class PostgresSsoIdentityStore implements SsoIdentityStore {
  constructor(private readonly db:BlueprintPrismaClient){}
  async findLink(subject:string){return this.db.appManagementSsoLink.findUnique({where:{issuer_subject:{issuer,subject}}});}
  async currentOwner(){const b=await this.db.systemBootstrap.findUnique({where:{id:"system"},include:{owner:{select:{id:true,provider:true,providerSubject:true,email:true}}}});return b?.owner??null;}
  async findPrincipal(id:string){return this.db.principal.findUnique({where:{id},select:{id:true}});}
  async linkExistingOwner(subject:string,ownerId:string,provider:string,providerSubject:string){
    if(!subject.trim()||!ownerId.trim()||provider!=="github"||!providerSubject.trim())throw TypeError("Invalid verified Owner identity");
    return this.db.$transaction(async tx=>{
      const owners=await tx.$queryRaw<{id:string}[]>`SELECT p.id FROM "SystemBootstrap" b JOIN "Principal" p ON p.id=b."ownerPrincipalId" WHERE b.id='system' AND p.id=${ownerId} AND p.provider=${provider} AND p."providerSubject"=${providerSubject} FOR SHARE OF b,p`;
      if(owners.length!==1)throw Error("Existing constitutional Owner identity required");
      await tx.$executeRaw`INSERT INTO "AppManagementSsoLink" (issuer,subject,"principalId") VALUES (${issuer},${subject},${ownerId}) ON CONFLICT DO NOTHING`;
      const link=await tx.appManagementSsoLink.findUnique({where:{issuer_subject:{issuer,subject}}});
      if(!link||link.revokedAt||link.principalId!==ownerId)throw Error("SSO link conflict");
      return link;
    });
  }
  async resolveLinkedPrincipal(subject:string,principalId:string){
    const rows=await this.db.$queryRaw<{id:string}[]>`SELECT p.id FROM "AppManagementSsoLink" l JOIN "Principal" p ON p.id=l."principalId" WHERE l.issuer=${issuer} AND l.subject=${subject} AND l."principalId"=${principalId} AND l."revokedAt" IS NULL`;
    if(rows.length>1)throw Error("SSO link is not unique");
    return rows[0]?.id??null;
  }
}
