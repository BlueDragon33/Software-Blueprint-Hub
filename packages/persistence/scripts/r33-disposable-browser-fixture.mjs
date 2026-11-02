// Disposable CI-only QA fixture; never reuse against any managed or production DB.
import pg from "pg";
const {Client}=pg;
const db=process.env.DATABASE_URL ?? "";
const revision=process.env.BLUEPRINT_QA_EXACT_SHA ?? "";
if(!db.endsWith("/blueprint_r33_browser_qa") ||
   !/^[a-f0-9]{40}$/.test(revision) ||
   process.env.BLUEPRINT_ALLOW_LOCAL_HTTP_AUTH!=="true") {
  throw new Error("QA fixture denied: exact ephemeral PostgreSQL and SHA required");
}
const mode=process.argv[2];
if(!["prepare-cmd","make-stale"].includes(mode)){
  throw new Error("Unsupported ephemeral fixture command");
}
const client=new Client({connectionString:db});
await client.connect();
try {
  if(mode==="prepare-cmd"){
    const projectId="project:p6-registry-beta";
    // Complete B4 fixture's known gates only in this disposable database.
    // The fixture's synthetic PASS must never be used as QA/constitutional evidence.
    const gateIds=[
      "gate:quality:evidence","gate:security:authority",
      "gate:ux:human-acceptance","gate:architecture:future-scale",
      "gate:ux:commercial-quality","gate:durability:ageing-regression",
      "gate:operations:dependency-sovereignty",
      "gate:security:resilience-containment","gate:platform:compatibility",
      "gate:critical:independent-verification"
    ];
    for(let i=0;i<gateIds.length;i++){
      const id=gateIds[i],evidenceId="evidence:r33-qa-"+i;
      const now=new Date().toISOString();
      const document={
        id,projectId,name:"Synthetic QA "+id,
        requirements:["QA-only synthetic state: no real PASS"],
        status:"pass",evidenceIds:[evidenceId],
        meta:{schemaVersion:"1.0.0",recordVersion:1,createdAt:now,updatedAt:now}
      };
      await client.query(`INSERT INTO "QualityGate"
        ("id","projectId","schemaVersion","recordVersion","status","document","createdAt","updatedAt")
        VALUES ($1,$2,'1.0.0',1,'pass',$3::jsonb,NOW(),NOW())
        ON CONFLICT ("id") DO UPDATE SET "status"='pass',"document"=$3::jsonb,"updatedAt"=NOW()`,
        [id,projectId,JSON.stringify(document)]);
      const ev={
        id:evidenceId,gateId:id,kind:"test",
        source:"synthetic-disposable-browser-fixture",
        revision,createdAt:now
      };
      await client.query(`INSERT INTO "GateEvidence"
        ("id","gateId","kind","source","revision","document")
        VALUES ($1,$2,'test',$3,$4,$5::jsonb)
        ON CONFLICT ("id") DO UPDATE SET "revision"=$4,"document"=$5::jsonb`,
        [evidenceId,id,ev.source,revision,JSON.stringify(ev)]);
    }
    await client.query(`UPDATE "WorkPackage" SET
      "status"='completed',"document"=jsonb_set("document",'{status}','"completed"'::jsonb)
      WHERE "id"='work-package:p6-beta-foundation'`);
    await client.query(`UPDATE "WorkPackage" SET
      "status"='ready',
      "document"=jsonb_set(
        jsonb_set("document",'{status}','"ready"'::jsonb),
        '{acceptanceCriteria}',
        '["BLUEPRINT_CMD_READONLY:git-status"]'::jsonb)
      WHERE "id"='work-package:p6-beta-dashboard'`);
    console.log("SYNTHETIC_QA_CMD_CHECKPOINT_ONLY");
  } else {
    const out=await client.query(`UPDATE "ProjectProfile" SET
      "document"=jsonb_set(
        "document",'{meta,recordVersion}',to_jsonb("recordVersion"+1)),
      "recordVersion"="recordVersion"+1
      WHERE "id"='profile:p6-registry-beta' RETURNING "recordVersion"`);
    if(out.rowCount!==1) throw new Error("Expected exactly one disposable QA profile");
    console.log("SYNTHETIC_QA_STALE_PROFILE_ONLY");
  }
} finally {await client.end();}
