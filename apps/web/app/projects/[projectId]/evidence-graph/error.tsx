"use client";

export default function GraphError({ reset }: { readonly reset: () => void }) {
  return <section role="alert"><h2>Project graph unavailable</h2>
    <p>Trusted sources could not be loaded. No partial or sample graph is shown.</p>
    <button type="button" onClick={reset}>Retry project graph</button></section>;
}
