"use client";

import { useId, useRef, useState } from "react";
import {
  validateManagedNextAction,
  type ManagedNextAction
} from "../../../../packages/application/src/next-action-output-contract.mjs";

/** Source-bound, copy-only handoff. This web component cannot submit a ChatGPT message. */
export function BlueprintNextAction({ handoff }: { readonly handoff: ManagedNextAction }) {
  const check = validateManagedNextAction(handoff);
  const action = handoff.actions[0];
  if (action.kind !== "copy-next-turn") {
    throw new Error("NEXT_ACTION_HANDOFF_BLOCKED: Hub UI can only copy, never submit ChatGPT turns");
  }
  const [feedback, setFeedback] = useState("");
  const field = useRef<HTMLTextAreaElement>(null);
  const fieldId = useId();

  async function copyNextAction(): Promise<void> {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(action.query);
        setFeedback("Next Action copied. Paste it into the next authorized chat.");
        return;
      }
    } catch {
      // Clipboard permission denied; the visible read-only field remains available.
    }
    field.current?.focus();
    field.current?.select();
    setFeedback("Clipboard unavailable. The complete query is selected; copy it manually.");
  }

  return (
    <section aria-label="Blueprint continuation handoff" data-next-action-status={check.controlRendered}>
      {handoff.mode === "interactive" ? (
        <button type="button" className="secondary-button"
          onClick={() => { void copyNextAction(); }}>
          {action.label}
        </button>
      ) : null}
      <label htmlFor={fieldId}>Next action to copy and submit manually</label>
      <textarea id={fieldId} ref={field} rows={3}
        aria-label="Copyable Next Action fallback"
        value={handoff.fallbackPrompt} readOnly />
      <p role="status" aria-live="polite">{feedback || "Advisory handoff only; no action has been executed."}</p>
    </section>
  );
}
