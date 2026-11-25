// Actual workerd/D1 local admission. Never connects to a remote Cloudflare account.
// Run with existing Node 24 and installed Miniflare:
// node --experimental-transform-types --test experiments/d1-publication/d1-workerd-gate.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { D1AuthorityRepository } from './d1-authority-repository.mjs';
import { D1ConstitutionAuthorityRepository } from './d1-constitution-repository.mjs';
import { D1DomainStore } from './d1-domain-store.ts';
import { D1LogStore } from './d1-log-store.ts';
import { D1SsoStore } from './d1-sso-store.ts';
import * as codecs from '../../packages/persistence/src/constitution-codecs.ts';
if (Number(process.versions.node.split('.')[0])!==24) throw Error('D1_GATE_BLOCKED: Node 24 required');
const {Miniflare}=await import('miniflare').catch(()=>{throw Error('D1_GATE_BLOCKED: existing Miniflare/workerd installation required')});
const schema=readFileSync(new URL('../../packages/persistence/d1/migrations/0001_candidate_schema.sql',import.meta.url),'utf8');
assert.equal(createHash('sha256').update(schema).digest('hex'),'6208ea7b05db58673e1aea0d2911f2164f78e02c892473b9b4e076ec372ef0f7');
class Conflict extends Error {}
test('real local workerd D1: schema, concurrent bootstrap/CAS, canonical codec lifecycle, journal and SSO',async()=>{
 const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("D1 QA fixture only")}}',compatibilityDate:'2026-05-22',host:'127.0.0.1',port:0,d1Databases:{DB:'blueprint-d1-p1-ephemeral'},d1Persist:false});
 try{
  const db=await mf.getD1Database('DB');
  const statements=schema.replace(/^--[^\n]*\n/,'').split(/\n(?=CREATE (?:TABLE|(?:UNIQUE )?INDEX|TRIGGER) )/).map(s=>s.trim()).filter(Boolean);
  assert.equal(statements.length,118);
  for(let i=0;i<statements.length;i+=10){const results=await db.batch(statements.slice(i,i+10).map(s=>db.prepare(s)));assert.ok(results.every(r=>r.success===true));}
  const tableCount=await db.prepare("SELECT count(*) n FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'").first();
  assert.equal(tableCount.n,28);
  const auth=new D1AuthorityRepository(db,Conflict);
  const identities=[{provider:'github',providerSubject:'fixture-owner-a'},{provider:'github',providerSubject:'fixture-owner-b'}];
  const owners=await Promise.allSettled(identities.map(i=>auth.bootstrapOwner(i)));
  const winners=owners.filter(x=>x.status==='fulfilled');assert.equal(winners.length,1);assert.equal(owners.filter(x=>x.status==='rejected').length,1);
  const actor=winners[0].value.id;assert.equal(await auth.isSystemOwner(actor),true);
  const count=async table=>(await db.prepare('SELECT count(*) AS n FROM "'+table+'"').first()).n;
  assert.equal(await count('AuthorityAuditEvent'),1);
  const domain=new D1DomainStore(db),logs=new D1LogStore(db),sso=new D1SsoStore(db);
  const prof={id:'profile:fixture',projectId:'project:fixture',schemaVersion:'1.0.0',recordVersion:1,document:{fixture:true}};
  await domain.createProjectWithProfile(prof.projectId,prof);
  const {id,projectId,...data}=prof;data.recordVersion=2;
  const cas=()=>domain.updateMany('ProjectProfile',{where:{projectId,recordVersion:1},data});
  const results=await Promise.all([cas(),cas()]);assert.deepEqual(results.map(x=>x.count).sort(),[0,1]);
  const repo=new D1ConstitutionAuthorityRepository(db,codecs,Conflict);
  const now='2026-11-25T19:00:00.000Z',revision='a'.repeat(40),digest='sha256:'+'b'.repeat(64);
  let record={proposal:{id:'amendment:fixture',basePolicyVersion:'1.3.0',targetPolicyVersion:'1.4.0',title:'Test fixture only',problem:'Fixture',rationale:'Fixture',affectedPillarIds:['fixture'],affectedRequirementIds:['fixture'],compatibilityRisk:'low',migrationRequired:true,proposedAt:now},state:'draft',impactEvidenceIds:[],migrationEvidenceIds:[],ratificationDecisionId:null,publicationEvidenceId:null,propagationEvidenceIds:[],verificationEvidenceIds:[],productionReleaseAuthority:false,proposedByActorId:actor,recordVersion:1,createdAt:now,updatedAt:now};
  await repo.createAmendment(record);assert.deepEqual(await repo.findAmendmentById(record.proposal.id),record);
  const makeEvidence=(kind,source='fixture')=>({id:'fixture:'+kind,amendmentId:record.proposal.id,kind,source,revision,digest,note:'fixture only',recordedByActorId:actor,createdAt:now});
  const next=(state,extra={})=>({...record,...extra,state,recordVersion:record.recordVersion+1});
  for(const [kind,state,ids,action] of [['impact','impact-reviewed','impactEvidenceIds','IMPACT_REVIEW_COMPLETED'],['migration','migration-ready','migrationEvidenceIds','MIGRATION_PLAN_COMPLETED']]){
    const e=makeEvidence(kind),n=next(state,{[ids]:[e.id]});await repo.appendEvidenceAndUpdate(e,n,record.recordVersion,actor,action);record=n;
  }
  let n=next('ratification-ready');await repo.updateAmendment(n,record.recordVersion,actor,'RATIFICATION_OPENED');record=n;
  const d={id:'fixture:decision',amendmentId:record.proposal.id,amendmentRecordVersion:record.recordVersion,reviewerActorId:actor,source:'authenticated-user-action',decision:'approve',note:'fixture only; not actual approval',decidedAt:now,humanRatification:true,productionReleaseAuthority:false};
  n=next('ratified',{ratificationDecisionId:d.id});await repo.appendRatificationDecisionAndUpdate(d,n,record.recordVersion);record=n;
  const e=makeEvidence('publication','trusted-ci-attestation:1');
  const p={id:'fixture:publication',amendmentId:record.proposal.id,amendmentRecordVersion:record.recordVersion,policyVersion:'1.4.0',publishedByActorId:actor,sourceRevision:revision,ciRunId:'1',authoritySetDigest:digest,components:[],publishedAt:now,productionReleaseAuthority:false};
  n=next('published',{publicationEvidenceId:e.id});
  await assert.rejects(repo.appendPublicationAndUpdate({...p,authoritySetDigest:'sha256:'+'c'.repeat(64)},e,n,record.recordVersion));
  assert.equal(await count('ConstitutionPublication'),0);
  await db.prepare("CREATE TRIGGER fixture_pub_failure BEFORE INSERT ON ConstitutionPublication BEGIN SELECT RAISE(ABORT,'fixture rollback'); END").run();
  await assert.rejects(repo.appendPublicationAndUpdate(p,e,n,record.recordVersion));assert.equal(await count('ConstitutionEvidence'),2);assert.equal((await repo.findAmendmentById(record.proposal.id)).state,'ratified');
  await db.prepare('DROP TRIGGER fixture_pub_failure').run();
  await repo.appendPublicationAndUpdate(p,e,n,record.recordVersion);assert.deepEqual(await repo.findPublicationByAmendmentId(record.proposal.id),p);
  await assert.rejects(db.prepare('DELETE FROM ConstitutionPublication').run());
  const requestId='sha256:'+'d'.repeat(64);
  const claims=await Promise.all([logs.claim(requestId,new Date('2099-01-01')),logs.claim(requestId,new Date('2099-01-01'))]);assert.deepEqual(claims.sort(),[false,true]);
  const owner=await sso.currentOwner();assert.equal(owner.id,actor);
  await sso.linkExistingOwner('fixture-subject',actor,owner.provider,owner.providerSubject);assert.equal(await logs.linkedPrincipal('application-management','fixture-subject',actor),actor);
  await db.prepare("UPDATE AppManagementSsoLink SET revokedAt='2026-11-25T19:00:00.000Z'").run();
  assert.equal(await logs.linkedPrincipal('application-management','fixture-subject',actor),null);
  assert.equal((await db.prepare('PRAGMA foreign_key_check').all()).results.length,0);
 }finally{await mf.dispose()}
});
