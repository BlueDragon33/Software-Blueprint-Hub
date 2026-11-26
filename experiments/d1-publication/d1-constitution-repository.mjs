import { guardedAtomicBatch } from './d1-atomic-cas.mjs';

// Candidate for the canonical repository port, not a runtime/HTTP endpoint.
// Codec functions must be the canonical validated readers; never use identity codecs in deployment.
const states=new Set(['draft','impact-reviewed','migration-ready','ratification-ready','ratified','published','propagating','verified','rejected']);
const json=v=>JSON.stringify(v);
const requireValue=(ok,message)=>{if(!ok)throw new TypeError(message)};
const ownerPredicate='EXISTS(SELECT 1 FROM "SystemBootstrap" WHERE id=\'system\' AND "ownerPrincipalId"=?)';
const reviewedPredicate=` AND EXISTS(SELECT 1 FROM "ConstitutionEvidence" m JOIN "ConstitutionEvidence" i ON i."amendmentId"=m."amendmentId" AND i.revision=m.revision WHERE m."amendmentId"="ConstitutionAmendment".id AND m.kind='migration' AND i.kind='impact' AND length(m.revision)=40 AND m.revision NOT GLOB '*[^0-9a-f]*' AND length(m.digest)=71 AND substr(m.digest,1,7)='sha256:' AND substr(m.digest,8) NOT GLOB '*[^0-9a-f]*' AND m.id IN (SELECT value FROM json_each("ConstitutionAmendment".document,'$.migrationEvidenceIds')) AND i.id IN (SELECT value FROM json_each("ConstitutionAmendment".document,'$.impactEvidenceIds')))`;

const next=(r,v)=>requireValue(Number.isSafeInteger(v)&&v>=1&&r.recordVersion===v+1&&states.has(r.state)&&r.productionReleaseAuthority===false,'Invalid amendment revision or authority');
const readDate=v=>{const d=new Date(v);requireValue(d.toISOString()===v,'Invalid persisted ISO timestamp');return d};
const decode=row=>{if(!row)return null;const out={...row};for(const k of ['createdAt','updatedAt','decidedAt','publishedAt'])if(k in out)out[k]=readDate(out[k]);if('document' in out)out.document=JSON.parse(out.document);for(const k of ['humanRatification','productionReleaseAuthority'])if(k in out){requireValue(out[k]===0||out[k]===1,'Invalid persisted boolean');out[k]=out[k]===1;}return out;};
export class D1ConstitutionAuthorityRepository {
  #db; #codecs; #Conflict;
  constructor(db,codecs,Conflict){
    requireValue(db&&typeof db.prepare==='function'&&typeof db.batch==='function','D1 binding required');
    requireValue(['asAmendment','asEvidence','asDecision','asPublication'].every(k=>typeof codecs?.[k]==='function')&&typeof Conflict==='function','Canonical codecs and revision conflict type required');
    this.#db=db;this.#codecs=codecs;this.#Conflict=Conflict;
  }
  #stmt(sql,...values){return this.#db.prepare(sql).bind(...values)}
  async #one(sql,...values){return decode(await this.#stmt(sql,...values).first())}
  async #all(sql,...values){const result=await this.#stmt(sql,...values).all();requireValue(result.success===true&&Array.isArray(result.results),'D1 read unavailable');return result.results.map(decode)}
  #revision(r,actor,action){return this.#stmt('INSERT INTO "ConstitutionAmendmentRevision" ("id","amendmentId","recordVersion","state","actorPrincipalId","action","document","createdAt") VALUES (?,?,?,?,?,?,?,?)',`${r.proposal.id}:v${r.recordVersion}`,r.proposal.id,r.recordVersion,r.state,actor,action,json(r),r.updatedAt)}
  #evidence(e){return this.#stmt('INSERT INTO "ConstitutionEvidence" ("id","amendmentId","kind","source","revision","digest","note","recordedByActorId","document","createdAt") VALUES (?,?,?,?,?,?,?,?,?,?)',e.id,e.amendmentId,e.kind,e.source,e.revision,e.digest,e.note,e.recordedByActorId,json(e),e.createdAt)}
  #update(r,v,actor,additional='',values=[]){return this.#stmt(`UPDATE "ConstitutionAmendment" SET "recordVersion"=?,"state"=?,"document"=?,"updatedAt"=? WHERE "id"=? AND "recordVersion"=? AND "schemaVersion"='1.0.0' AND "basePolicyVersion"=? AND "targetPolicyVersion"=? AND "title"=? AND "proposedByActorId"=? AND "createdAt"=? AND ${ownerPredicate}${additional}`,r.recordVersion,r.state,json(r),r.updatedAt,r.proposal.id,v,r.proposal.basePolicyVersion,r.proposal.targetPolicyVersion,r.proposal.title,r.proposedByActorId,r.createdAt,actor,...values)}
  async #commit(r,v,cas,appends){try{await guardedAtomicBatch(this.#db,cas,appends)}catch(e){if(/CHECK constraint failed: ok/.test(String(e))){const current=await this.#one('SELECT "recordVersion" FROM "ConstitutionAmendment" WHERE id=?',r.proposal.id);if(current&&current.recordVersion!==v)throw new this.#Conflict(r.proposal.id,v)}throw e;}return r}
  async createAmendment(r){
    requireValue(r.recordVersion===1&&r.state==='draft'&&r.productionReleaseAuthority===false,'New amendment must start at draft v1');
    const cas=this.#stmt(`INSERT INTO "ConstitutionAmendment" ("id","schemaVersion","recordVersion","basePolicyVersion","targetPolicyVersion","title","state","proposedByActorId","document","createdAt","updatedAt") SELECT ?,'1.0.0',?,?,?,?,?,?,?,?,? WHERE ${ownerPredicate}`,r.proposal.id,r.recordVersion,r.proposal.basePolicyVersion,r.proposal.targetPolicyVersion,r.proposal.title,r.state,r.proposedByActorId,json(r),r.createdAt,r.updatedAt,r.proposedByActorId);
    await guardedAtomicBatch(this.#db,cas,[this.#revision(r,r.proposedByActorId,'AMENDMENT_CREATED')]);return r;
  }
  async findAmendmentById(id){const row=await this.#one('SELECT * FROM "ConstitutionAmendment" WHERE id=?',id);return row?this.#codecs.asAmendment(row.document,row):null}
  async listAmendments(){return Object.freeze((await this.#all('SELECT * FROM "ConstitutionAmendment" ORDER BY "updatedAt" DESC,id')).map(row=>this.#codecs.asAmendment(row.document,row)))}
  async updateAmendment(r,v,actor,action){next(r,v);requireValue(r.state==='ratification-ready'&&action==='RATIFICATION_OPENED','Unsupported amendment transition');return this.#commit(r,v,this.#update(r,v,actor," AND \"state\"='migration-ready'"+reviewedPredicate),[this.#revision(r,actor,action)])}
  async appendEvidenceAndUpdate(e,r,v,actor,action){
    next(r,v);const transition={impact:['draft','impact-reviewed','impactEvidenceIds','IMPACT_REVIEW_COMPLETED'],migration:['impact-reviewed','migration-ready','migrationEvidenceIds','MIGRATION_PLAN_COMPLETED'],propagation:['published','propagating','propagationEvidenceIds','CONSTITUTION_PROPAGATION_STARTED'],verification:['propagating','verified','verificationEvidenceIds','CONSTITUTION_VERIFIED']}[e.kind];
    requireValue(transition&&e.amendmentId===r.proposal.id&&e.recordedByActorId===actor&&r.state===transition[1]&&action===transition[3]&&r[transition[2]]?.includes(e.id)&&/^sha256:[a-f0-9]{64}$/.test(e.digest),'Invalid evidence scope');
    return this.#commit(r,v,this.#update(r,v,actor,' AND "state"=?',[transition[0]]),[this.#evidence(e),this.#revision(r,actor,action)]);
  }
  async listEvidence(id){return Object.freeze((await this.#all('SELECT * FROM "ConstitutionEvidence" WHERE "amendmentId"=? ORDER BY "createdAt",id',id)).map(row=>this.#codecs.asEvidence(row)))}
  async appendRatificationDecisionAndUpdate(d,r,v){
    next(r,v);requireValue(d.amendmentId===r.proposal.id&&d.amendmentRecordVersion===v&&d.id===r.ratificationDecisionId&&d.source==='authenticated-user-action'&&d.humanRatification===true&&d.productionReleaseAuthority===false&&((d.decision==='approve'&&r.state==='ratified')||(d.decision==='reject'&&r.state==='rejected')),'Invalid ratification decision');
    const append=this.#stmt('INSERT INTO "ConstitutionRatificationDecision" ("id","amendmentId","amendmentRecordVersion","reviewerActorId","source","decision","note","decidedAt","humanRatification","productionReleaseAuthority","document") VALUES (?,?,?,?,?,?,?,?,1,0,?)',d.id,d.amendmentId,v,d.reviewerActorId,d.source,d.decision,d.note,d.decidedAt,json(d));
    return this.#commit(r,v,this.#update(r,v,d.reviewerActorId,' AND "state"=\'ratification-ready\''+(d.decision==='approve'?reviewedPredicate:'')),[append,this.#revision(r,d.reviewerActorId,d.decision==='approve'?'AMENDMENT_RATIFIED':'AMENDMENT_REJECTED')]);
  }
  async findRatificationDecision(id,v){const row=await this.#one('SELECT * FROM "ConstitutionRatificationDecision" WHERE "amendmentId"=? AND "amendmentRecordVersion"=?',id,v);return row?this.#codecs.asDecision(row):null}
  async findRatificationDecisionById(id){const row=await this.#one('SELECT * FROM "ConstitutionRatificationDecision" WHERE id=?',id);return row?this.#codecs.asDecision(row):null}
  async appendPublicationAndUpdate(p,e,r,v){
    next(r,v);requireValue(p.amendmentId===r.proposal.id&&e.amendmentId===r.proposal.id&&p.amendmentRecordVersion===v&&p.policyVersion===r.proposal.targetPolicyVersion&&p.productionReleaseAuthority===false&&/^[a-f0-9]{40}$/.test(p.sourceRevision)&&/^sha256:[a-f0-9]{64}$/.test(p.authoritySetDigest)&&/^\d+$/.test(p.ciRunId)&&r.state==='published'&&e.kind==='publication'&&e.id===r.publicationEvidenceId&&e.recordedByActorId===p.publishedByActorId&&e.revision===p.sourceRevision&&e.digest===p.authoritySetDigest&&e.source===`trusted-ci-attestation:${p.ciRunId}`&&r.ratificationDecisionId,'Invalid publication scope');
    const guard=` AND "state"='ratified' AND json_extract("document",'$.ratificationDecisionId')=? AND EXISTS(SELECT 1 FROM "ConstitutionRatificationDecision" d WHERE d.id=? AND d."amendmentId"=? AND d."amendmentRecordVersion"=? AND d."reviewerActorId"=? AND d.decision='approve' AND d.source='authenticated-user-action' AND d."humanRatification"=1 AND d."productionReleaseAuthority"=0) AND EXISTS(SELECT 1 FROM "ConstitutionEvidence" m JOIN "ConstitutionEvidence" i ON i."amendmentId"=m."amendmentId" AND i."revision"=m."revision" WHERE m."amendmentId"="ConstitutionAmendment".id AND m.kind='migration' AND i.kind='impact' AND m.revision=? AND m.digest=? AND m.id IN (SELECT value FROM json_each("ConstitutionAmendment".document,'$.migrationEvidenceIds')) AND i.id IN (SELECT value FROM json_each("ConstitutionAmendment".document,'$.impactEvidenceIds')))`;
    const actor=p.publishedByActorId;
    const cas=this.#update(r,v,actor,guard,[r.ratificationDecisionId,r.ratificationDecisionId,r.proposal.id,v-1,actor,p.sourceRevision,p.authoritySetDigest]);
    const append=this.#stmt('INSERT INTO "ConstitutionPublication" ("id","amendmentId","amendmentRecordVersion","policyVersion","publishedByActorId","sourceRevision","ciRunId","authoritySetDigest","productionReleaseAuthority","document","publishedAt") VALUES (?,?,?,?,?,?,?,?,0,?,?)',p.id,p.amendmentId,v,p.policyVersion,actor,p.sourceRevision,p.ciRunId,p.authoritySetDigest,json(p),p.publishedAt);
    return this.#commit(r,v,cas,[this.#evidence(e),append,this.#revision(r,actor,'CONSTITUTION_PUBLISHED')]);
  }
  async findPublicationByAmendmentId(id){const row=await this.#one('SELECT * FROM "ConstitutionPublication" WHERE "amendmentId"=?',id);return row?this.#codecs.asPublication(row):null}
}
