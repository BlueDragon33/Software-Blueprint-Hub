import { CONSTITUTION_POLICY_VERSION } from "@blueprint-os/application";
import { AuthorizationDeniedError } from "@blueprint-os/core";

import { resolveWebIdentity } from "../../../../src/auth/server-actor";
import { getBlueprintServerRuntime } from "../../../../src/server/runtime";
import {
  inspectExistingP2OwnerSession,
  P2SessionCapabilityDenied
} from "../../../../src/server/p2-owner-session-readiness";

export const dynamic = "force-dynamic";

/**
 * GET is a read-only diagnostic: signed-in GitHub identity -> existing principal
 * -> canonical AuthorityService.require(PROJECT_MUTATE) -> project existence.
 * It never calls resolveWebActor() (which may create a new Principal), never
 * issues a grant and never reads/stores/returns OAuth or session secrets.
 */
export async function GET(): Promise<Response> {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "private, no-store, max-age=0",
    "Pragma": "no-cache",
    "Vary": "Cookie",
    "X-Content-Type-Options": "nosniff"
  };
  try {
    const identity = await resolveWebIdentity();
    if (!identity || identity.provider !== "github") {
      return new Response(JSON.stringify({ status: "AUTHENTICATION_REQUIRED" }), {
        status: 401, headers
      });
    }
    const runtime = getBlueprintServerRuntime();
    const observed = await inspectExistingP2OwnerSession(identity, {
      lookupExistingPrincipal: async (provider, providerSubject) =>
        runtime.prisma.principal.findUnique({
          where: { provider_providerSubject: { provider, providerSubject } },
          select: { id: true }
        }),
      requireProjectMutate: async (principalId, projectId) =>
        runtime.authority.require({ principalId }, projectId, "PROJECT_MUTATE"),
      projectExists: async (projectId) =>
        (await runtime.prisma.project.findUnique({
          where: { id: projectId }, select: { id: true }
        })) !== null
    });
    return new Response(JSON.stringify({
      ...observed,
      activeCodePolicyVersion: CONSTITUTION_POLICY_VERSION,
      diagnosticOnly: true
    }), { status: 200, headers });
  } catch (error) {
    if (error instanceof AuthorizationDeniedError ||
        error instanceof P2SessionCapabilityDenied) {
      return new Response(JSON.stringify({ status: "PROJECT_MUTATE_DENIED" }), {
        status: 403, headers
      });
    }
    // Database outage, unknown schema and unexpected token resolution errors
    // fail closed and never echo details, user identities or secrets.
    return new Response(JSON.stringify({ status: "SESSION_CAPABILITY_UNVERIFIED" }), {
      status: 503, headers
    });
  }
}
