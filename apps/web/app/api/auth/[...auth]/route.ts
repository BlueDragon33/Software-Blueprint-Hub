import { Auth } from "@auth/core";

import { createAuthJsConfig } from "../../../../src/auth/authjs-config";

function authConfig() {
  return createAuthJsConfig({
    authSecret: process.env.AUTH_SECRET ?? "",
    githubClientId: process.env.GITHUB_ID ?? "",
    githubClientSecret: process.env.GITHUB_SECRET ?? ""
  });
}

async function handler(request: Request): Promise<Response> {
  return Auth(request, authConfig());
}

export { handler as GET, handler as POST };
