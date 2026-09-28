"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { bootstrapOwnerAction } from "./actions";

export function OwnerBootstrapPanel() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function initialize() {
    setMessage(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await bootstrapOwnerAction();
      setMessage(result.message);
      setSuccess(result.ok);
      router.refresh();
    });
  }

  return (
    <section
      className="professional-review-decision"
      aria-labelledby="owner-bootstrap-title"
    >
      <div>
        <p className="section-kicker">One-time authority setup</p>
        <h2 id="owner-bootstrap-title">Initialize the first System Owner</h2>
        <p>
          Use this only for a new Blueprint OS database. The operation is
          atomic and fail-closed: once an Owner exists, another account cannot
          seize the role through this setup path.
        </p>
      </div>

      <div className="professional-review-actions">
        <button
          className="primary-button"
          type="button"
          disabled={isPending}
          onClick={initialize}
        >
          {isPending ? "Initializing…" : "Initialize this account as System Owner"}
        </button>
      </div>

      {message ? (
        <p className="professional-review-message" role="status">
          {message}
        </p>
      ) : null}

      {success ? (
        <Link className="secondary-button" href="/professional-review">
          Open P9-019 professional review
        </Link>
      ) : null}

      <p className="professional-review-boundary">
        Owner bootstrap establishes Blueprint OS authority only. It does not
        approve P9-019, PASS P9-020, or authorize Production deployment.
      </p>
    </section>
  );
}
