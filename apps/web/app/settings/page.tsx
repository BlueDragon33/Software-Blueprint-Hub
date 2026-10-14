import { AppShell } from "@blueprint-os/ui";
import { HubSettings } from "./hub-settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams
}: {
  readonly searchParams: Promise<{ sso?: string | string[] }>;
}) {
  const query = await searchParams;
  const value = Array.isArray(query.sso) ? query.sso[0] : query.sso;
  return <AppShell><HubSettings ssoStatus={value ?? null} /></AppShell>;
}
