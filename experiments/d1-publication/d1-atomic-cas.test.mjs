import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { guardSchema, guardedAtomicBatch } from "./d1-atomic-cas.mjs";

// Real SQLite transaction fixture; deliberately not a D1 or authenticated runtime claim.
function fixture() {
  const sql = new DatabaseSync(":memory:");
  sql.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE owner(id TEXT PRIMARY KEY);
    CREATE TABLE amendment(id TEXT PRIMARY KEY, version INTEGER NOT NULL, state TEXT NOT NULL);
    CREATE TABLE decision(id TEXT PRIMARY KEY, amendment TEXT NOT NULL REFERENCES amendment(id), version INTEGER NOT NULL, reviewer TEXT NOT NULL, approved INTEGER NOT NULL, human INTEGER NOT NULL, production INTEGER NOT NULL);
    CREATE TABLE revision(amendment TEXT NOT NULL REFERENCES amendment(id), version INTEGER NOT NULL, PRIMARY KEY(amendment,version));
    CREATE TABLE publication(amendment TEXT PRIMARY KEY REFERENCES amendment(id), policy TEXT UNIQUE NOT NULL, production INTEGER CHECK(production=0));
    INSERT INTO owner VALUES('owner');
    INSERT INTO amendment VALUES('a',5,'ratified');
    INSERT INTO decision VALUES('d','a',4,'owner',1,1,0);
    INSERT INTO revision VALUES('a',5);` + guardSchema);
  const db = {
    prepare(query) { return {query, values: [], bind(...values) { return {...this, values}; }}; },
    async batch(statements) {
      sql.exec("BEGIN IMMEDIATE");
      try {
        const results = statements.map(s => { sql.prepare(s.query).run(...s.values); return {success:true}; });
        sql.exec("COMMIT"); return results;
      } catch (error) { sql.exec("ROLLBACK"); throw error; }
    }
  };
  const cas = (actor="owner", version=5) => db.prepare(`UPDATE amendment SET version=version+1,state='published'
    WHERE id='a' AND version=? AND state='ratified'
      AND EXISTS(SELECT 1 FROM owner WHERE id=?)
      AND EXISTS(SELECT 1 FROM decision WHERE id='d' AND amendment='a' AND version=? AND reviewer=? AND approved=1 AND human=1 AND production=0)`).bind(version,actor,version-1,actor);
  const appends = () => [db.prepare("INSERT INTO publication VALUES('a','1.4.0',0)"),db.prepare("INSERT INTO revision VALUES('a',6)")];
  const state = () => sql.prepare("SELECT version,state FROM amendment WHERE id='a'").get();
  const count = table => sql.prepare(`SELECT count(*) AS n FROM ${table}`).get().n;
  return {sql,db,cas,appends,state,count};
}
function unchanged(f) { assert.equal(f.state().version,5);assert.equal(f.state().state,"ratified");assert.equal(f.count("publication"),0);assert.equal(f.count("revision"),1);assert.equal(f.count("blueprint_atomic_guard"),0); }
test("valid CAS appends atomically", async()=>{const f=fixture();try{await guardedAtomicBatch(f.db,f.cas(),f.appends());assert.equal(f.state().version,6);assert.equal(f.count("publication"),1);assert.equal(f.count("revision"),2);assert.equal(f.count("blueprint_atomic_guard"),0);}finally{f.sql.close();}});
test("stale revision rolls back before append", async()=>{const f=fixture();try{await assert.rejects(guardedAtomicBatch(f.db,f.cas("owner",4),f.appends()));unchanged(f);}finally{f.sql.close();}});
test("wrong owner rolls back", async()=>{const f=fixture();try{await assert.rejects(guardedAtomicBatch(f.db,f.cas("other"),f.appends()));unchanged(f);}finally{f.sql.close();}});
test("revoked owner rolls back", async()=>{const f=fixture();try{f.sql.exec("DELETE FROM owner");await assert.rejects(guardedAtomicBatch(f.db,f.cas(),f.appends()));unchanged(f);}finally{f.sql.close();}});
test("missing or invalid human decision rolls back", async()=>{for(const edit of ["DELETE FROM decision","UPDATE decision SET human=0","UPDATE decision SET approved=0","UPDATE decision SET production=1","UPDATE decision SET version=3"]){const f=fixture();try{f.sql.exec(edit);await assert.rejects(guardedAtomicBatch(f.db,f.cas(),f.appends()));unchanged(f);}finally{f.sql.close();}}});
test("append constraint failure rolls back update and earlier append", async()=>{const f=fixture();try{await assert.rejects(guardedAtomicBatch(f.db,f.cas(),[...f.appends(),f.appends()[1]]));unchanged(f);}finally{f.sql.close();}});
test("replay of committed mutation fails without duplicate records", async()=>{const f=fixture();try{await guardedAtomicBatch(f.db,f.cas(),f.appends());await assert.rejects(guardedAtomicBatch(f.db,f.cas(),f.appends()));assert.equal(f.state().version,6);assert.equal(f.count("publication"),1);assert.equal(f.count("revision"),2);}finally{f.sql.close();}});
test("multi-row mutation fails closed", async()=>{const f=fixture();try{f.sql.exec("INSERT INTO amendment VALUES('b',5,'ratified')");await assert.rejects(guardedAtomicBatch(f.db,f.db.prepare("UPDATE amendment SET version=6"),f.appends()));unchanged(f);assert.equal(f.sql.prepare("SELECT version FROM amendment WHERE id='b'").get().version,5);}finally{f.sql.close();}});
