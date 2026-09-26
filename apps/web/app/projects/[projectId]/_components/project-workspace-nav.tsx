"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export interface ProjectWorkspaceNavItem {
  readonly id: string;
  readonly label: string;
  readonly suffix: string;
  readonly description: string;
}

interface ProjectWorkspaceNavProps {
  readonly root: string;
  readonly active: string;
  readonly views: readonly ProjectWorkspaceNavItem[];
}

export function ProjectWorkspaceNav({
  root,
  active,
  views
}: ProjectWorkspaceNavProps) {
  const activeRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const activeElement = activeRef.current;
    if (!activeElement) return;

    const shell = activeElement.closest(".project-workspace-nav-shell");
    if (!(shell instanceof HTMLElement)) return;

    const activeBox = activeElement.getBoundingClientRect();
    const shellBox = shell.getBoundingClientRect();
    const fullyVisible =
      activeBox.left >= shellBox.left && activeBox.right <= shellBox.right;

    if (!fullyVisible) {
      activeElement.scrollIntoView({
        behavior: "auto",
        block: "nearest",
        inline: "center"
      });
    }
  }, [active]);

  return (
    <nav
      className="project-workspace-nav"
      aria-label="Project workspace views"
    >
      {views.map((view) => {
        const current = view.id === active;

        return (
          <Link
            className={
              "project-workspace-nav-item" +
              (current ? " project-workspace-nav-item-active" : "")
            }
            href={root + view.suffix}
            key={view.id}
            aria-current={current ? "page" : undefined}
            ref={current ? activeRef : undefined}
          >
            <strong>{view.label}</strong>
            <span>{view.description}</span>
          </Link>
        );
      })}
    </nav>
  );
}
