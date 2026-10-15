/** Only maps a verified App-Manage Google Owner to an existing Hub
 * constitutional Owner. Never provisions a Principal or grants any role.
 */
export interface ExistingHubOwner {
  readonly id: string;
  readonly email: string | null;
  readonly provider: string;
}
export interface VerifiedManagementIdentity {
  readonly email: string;
  readonly subject: string;
  readonly appManageRole: "owner";
}
export function matchingExistingHubOwner(
  identity: VerifiedManagementIdentity,
  owner: ExistingHubOwner | null
): string | null {
  if (!owner || identity.appManageRole !== "owner" || owner.provider !== "github") return null;
  const email = owner.email?.trim().toLowerCase();
  if (!email || email !== identity.email.trim().toLowerCase()) return null;
  if (identity.subject !== identity.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return owner.id;
}

/** Reuse an independently established GitHub session, not a Google role. */
export function hasExistingGitHubOwnerSession(
  session: { readonly provider: string; readonly providerSubject: string } | null,
  owner: { readonly provider: string; readonly providerSubject: string } | null
): boolean {
  return !!session && !!owner && session.provider === "github" &&
    owner.provider === "github" && !!session.providerSubject &&
    session.providerSubject === owner.providerSubject;
}
