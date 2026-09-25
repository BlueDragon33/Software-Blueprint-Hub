import type { AuthConfig } from "@auth/core";
import GitHub from "@auth/core/providers/github";

export interface BlueprintAuthEnvironment {
  readonly authSecret: string;
  readonly githubClientId: string;
  readonly githubClientSecret: string;
}

function requireValue(name: string, value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`Missing required auth configuration: ${name}`);
  }
  return normalized;
}

export function createAuthJsConfig(
  environment: BlueprintAuthEnvironment
): AuthConfig {
  const secret = requireValue("AUTH_SECRET", environment.authSecret);
  const clientId = requireValue("GITHUB_ID", environment.githubClientId);
  const clientSecret = requireValue(
    "GITHUB_SECRET",
    environment.githubClientSecret
  );

  return {
    secret,
    basePath: "/api/auth",
    trustHost: true,
    session: { strategy: "jwt" },
    callbacks: {
      jwt({ token, account }) {
        if (account?.provider) {
          token.blueprintProvider = account.provider;
        }
        if (account?.providerAccountId) {
          token.blueprintProviderSubject = account.providerAccountId;
        }
        return token;
      }
    },
    providers: [
      GitHub({
        clientId,
        clientSecret
      })
    ]
  };
}
