import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const read=(path)=>readFileSync(path,"utf8");
const json=(path)=>JSON.parse(read(path));
const candidate=json("control/spatial-resource-ux.candidate.v1.json");
const law=read("docs/UNIVERSAL-CONSTITUTION.md");
const contract=json("control/universal-constitution.contract.json");
const policy=json("control/universal-constitution-version.json");
const proposal=read("docs/amendments/CONSTITUTION-SPATIAL-RESOURCE-UX-20261115-PROPOSAL.md");

test("spatial resource UX remains a non-ratified proposal; published 1.3.0 is unchanged",()=>{
 assert.equal(candidate.status,"PROPOSED_ONLY_NOT_RATIFIED");
 assert.equal(candidate.stage,"DRAFT");
 assert.equal(candidate.humanRatification,false);
 assert.equal(candidate.published,false);
 assert.equal(candidate.productionReleaseAuthority,false);
 assert.equal(candidate.automaticCrossProjectAdoption,false);
 assert.equal(policy.policyVersion,"1.3.0");
 assert.equal(contract.policyVersion,"1.3.0");
 assert.match(law,/Status: \*\*ACTIVE UNIVERSAL LAW\*\*/);
 assert.match(law,/Policy version: \*\*1\.3\.0\*\*/);
 assert.match(proposal,/DRAFT — NOT RATIFIED — NOT PUBLISHED/);
});

test("reuse existing quality authority and computed contrast: no invented gate or weakened ratios",()=>{
 const publishedIds=new Set([
  ...contract.pillars.flatMap(p=>p.requirementIds),
  ...contract.executionRules.map(r=>r.requirementId)
 ]);
 for(const id of candidate.existingRequirements)
  assert.ok(publishedIds.has(id),`proposed rule must inherit an existing gate or module: ${id}`);
 assert.equal(candidate.presentation.existingContrastThresholds,"inherit-published-section-11-without-overrides");
 assert.equal(contract.computedContrast.normalTextRatio,4.5);
 assert.equal(contract.computedContrast.largeTextRatio,3);
 assert.equal(contract.computedContrast.meaningfulNonTextRatio,3);
 assert.match(proposal,/Section 11\/WCAG 2\.2 AA/);
});

test("3D art is not universal, canonical inventory owns counts and templates require explicit actions",()=>{
 assert.equal(candidate.scope.spatialOrIsometricVisuals,"optional-user-value-driven-not-universal");
 assert.equal(candidate.scope.nonSpatialProducts,"no-forced-3d-or-building-hierarchy");
 assert.equal(candidate.scope.canonicalResourceOwner,"owning-application");
 assert.equal(candidate.templateLifecycle.previewStatus,"NOT_CREATED");
 assert.equal(candidate.templateLifecycle.excludedFromPersistedCounts,true);
 assert.equal(candidate.templateLifecycle.createMode,"explicit-authorized-write-only");
 assert.equal(candidate.templateLifecycle.preventDuplicateIdentity,true);
 assert.equal(candidate.templateLifecycle.requiresReadback,true);
 assert.match(proposal,/Do not auto-create resources when opening a page/);
 assert.match(proposal,/not a mandatory design style/);
});

test("unknown practice-pool configuration fails closed and cannot be represented as certified",()=>{
 assert.equal(candidate.templateLifecycle.unknownCapacity,"CONFIGURATION_REQUIRED");
 assert.equal(candidate.templateLifecycle.scheduleBeforeVerifiedActivation,"BLOCKED");
 assert.equal(candidate.templateLifecycle.permissionEnforcement,"server");
 assert.equal(candidate.templateLifecycle.resilientToPartialCreate,true);
 assert.match(proposal,/not actual safety facts/);
 assert.match(proposal,/Unknown safety\/capacity values fail closed/);
 assert.match(proposal,/Tầng \/ khối/);
});

test("source evidence is exact merged Boi Ech SHA, not invented rollout success",()=>{
 assert.equal(candidate.evidenceReference.repository,"BlueDragon33/BOIECH_AI");
 assert.equal(candidate.evidenceReference.mergedMainSha,"8f4531f6788c84020c3851ec669d963e3b7bbadb");
 assert.equal(candidate.evidenceReference.classification,"MERGED_SOURCE_NOT_PRODUCTION_OR_UX_ACCEPTANCE");
 assert.equal(candidate.verification.ciAloneDoesNotMeanProductPass,true);
 assert.equal(candidate.verification.mergeDoesNotMeanDeploy,true);
 assert.match(proposal,/MERGED SOURCE/);
 assert.match(proposal,/not Cloudflare Production deployment/);
});

test("constitutional authority and parallel amendment collision remain unresolved",()=>{
 assert.equal(candidate.independentImpactReview,"PENDING");
 assert.equal(candidate.independentUxReview,"PENDING");
 assert.equal(candidate.collisionReviewWithContentFirst,"PENDING");
 assert.match(proposal,/CONTENT-FIRST-001/);
 assert.match(proposal,/authenticated append-only Constitutional Authority ratification/);
 assert.match(proposal,/No cross-project silent propagation or ratification is claimed/);
});
