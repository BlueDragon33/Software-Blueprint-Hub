# ECAD_Design Dependency Budget

Status: FOUNDATION

No non-trivial runtime provider is accepted merely by prototype convenience.

Every dependency must declare:

- capability;
- runtime class: LOCAL_CORE / OPTIONAL_SYNC / OPTIONAL_INTELLIGENCE / OPTIONAL_PUBLISH / EXTERNAL_ESSENTIAL;
- license/cost;
- data leaving user control;
- canonical owner;
- offline/degraded behavior;
- replacement path;
- review/removal trigger.

Foundation rule: no required paid runtime for the local engineering core.

No dependency has yet been selected for domain-specific kernels/solvers beyond the product bootstrap.
