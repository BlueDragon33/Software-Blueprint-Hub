import {Miniflare} from "miniflare";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import assert from "node:assert/strict";
import {AuthorityService} from "../../packages/core/src";
import {D1DomainStore,D1LogStore,createD1AuthorityRepository,type D1CanonicalBinding} from "../../packages/persistence/src/d1";
const schema=readFileSync(new URL("../../packages/persistence/d1/migrations/0001_candidate_schema.sql",import.meta.url),"utf8");
assert.equal(createHash("sha256").update(schema).digest("hex"),"6208ea7b05db58673e1aea0d2911f2164f78e02c892473b9b4e076ec372ef0f7");
if(Number(process.versions.node.split(".")[0])!==24)throw Error("Node24 required");
export async function newD1Fixture(){
  const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("isolated D1 fixture")}}',compatibilityDate:"2026-05-15",host:"127.0.0.1",port:0,d1Databases:{DB:"blueprint-parity-fixture"},d1Persist:false});
  try{
    const db=await mf.getD1Database("DB");
    const sql=schema.replace(/^--[^\n]*\n/,"").split(/\n(?=CREATE (?:TABLE|(?:UNIQUE )?INDEX|TRIGGER) )/).map(s=>s.trim()).filter(Boolean);
    assert.equal(sql.length,118);
    for(let i=0;i<sql.length;i+=10)assert.ok((await db.batch(sql.slice(i,i+10).map(s=>db.prepare(s)))).every(x=>x.success));
    const binding=db as unknown as D1CanonicalBinding;
    const domain=new D1DomainStore(binding),logs=new D1LogStore(binding);
    const authorityRepository=createD1AuthorityRepository(binding);
    const authority=new AuthorityService(authorityRepository);
    const principal=await authority.bootstrapOwner({provider:"github",providerSubject:"isolated-d1-test-admin"});
    const admin={principalId:principal.id};
    return {db,binding,domain,logs,authorityRepository,authority,admin,dispose:()=>mf.dispose()};
  }catch(e){await mf.dispose();throw e;}
}
