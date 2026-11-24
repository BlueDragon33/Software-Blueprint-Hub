import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { localPublicationBuildRevision } from "../../packages/runtime/src/publication-runtime-revision";

export default function nextConfig(phase: string): NextConfig {
  // Compile the actual clean checkout SHA into a fresh local build. Do not trust
  // arbitrary runtime/request input or silently fall back to the remote main HEAD.
  const localRevision = phase === PHASE_PRODUCTION_BUILD &&
    process.env.BLUEPRINT_LOCAL_PUBLICATION === "true"
    ? localPublicationBuildRevision(process.cwd()) : "";
  return {
    output: "standalone",
    reactStrictMode: true,
    env: { BLUEPRINT_LOCAL_RUNTIME_REVISION: localRevision }
  };
}
