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

test('github-first engineering applies to all projects including the offline runtime exception',()=>{
 const workflow=policy.deliveryWorkflow;
 assert.equal(workflow.appliesTo,'all-governed-and-future-projects-including-runtime-exceptions');
 assert.equal(workflow.primaryEngineeringSurface,'github');
 assert.match(workflow.preferredAutomation,/github-actions/);
 assert.equal(workflow.workMode,'optional-only-when-existing-github-runtime-cannot-perform-the-task');
 assert.equal(workflow.windowsPowerShell,'last-resort-one-batched-check-after-github-work-is-consolidated');
 assert.equal(workflow.adHocPowerShellBetweenGitHubChanges,false);
 assert.equal(workflow.productionFromGreenCI,false);
 assert.equal(workflow.productionFromMerge,false);
 assert.equal(workflow.releaseRequiresNamedAppExactShaAndHumanAuthority,true);
 assert.equal(workflow.zeroSpendDefault,true);
 assert.ok(workflow.changeSequence.indexOf('run-scoped-tests-and-inspect-failure-logs') <
           workflow.changeSequence.indexOf('request-human-release-approval-if-applicable'));
 assert.ok(workflow.changeSequence.indexOf('request-human-release-approval-if-applicable') <
           workflow.changeSequence.indexOf('publish-only-through-authorized-manual-release'));
 assert.deepEqual(policy.exceptionRepositories,[exception],'Bơi Ếch online runtime exception remains explicit');
});

test('offline-first is designed and measured, never granted by a policy declaration',()=>{
 const design=policy.offlineFirstDesign;
 assert.equal(design.localCorePreferred,true);
 assert.equal(design.offlineWhenTechnicallyFeasible,true);
 assert.equal(design.noFakeOfflineOnHostedWeb,true);
 assert.equal(design.localDurableStateAndRestartRecoveryRequired,true);
 assert.equal(design.offlineMutationRequiresVersionedQueueAndConflictHandling,true);
 assert.equal(design.authorityActionsFailClosedWhileOfflineUnlessExplicitlyAuthorizedLocalTrustExists,true);
 assert.equal(design.onlineOnlyCapabilityMustDeclareNecessityAndDisconnectedFallback,true);
 assert.equal(design.onlineTrafficBaselineAndAfterEvidenceRequiredBeforeClaimingLoadReduction,true);
 assert.equal(design.networkBudgetAndRetryBackoffRequiredForOnlineAdapters,true);
 assert.equal(design.syncRequiresReconciliationIdempotencyAndExplicitStatus,true);
 assert.match(design.offlineStatus,/UNVERIFIED/);
 assert.equal(design.noMassOfflineComplianceFromPolicyAdoption,true);
 assert.equal(policy.universalConstitutionVersion,'1.3.0');
 assert.equal(policy.release.onlinePublicationUnauthorizedByThisPolicy,true);
});
