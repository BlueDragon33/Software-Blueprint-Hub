// Explicit provider candidate: does not import Prisma/pg at runtime.
import { OwnerBootstrapConflictError, ConstitutionRecordVersionConflictError, type AuthorityRepository, type ConstitutionAuthorityRepository } from "@blueprint-os/core";
import { D1AuthorityRepository } from "../../../../experiments/d1-publication/d1-authority-repository.mjs";
import { D1ConstitutionAuthorityRepository } from "../../../../experiments/d1-publication/d1-constitution-repository.mjs";
import type { D1CanonicalBinding } from "../../../../experiments/d1-publication/d1-canonical-binding";
import * as canonicalCodecs from "../constitution-codecs";
export type { D1CanonicalBinding } from "../../../../experiments/d1-publication/d1-canonical-binding";
export { D1DomainStore } from "../../../../experiments/d1-publication/d1-domain-store";
export { D1LogStore } from "../../../../experiments/d1-publication/d1-log-store";
export { D1SsoStore } from "../../../../experiments/d1-publication/d1-sso-store";
export * from "./project-profile-repository";
export * from "./work-quality-repository";
export * from "./governance-repository";
export * from "./release-repository";
export * from "./prompt-history-repository";
export * from "./professional-review-repository";
export * from "./workflow-execution-authority-repository";
export function createD1AuthorityRepository(db:D1CanonicalBinding):AuthorityRepository {
  return new D1AuthorityRepository(db,OwnerBootstrapConflictError);
}
export function createD1ConstitutionAuthorityRepository(db:D1CanonicalBinding):ConstitutionAuthorityRepository {
  return new D1ConstitutionAuthorityRepository(db,canonicalCodecs,ConstitutionRecordVersionConflictError);
}
