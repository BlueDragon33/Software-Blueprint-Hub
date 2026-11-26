// Declarations describe the tested JS candidate boundary; full integration typecheck still required.
import type { ConstitutionAuthorityRepository } from "../../packages/core/src/constitution-authority";
import type { D1CanonicalBinding } from "./d1-canonical-binding";
export class D1ConstitutionAuthorityRepository implements ConstitutionAuthorityRepository {
  constructor(db:D1CanonicalBinding, codecs:typeof import("../../packages/persistence/src/constitution-codecs"), conflict:new(amendmentId:string, expectedRecordVersion:number)=>Error);
  createAmendment:ConstitutionAuthorityRepository["createAmendment"];
  findAmendmentById:ConstitutionAuthorityRepository["findAmendmentById"];
  listAmendments:ConstitutionAuthorityRepository["listAmendments"];
  updateAmendment:ConstitutionAuthorityRepository["updateAmendment"];
  appendEvidenceAndUpdate:ConstitutionAuthorityRepository["appendEvidenceAndUpdate"];
  listEvidence:ConstitutionAuthorityRepository["listEvidence"];
  appendRatificationDecisionAndUpdate:ConstitutionAuthorityRepository["appendRatificationDecisionAndUpdate"];
  findRatificationDecision:ConstitutionAuthorityRepository["findRatificationDecision"];
  findRatificationDecisionById:ConstitutionAuthorityRepository["findRatificationDecisionById"];
  appendPublicationAndUpdate:ConstitutionAuthorityRepository["appendPublicationAndUpdate"];
  findPublicationByAmendmentId:ConstitutionAuthorityRepository["findPublicationByAmendmentId"];
}
