import type { ReactNode } from "react";

function classes(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface AppShellProps {
  readonly children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div data-blueprint-shell="v1">
      <a className="bp-skip-link" href="#main-content">
        Skip to main content
      </a>
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}

export type StatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

export interface StatusChipProps {
  readonly children: ReactNode;
  readonly tone?: StatusTone;
  readonly className?: string;
}

export function StatusChip({
  children,
  tone = "neutral",
  className
}: StatusChipProps) {
  return (
    <span
      className={classes(
        "bp-status-chip",
        `bp-status-chip--${tone}`,
        className
      )}
    >
      {children}
    </span>
  );
}

export type SurfaceTone = "default" | "subtle" | "emphasis" | "danger";

export interface SurfaceProps {
  readonly children: ReactNode;
  readonly tone?: SurfaceTone;
  readonly className?: string;
  readonly labelledBy?: string;
}

export function Surface({
  children,
  tone = "default",
  className,
  labelledBy
}: SurfaceProps) {
  return (
    <section
      className={classes("bp-surface", `bp-surface--${tone}`, className)}
      aria-labelledby={labelledBy}
    >
      {children}
    </section>
  );
}

export interface SectionHeadingProps {
  readonly kicker?: ReactNode;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly aside?: ReactNode;
  readonly titleId?: string;
  readonly className?: string;
}

export function SectionHeading({
  kicker,
  title,
  description,
  aside,
  titleId,
  className
}: SectionHeadingProps) {
  return (
    <div className={classes("bp-section-heading", className)}>
      <div className="bp-section-heading__copy">
        {kicker ? <p className="bp-kicker">{kicker}</p> : null}
        <h2 id={titleId}>{title}</h2>
        {description ? (
          <p className="bp-section-heading__description">{description}</p>
        ) : null}
      </div>
      {aside ? <div className="bp-section-heading__aside">{aside}</div> : null}
    </div>
  );
}

export interface MetricCardProps {
  readonly label: ReactNode;
  readonly value: ReactNode;
  readonly detail?: ReactNode;
  readonly className?: string;
}

export function MetricCard({
  label,
  value,
  detail,
  className
}: MetricCardProps) {
  return (
    <article className={classes("bp-metric-card", className)}>
      <span className="bp-metric-card__label">{label}</span>
      <strong className="bp-metric-card__value">{value}</strong>
      {detail ? (
        <small className="bp-metric-card__detail">{detail}</small>
      ) : null}
    </article>
  );
}

export interface EmptyStateProps {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly action?: ReactNode;
  readonly icon?: ReactNode;
  readonly className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className
}: EmptyStateProps) {
  return (
    <div className={classes("bp-empty-state", className)}>
      {icon ? <div className="bp-empty-state__icon" aria-hidden="true">{icon}</div> : null}
      <div className="bp-empty-state__copy">
        <strong>{title}</strong>
        {description ? <span>{description}</span> : null}
      </div>
      {action ? <div className="bp-empty-state__action">{action}</div> : null}
    </div>
  );
}

export interface ActionGroupProps {
  readonly children: ReactNode;
  readonly align?: "start" | "end" | "space-between";
  readonly className?: string;
}

export function ActionGroup({
  children,
  align = "end",
  className
}: ActionGroupProps) {
  return (
    <div
      className={classes(
        "bp-action-group",
        `bp-action-group--${align}`,
        className
      )}
    >
      {children}
    </div>
  );
}
