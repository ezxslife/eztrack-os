import { type ReactNode } from "react";
import clsx from "clsx";
import { Button } from "./Button";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "secondary" | "ghost" | "outline";
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={clsx(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-3 flex items-center justify-center h-12 w-12 rounded-full bg-[var(--surface-secondary)] text-[var(--text-tertiary)]">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-[13px] text-[var(--text-tertiary)] max-w-sm mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant={action.variant ?? "default"}
          size="sm"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
