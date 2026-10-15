import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REQUIRED = [
  "product", "architecture", "experience", "implementation", "data", "security",
  "verification", "professional-review", "integration", "release", "operations", "audit"
];
const STAGES = new Set(["DISCOVER", "SPECIFY", "DESIGN", "PLAN", "IMPLEMENT", "TEST", "REVIEW", "RELEASE", "LEARN"]);
const OWNERS = new Set(["product-repository", "hub-policy-and-product-code", "hub-governance", "management-control-plane"]);

export function validateDepartmentOwnership(model) {
  const errors = [];
  const complain = (m) => errors.push(m);
  if (!model || typeof model !== "object" || Array.isArray(model)) return ["model must be an object"];
  if (model.schemaVersion !== "1.0.0" || model.kind !== "execution-department-ownership") complain("unrecognized governance model");
  if (model.status !== "candidate") complain("execution model must remain an unactivated candidate until reviewed");
  if (model.constitution?.policyId !== "blueprint-os:universal-century-grade" || model.constitution?.minimumVersion !== "1.3.0") complain("canonical constitutional policy/version required");
  if (model.constitution?.authority !== "human-ratified-only") complain("constitutional authority must remain human");
  if (model.sourcesOfTruth?.governance !== "BlueDragon33/Software-Blueprint-Hub") complain("Hub must own governance");
  if (model.sourcesOfTruth?.appOperations !== "BlueDragon33/Application-Management") complain("Application Management must own operations metadata");
  if (model.sourcesOfTruth?.workflowDefinitions !== "prompt-workflows/") complain("reuse canonical prompt workflow library");
  if (!Array.isArray(model.departments)) {
    complain("departments must be an array");
  } else {
    const ids = new Set();
    for (const item of model.departments) {
      if (!item || typeof item !== "object") { complain("invalid department"); continue; }
      if (!REQUIRED.includes(item.id) || ids.has(item.id)) complain("invalid or duplicate department " + String(item.id));
      ids.add(item.id);
      if (!OWNERS.has(item.defaultOwner)) complain("invalid owner for " + item.id);
      if (!STAGES.has(item.stage)) complain("invalid stage for " + item.id);
      for (const key of ["accountability", "requiredInput", "verifiableOutput", "requiredEvidence"]) {
        if (typeof item[key] !== "string" || !item[key].trim()) complain("missing " + key + " for " + item.id);
      }
      for (const key of ["ratifyConstitution", "passQualityGate", "authorizeProduction"]) {
        if (item.authority?.[key] !== false) complain("implicit authority " + key + " in " + item.id);
      }
    }
    for (const id of REQUIRED) if (!ids.has(id)) complain("missing department " + id);
    if (ids.size !== REQUIRED.length) complain("expected exactly 12 departments");
  }
  const handoff = model.handoff;
  if (!Array.isArray(handoff?.requires) || handoff.requires.length < 5) complain("handoff must include bounded exact-source evidence");
  if (!Array.isArray(handoff?.independentVerificationRequired) || !["implementation", "data", "security", "release"].every(x => handoff.independentVerificationRequired.includes(x))) complain("independent verification is mandatory");
  if (typeof handoff?.completionPolicy !== "string" || !handoff.completionPolicy.includes("canonical")) complain("canonical acceptance required");
  if (typeof handoff?.failurePolicy !== "string" || !handoff.failurePolicy.includes("no unrestricted retry")) complain("retry must be bounded");
  const split = model.repositorySeparation;
  if (split?.candidateIndependentService !== "execution-worker") complain("expected a reviewed execution-worker candidate, not an auto-created repository");
  const conditions = split?.splitIfAnyVerified;
  if (!Array.isArray(conditions) || conditions.length !== 3 ||
      new Set(conditions.map(c => c?.id)).size !== 3 ||
      !conditions.every(c => c && typeof c.criteria === "string" && c.criteria.trim() && typeof c.evidence === "string" && c.evidence.trim())) {
    complain("repo split requires 3 measurable, non-empty evidence criteria");
  }
  if (!Array.isArray(split?.beforeSplit) || split.beforeSplit.length < 4) complain("independent deployment must be reviewed before split");
  if (!Array.isArray(split?.neverMove) || split.neverMove.length < 3) complain("canonical authority boundary must stay in Hub");
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const file = process.argv[2] ?? "control/execution-department-ownership.v1.json";
    const model = JSON.parse(readFileSync(file, "utf8"));
    const errors = validateDepartmentOwnership(model);
    if (errors.length) {
      for (const error of errors) console.error("[execution-departments] " + error);
      process.exitCode = 1;
    } else console.log("[execution-departments] PASS: 12 bounded responsibilities; repo split remains evidence-gated candidate");
  } catch (error) {
    console.error("[execution-departments] failed:", error.message);
    process.exitCode = 1;
  }
}
