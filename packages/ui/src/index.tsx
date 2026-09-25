import type { ReactNode } from "react";

export interface AppShellProps {
  readonly children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div data-blueprint-shell="v1">
      {children}
    </div>
  );
}
