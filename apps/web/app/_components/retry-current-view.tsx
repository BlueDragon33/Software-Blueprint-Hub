"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export interface RetryCurrentViewProps {
  readonly label?: string;
}

export function RetryCurrentView({
  label = "Retry canonical read"
}: RetryCurrentViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button
        className="primary-button"
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => router.refresh())}
      >
        {pending ? "Retrying…" : label}
      </button>
      <span className="bp-visually-hidden" aria-live="polite">
        {pending ? "Refreshing canonical data." : ""}
      </span>
    </>
  );
}
