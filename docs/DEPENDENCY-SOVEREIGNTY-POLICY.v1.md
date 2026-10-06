# Dependency Sovereignty Policy v1

Status: **TARGET UNIVERSAL IMPLEMENTATION POLICY FOR CONSTITUTION 1.2**

This policy operationalizes the Universal Constitution pillar:

`operational-sovereignty-dependency-minimization`.

It does not ban cloud services. It prevents avoidable lock-in and makes every external dependency explicit, replaceable and proportionate to user value.

## 1. Default dependency order

When two solutions provide materially equivalent correctness, security and usability, prefer:

1. local/browser/desktop/on-device capability;
2. open or self-controlled runtime;
3. free external service with documented export and replacement path;
4. paid external service only when the capability gap is real and explicitly accepted.

Cost avoidance never justifies weaker security, fake capability, lower correctness or loss of recoverability.

## 2. Runtime classes

Every significant capability is classified as one of:

- **LOCAL_CORE** — primary capability executes on user-controlled device/browser/runtime.
- **OPTIONAL_SYNC** — remote service synchronizes or backs up state but is not required for core operation.
- **OPTIONAL_INTELLIGENCE** — AI/model/provider improves experience but canonical state remains elsewhere.
- **OPTIONAL_PUBLISH** — hosting/CDN/public endpoint is replaceable and not canonical business state.
- **EXTERNAL_ESSENTIAL** — external service is intrinsically required by the product purpose; this requires explicit justification and human acceptance.

## 3. Dependency budget

Each non-trivial external dependency must record:

- dependency/provider name;
- capability and owner;
- runtime class;
- cost class: local/free, free-tier, paid-optional, paid-required;
- data sent outside the user-controlled boundary;
- credential owner and least-privilege scope;
- offline/degraded behavior;
- canonical-data ownership;
- export format;
- backup/restore path;
- provider replacement path;
- removal/review trigger.

A dependency without this information is not accepted merely because integration works.

## 4. Google Drive / Sheets / Apps Script

Google services are allowed as a practical remote bridge, especially for personal systems, with these default roles:

### Google Drive
Preferred for:
- optional file synchronization;
- backup;
- portable document/content storage;
- cross-device access;
- release/evidence archives when appropriate.

Drive does not become canonical runtime compute.

### Google Sheets
Preferred for:
- low-risk tabular projections;
- simple index/catalog views;
- operator-maintained reference tables where concurrency and transactional guarantees are not critical.

Sheets must not silently replace a real transactional state model for security-critical or high-integrity workflows.

### Google Apps Script
Preferred for:
- lightweight personal webhooks/APIs;
- low-frequency coordination;
- Drive/Sheets automation;
- simple remote access when the local device is off.

Apps Script is not a substitute for a trusted high-throughput or high-risk authorization boundary.

## 5. Sensitive-data rule

Health, child, credential, device-control, private-key and other sensitive data require stronger handling.

Default:
- canonical sensitive state remains local or in a purpose-built trusted store;
- Drive backup is encrypted client-side where consequence warrants it;
- Sheets is not used for raw secrets, private keys, bearer tokens or high-risk medical/device-control state;
- OAuth scopes are least privilege;
- deletion/export/recovery behavior is explicit.

## 6. AI rule

ChatGPT or another AI provider may be the preferred intelligence assistant, but:

- AI is not the sole canonical owner of durable product state by default;
- app startup and basic non-AI workflows should not fail merely because an AI provider is unavailable;
- prompts are projections, not source-of-truth;
- AI-provider replacement remains possible unless the product charter explicitly defines the provider as the product.

## 7. Offline/degraded rule

Where a capability can reasonably function without a network:
- core reading/editing/calculation/simulation remains available;
- mutations queue locally when remote sync is unavailable;
- sync conflicts are surfaced rather than silently overwritten;
- the UI states whether data is local, pending sync, synchronized or conflicted.

## 8. GitHub rule

GitHub owns:
- source;
- review;
- version history;
- CI evidence;
- release definitions.

GitHub is not the default mutable end-user database.

## 9. Paid-service rule

A mandatory paid dependency requires:
- a capability that cannot reasonably be satisfied by the preferred lower-dependency options;
- an explicit cost owner;
- an exit path;
- user/human approval before it becomes required for core personal operation.

A free-tier service is still an external dependency and requires an exit path.

## 10. Acceptance

The sovereignty gate may PASS only with evidence appropriate to the project showing:
- dependency inventory/budget;
- canonical owner for durable data;
- offline/degraded behavior where applicable;
- export/restore or migration path;
- no unjustified mandatory paid-provider lock-in;
- security controls appropriate to data consequence.

Passing this policy never grants Production authority.
