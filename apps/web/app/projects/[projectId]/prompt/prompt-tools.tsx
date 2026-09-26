"use client";

import type { PromptProjection } from "@blueprint-os/contracts";
import { ActionGroup } from "@blueprint-os/ui";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { regeneratePromptAction } from "./actions";

interface PromptToolsProps {
  readonly projectId: string;
  readonly projection: PromptProjection | null;
}

function exportFilename(projection: PromptProjection): string {
  const timestamp = projection.generatedAt
    .replaceAll(":", "-")
    .replaceAll(".", "-");
  return `blueprint-prompt-${timestamp}.md`;
}

export function PromptTools({
  projectId,
  projection
}: PromptToolsProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function copyPrompt(): Promise<void> {
    if (!projection) return;
    try {
      await navigator.clipboard.writeText(projection.content);
      setFeedback("Prompt copied to clipboard.");
    } catch {
      setFeedback("Clipboard access was unavailable. Use Export instead.");
    }
  }

  function exportPrompt(): void {
    if (!projection) return;
    const blob = new Blob([projection.content], {
      type: "text/markdown;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = exportFilename(projection);
    anchor.click();
    URL.revokeObjectURL(url);
    setFeedback("Prompt exported as Markdown.");
  }

  function regenerate(): void {
    setFeedback(null);
    startTransition(async () => {
      const result = await regeneratePromptAction(projectId);
      if (!result.ok) {
        setFeedback(result.message);
        return;
      }
      setFeedback("New Prompt Projection snapshot recorded.");
      router.refresh();
    });
  }

  return (
    <ActionGroup className="prompt-workspace-tools">
      <button
        type="button"
        className="primary-button"
        onClick={regenerate}
        disabled={pending}
      >
        {pending ? "Regenerating…" : projection ? "Regenerate" : "Generate prompt"}
      </button>
      <button
        type="button"
        className="secondary-button"
        onClick={copyPrompt}
        disabled={!projection || pending}
      >
        Copy
      </button>
      <button
        type="button"
        className="secondary-button"
        onClick={exportPrompt}
        disabled={!projection || pending}
      >
        Export .md
      </button>
      {feedback ? (
        <span className="prompt-tool-feedback" role="status">{feedback}</span>
      ) : null}
    </ActionGroup>
  );
}
