/**
 * Safe, nonpersistent P2 Owner-session capability probe.
 *
 * Unlike resolveWebActor(), this probe MUST NOT resolve/create a principal.
 * It only finds a pre-existing canonical principal from an authenticated
 * GitHub JWT identity, then calls AuthorityService.require(PROJECT_MUTATE).
 *
 * This is NOT a Work Package grant, QA approval, issuer allow, journal claim,
 * signature, deployment approval or Production permission.
 */
export const P2_OWNER_PROJECT_ID = "project:blueprint-os" as const;

export interface P2SessionIdentity {
  readonly provider: string;
  readonly providerSubject: string;
}

export type P2SessionCapability = Readonly<{
  status: "PROJECT_MUTATE_SESSION_VERIFIED";
  projectId: typeof P2_OWNER_PROJECT_ID;
  capability: "PROJECT_MUTATE";
  admissionApproved: false;
  humanApproved: false;
  qualityGatePassed: false;
  authenticatedE2EVerified: false;
  productionAuthorized: false;
}>;

export class P2SessionCapabilityDenied extends Error {
  constructor(message: string) {
    super("P2_SESSION_DENIED: " + message);
    this.name = "P2SessionCapabilityDenied";
  }
}

export async function inspectExistingP2OwnerSession(
  identity: P2SessionIdentity | null,
  sources: {
    readonly lookupExistingPrincipal: (provider: string, subject: string) =>
      Promise<{ readonly id: string } | null>;
    readonly requireProjectMutate: (principalId: string, projectId: typeof P2_OWNER_PROJECT_ID) =>
      Promise<void>;
    readonly projectExists: (projectId: typeof P2_OWNER_PROJECT_ID) => Promise<boolean>;
  }
): Promise<P2SessionCapability> {
  if (!identity || identity.provider !== "github" ||
      typeof identity.providerSubject !== "string" ||
      !/^[0-9]{1,30}$/.test(identity.providerSubject)) {
    throw new P2SessionCapabilityDenied("missing authenticated GitHub subject");
  }
  // Never create or bootstrap a principal, change an assignment, or write audit
  // evidence. Deny if the signed-in identity does not already exist.
  const principal = await sources.lookupExistingPrincipal(
    identity.provider, identity.providerSubject
  );
  if (!principal?.id) throw new P2SessionCapabilityDenied("canonical principal not found");
  await sources.requireProjectMutate(principal.id, P2_OWNER_PROJECT_ID);
  if (!(await sources.projectExists(P2_OWNER_PROJECT_ID))) {
    throw new P2SessionCapabilityDenied("canonical project does not exist");
  }
  return Object.freeze({
    status: "PROJECT_MUTATE_SESSION_VERIFIED",
    projectId: P2_OWNER_PROJECT_ID, capability: "PROJECT_MUTATE",
    admissionApproved: false, humanApproved: false,
    qualityGatePassed: false, authenticatedE2EVerified: false,
    productionAuthorized: false
  });
}
