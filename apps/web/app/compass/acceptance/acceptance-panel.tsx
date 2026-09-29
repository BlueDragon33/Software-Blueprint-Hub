"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { recordCompassAcceptanceAction } from "./actions";

export function AcceptancePanel({ revision }: { readonly revision: string }) {
  const router = useRouter();
  const [runId, setRunId] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <section className="compass-acceptance-ready" aria-label="Record P9-020 acceptance">
      <p className="section-kicker">Final evidence recording</p>
      <h2>Record exact-revision acceptance</h2>
      <p>Deployment revision: <code>{revision}</code></p>
      <p>Enter the final manual Release Gate run ID. The server checks GitHub run, every required audit step and the exact evidence artifact before creating a canonical acceptance gate.</p>
      <form onSubmit={(event) => {
        event.preventDefault();
        setMessage("");
        startTransition(async () => {
          const result = await recordCompassAcceptanceAction(Number(runId));
          setMessage(result.message);
          if (result.ok) router.refresh();
        });
      }}>
        <label htmlFor="compass-release-run">Full Release Gate run ID</label>
        <input id="compass-release-run" type="text" inputMode="numeric" pattern="[0-9]+" required value={runId} onChange={(event) => setRunId(event.target.value)} />
        <button className="primary-button" type="submit" disabled={pending}>
          {pending ? "Verifying…" : "Verify and record P9-020"}
        </button>
      </form>
      {message ? <p role="status">{message}</p> : null}
    </section>
  );
}
