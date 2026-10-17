import "server-only";
import { headers } from "next/headers";
import { assertContinuousMutationOrigin } from "../auth/continuous-mutation-origin";

/** Must run BEFORE any sensitive form input or authenticated database mutation. */
export async function requireContinuousSameOrigin(): Promise<void> {
  const source=await headers();
  assertContinuousMutationOrigin({
    origin:source.get("origin"),host:source.get("host"),
    fetchSite:source.get("sec-fetch-site")
  }, process.env.NODE_ENV!=="production" ||
      process.env.BLUEPRINT_ALLOW_LOCAL_HTTP_AUTH?.trim().toLowerCase()==="true");
}
