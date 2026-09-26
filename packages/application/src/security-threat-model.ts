import { createHash } from "node:crypto";

export type ThreatSeverity = "low" | "medium" | "high" | "critical";
export type ThreatStatus = "mitigated" | "accepted" | "open";
export type ThreatCategory =
  | "trust-boundary"
  | "credential"
  | "privilege-escalation"
  | "destructive-operation"
  | "cross-project-leakage"
  | "provider-authority"
  | "ai-authority"
  | "release-authority"
  | "data-integrity";

export interface SecurityThreatInput {
  readonly id: string;
  readonly category: ThreatCategory;
  readonly title: string;
  readonly severity: ThreatSeverity;
  readonly trustZone: string;
  readonly attackPath: string;
  readonly mitigation: string;
  readonly owner: string;
  readonly evidence: readonly string[];
  readonly status: ThreatStatus;
}

export interface SecurityThreatModelInput {
  readonly projectId: string;
  readonly sourceRevision: string;
  readonly trustZones: readonly string[];
  readonly threats: readonly SecurityThreatInput[];
}

export interface SecurityThreatModel {
  readonly kind: "security-threat-model";
  readonly projectId: string;
  readonly sourceRevision: string;
  readonly trustZones: readonly string[];
  readonly threats: readonly SecurityThreatInput[];
  readonly categoryCoverage: readonly ThreatCategory[];
  readonly openHighOrCritical: readonly string[];
  readonly publishBlockers: readonly string[];
  readonly canonicalMutationAllowed: false;
  readonly productionReleaseAuthority: false;
  readonly aiAuthorityExpansionAllowed: false;
  readonly providerAuthorityExpansionAllowed: false;
  readonly fingerprint: string;
  readonly boundaryNote: string;
}

const requiredCategories: readonly ThreatCategory[] = Object.freeze([
  "trust-boundary",
  "credential",
  "privilege-escalation",
  "destructive-operation",
  "cross-project-leakage",
  "provider-authority",
  "ai-authority",
  "release-authority",
  "data-integrity"
]);

const forbiddenKey = /(password|secret|token|api[-_]?key|authorization|cookie|session)$/i;
const suspiciousSecretValue =
  /(?:bearer\s+[a-z0-9._-]{8,}|basic\s+[a-z0-9+/=]{8,}|gh[pousr]_[a-z0-9]{12,}|sk-[a-z0-9_-]{12,}|eyJ[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,})/i;

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${label} is required`);
  if (suspiciousSecretValue.test(normalized)) {
    throw new TypeError(`${label} contains a raw secret-like value`);
  }
  return normalized;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Readonly<Record<string, unknown>>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => {
          if (forbiddenKey.test(key)) {
            throw new TypeError(`Threat model contains forbidden secret-bearing key ${key}`);
          }
          return [key, stableValue(child)];
        })
    );
  }
  if (typeof value === "string" && suspiciousSecretValue.test(value)) {
    throw new TypeError("Threat model contains a raw secret-like value");
  }
  return value;
}

function hash(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex");
}

export function buildSecurityThreatModel(
  input: SecurityThreatModelInput
): SecurityThreatModel {
  const projectId = required(input.projectId, "Project id");
  const sourceRevision = required(input.sourceRevision, "Source revision");

  const trustZones = Object.freeze(
    [...new Set(input.trustZones.map((zone) => required(zone, "Trust zone")))].sort()
  );
  if (trustZones.length < 2) {
    throw new TypeError("Threat model requires at least two explicit trust zones");
  }

  const ids = new Set<string>();
  const threats = Object.freeze(
    input.threats.map((raw) => {
      const threat = Object.freeze({
        id: required(raw.id, "Threat id"),
        category: raw.category,
        title: required(raw.title, "Threat title"),
        severity: raw.severity,
        trustZone: required(raw.trustZone, "Threat trust zone"),
        attackPath: required(raw.attackPath, "Threat attack path"),
        mitigation: required(raw.mitigation, "Threat mitigation"),
        owner: required(raw.owner, "Threat owner"),
        evidence: Object.freeze(
          [...new Set(raw.evidence.map((item) => required(item, "Threat evidence")))].sort()
        ),
        status: raw.status
      });

      if (ids.has(threat.id)) throw new TypeError(`Duplicate threat id ${threat.id}`);
      ids.add(threat.id);

      if (!trustZones.includes(threat.trustZone)) {
        throw new TypeError(
          `Threat ${threat.id} references unknown trust zone ${threat.trustZone}`
        );
      }
      if (
        (threat.severity === "high" || threat.severity === "critical") &&
        threat.status === "mitigated" &&
        threat.evidence.length === 0
      ) {
        throw new TypeError(
          `Threat ${threat.id} cannot be mitigated without evidence`
        );
      }
      if (
        threat.status === "accepted" &&
        (threat.severity === "high" || threat.severity === "critical")
      ) {
        throw new TypeError(
          `High/critical threat ${threat.id} cannot be silently accepted`
        );
      }
      return threat;
    }).sort(
      (a, b) =>
        a.category.localeCompare(b.category) ||
        a.severity.localeCompare(b.severity) ||
        a.id.localeCompare(b.id)
    )
  );

  const categoryCoverage = Object.freeze(
    [...new Set(threats.map((item) => item.category))].sort() as ThreatCategory[]
  );
  const missingCategories = requiredCategories.filter(
    (category) => !categoryCoverage.includes(category)
  );

  const openHighOrCritical = Object.freeze(
    threats
      .filter(
        (item) =>
          item.status === "open" &&
          (item.severity === "high" || item.severity === "critical")
      )
      .map((item) => item.id)
      .sort()
  );

  const publishBlockers = Object.freeze([
    ...missingCategories.map((category) => `missing-threat-category:${category}`),
    ...openHighOrCritical.map((id) => `open-high-critical-threat:${id}`)
  ].sort());

  const identity = {
    projectId,
    sourceRevision,
    trustZones,
    threats
  };

  return Object.freeze({
    kind: "security-threat-model",
    projectId,
    sourceRevision,
    trustZones,
    threats,
    categoryCoverage,
    openHighOrCritical,
    publishBlockers,
    canonicalMutationAllowed: false,
    productionReleaseAuthority: false,
    aiAuthorityExpansionAllowed: false,
    providerAuthorityExpansionAllowed: false,
    fingerprint: `sha256:${hash(identity)}`,
    boundaryNote:
      "Threat-model review can block promotion but cannot grant canonical, AI, provider or Production authority."
  });
}

export const blueprintOsThreatModelV1: SecurityThreatModel = buildSecurityThreatModel({
  projectId: "project:blueprint-os",
  sourceRevision: "phase9:p9-014",
  trustZones: [
    "browser-client",
    "blueprint-canonical-runtime",
    "persistence-postgresql",
    "external-provider",
    "ai-proposal-boundary",
    "application-management-control-plane"
  ],
  threats: [
    {
      id: "T-TRUST-001",
      category: "trust-boundary",
      title: "Untrusted client data crosses into canonical mutation",
      severity: "high",
      trustZone: "blueprint-canonical-runtime",
      attackPath: "Browser-submitted state bypasses validation or authority checks.",
      mitigation: "Validate contracts and require Blueprint-owned authority before canonical mutation.",
      owner: "Blueprint Core",
      evidence: ["contract-validation", "authority-regression"],
      status: "mitigated"
    },
    {
      id: "T-CRED-001",
      category: "credential",
      title: "Raw external-provider credential leaks into canonical state or logs",
      severity: "critical",
      trustZone: "external-provider",
      attackPath: "Provider metadata or diagnostics carry raw tokens/secrets.",
      mitigation: "Accept opaque credential references only and redact secret-bearing metadata.",
      owner: "Provider Boundary",
      evidence: ["provider-boundary-secret-regression", "diagnostic-redaction-regression"],
      status: "mitigated"
    },
    {
      id: "T-PRIV-001",
      category: "privilege-escalation",
      title: "Read-only actor escalates to project mutation/review",
      severity: "critical",
      trustZone: "blueprint-canonical-runtime",
      attackPath: "Projection/read surfaces invoke protected mutation paths without PROJECT_MUTATE/PROJECT_REVIEW.",
      mitigation: "Enforce AuthorityService at application-service mutation boundaries.",
      owner: "Authority Service",
      evidence: ["authority-tests", "project-isolation-regression"],
      status: "mitigated"
    },
    {
      id: "T-DEST-001",
      category: "destructive-operation",
      title: "Restore or release action silently overwrites canonical state",
      severity: "critical",
      trustZone: "persistence-postgresql",
      attackPath: "Backup restore or release workflow performs an implicit destructive mutation.",
      mitigation: "Restore stays preview-only until explicit confirmation; release orchestration stays plan-only until external execution.",
      owner: "Operational Resilience",
      evidence: ["restore-preview-regression", "release-orchestration-regression"],
      status: "mitigated"
    },
    {
      id: "T-XPROJ-001",
      category: "cross-project-leakage",
      title: "Canonical records leak across project boundaries",
      severity: "critical",
      trustZone: "blueprint-canonical-runtime",
      attackPath: "Portfolio, evidence graph, backup or provider requests mix records from another project.",
      mitigation: "Fail closed on project-id mismatches and duplicate/cross-project records.",
      owner: "Project Boundary",
      evidence: ["portfolio-isolation-regression", "evidence-graph-isolation-regression", "backup-isolation-regression"],
      status: "mitigated"
    },
    {
      id: "T-PROV-001",
      category: "provider-authority",
      title: "External provider gains Blueprint/Gate/Production authority",
      severity: "critical",
      trustZone: "external-provider",
      attackPath: "Provider capability descriptor is treated as canonical release or gate authority.",
      mitigation: "Provider descriptors hard-code Blueprint/Gate/Production authority false and scope every invocation.",
      owner: "Provider Boundary",
      evidence: ["provider-authority-regression"],
      status: "mitigated"
    },
    {
      id: "T-AI-001",
      category: "ai-authority",
      title: "AI proposal silently mutates canonical engineering state",
      severity: "critical",
      trustZone: "ai-proposal-boundary",
      attackPath: "AI output is applied as canonical state without explicit review/acceptance.",
      mitigation: "AI output remains a bounded proposal with mutation/gate/release authority hard-false.",
      owner: "Bounded AI",
      evidence: ["ai-authority-regression"],
      status: "mitigated"
    },
    {
      id: "T-REL-001",
      category: "release-authority",
      title: "Merge or green CI is misrepresented as Production deployment",
      severity: "critical",
      trustZone: "external-provider",
      attackPath: "Release evidence is promoted to deployed state without a real provider execution.",
      mitigation: "Release Orchestration keeps mergeIsDeployment and deploymentObserved false until explicit external execution succeeds.",
      owner: "Release Orchestration",
      evidence: ["release-orchestration-regression", "full-release-gate"],
      status: "mitigated"
    },
    {
      id: "T-DATA-001",
      category: "data-integrity",
      title: "Tampered backup or stale evidence is accepted as canonical",
      severity: "high",
      trustZone: "persistence-postgresql",
      attackPath: "Modified backup/evidence bypasses integrity or revision checks.",
      mitigation: "Verify SHA-256 backup integrity and require exact revision evidence.",
      owner: "Persistence & Quality",
      evidence: ["backup-integrity-regression", "exact-revision-evidence-regression"],
      status: "mitigated"
    }
  ]
});
