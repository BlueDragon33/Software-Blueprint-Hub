// Declarations describe the tested JS candidate boundary; full integration typecheck still required.
import type { AuthorityRepository } from "../../packages/core/src/authority";
import type { D1CanonicalBinding } from "./d1-canonical-binding";
export class D1AuthorityRepository implements AuthorityRepository {
  constructor(db:D1CanonicalBinding, conflict:new()=>Error);
  resolvePrincipal:AuthorityRepository["resolvePrincipal"];
  bootstrapOwner:AuthorityRepository["bootstrapOwner"];
  isSystemOwner:AuthorityRepository["isSystemOwner"];
  findProjectRole:AuthorityRepository["findProjectRole"];
  listProjectRolesForPrincipal:AuthorityRepository["listProjectRolesForPrincipal"];
  setProjectRole:AuthorityRepository["setProjectRole"];
}
