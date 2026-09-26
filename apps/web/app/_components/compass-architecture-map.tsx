import {
  resolveCompassArchitecture,
  type CompassStoreyState
} from "@blueprint-os/application";
import { StatusChip, type StatusTone } from "@blueprint-os/ui";

function tone(state: CompassStoreyState): StatusTone {
  if (state === "accepted-baseline") return "success";
  if (state === "active") return "info";
  return "neutral";
}

function label(state: CompassStoreyState) {
  if (state === "accepted-baseline") return "Accepted baseline";
  if (state === "active") return "Active storey";
  return "Dependency-gated";
}

export function CompassArchitectureMap() {
  const storeys = resolveCompassArchitecture();

  return (
    <section className="compass-architecture" aria-labelledby="compass-architecture-title">
      <header className="compass-architecture-heading">
        <div>
          <p className="section-kicker">20-storey architecture</p>
          <h2 id="compass-architecture-title">Structure before features</h2>
          <p>
            Storey state is resolved from the current Compass projection. The definitions themselves do not carry mutable completion flags.
          </p>
        </div>
        <StatusChip tone="info">20 dependency-linked layers</StatusChip>
      </header>

      <div className="compass-building" aria-label="Blueprint OS construction storeys">
        {[...storeys].reverse().map((storey) => (
          <details
            className="compass-storey-row"
            data-state={storey.state}
            key={storey.code}
            open={storey.state === "active"}
          >
            <summary>
              <span className="compass-storey-number">{String(storey.number).padStart(2, "0")}</span>
              <span className="compass-storey-copy">
                <strong>{storey.name}</strong>
                <small>{storey.code} · {storey.dependsOn.length ? "depends on " + storey.dependsOn.map((item) => "S" + String(item).padStart(2, "0")).join(", ") : "foundation"}</small>
              </span>
              <StatusChip tone={tone(storey.state)}>{label(storey.state)}</StatusChip>
            </summary>
            <div className="compass-storey-detail">
              <p>{storey.purpose}</p>
              <dl>
                <div>
                  <dt>Evidence / owner source</dt>
                  <dd>{storey.source}</dd>
                </div>
                <div>
                  <dt>Why this state?</dt>
                  <dd>{storey.stateReason}</dd>
                </div>
              </dl>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
