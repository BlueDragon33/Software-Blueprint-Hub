import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const policy=JSON.parse(fs.readFileSync('control/development-runtime-policy.v1.json','utf8'));
const registry=JSON.parse(fs.readFileSync('control/constitution-governed-repositories.json','utf8'));
const adopted=JSON.parse(fs.readFileSync('control/governance-current-view.v1.json','utf8'));
const exception='BlueDragon33/BOIECH_AI';

test('offline default is explicit and preserves the one owner exception',()=>{
 assert.equal(policy.defaultMode,'offline-local-only');
 assert.equal(policy.defaultRemotePublication,'disabled');
 assert.deepEqual(policy.exceptionRepositories,[exception]);
 assert.equal(policy.release.autoDeployOnPush,false);
 assert.equal(policy.release.autoDeployOnCIComplete,false);
 assert.equal(policy.release.onlineWorkflowMustRequireExplicitFutureOwnerOptIn,true);
 assert.equal(policy.localRuntime.networkRequiredForCore,false);
 assert.equal(policy.localRuntime.localDataPersistenceRequired,true);
 assert.equal(policy.localRuntime.appManagementMandatory,false);
});

test('every tracked repository except Bơi Ếch inherits offline development',()=>{
 const repos=new Set([...registry.repositories,...adopted.repositories].map(x=>x.repository));
 assert.ok(repos.size>=18,'Inventory unexpectedly lost tracked apps');
 assert.ok(repos.has(exception),'BOIECH_AI exception must be grounded in canonical inventory');
 assert.equal([...repos].filter(x=>x===exception).length,1);
 assert.equal(repos.size-1,17,'Update inventory assumptions if new projects were admitted');
});

test('policy cannot quietly claim runtime verification or production authority',()=>{
 assert.match(policy.evidence.offlineUsable,/UNVERIFIED/);
 assert.equal(policy.release.onlinePublicationUnauthorizedByThisPolicy,true);
 assert.equal(policy.evidence.legacyLiveDeployments,'NOT_REVOKED');
});
