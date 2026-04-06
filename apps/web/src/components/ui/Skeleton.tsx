"use client";

import clsx from "clsx";

const roundedMap = {
  sm: "rounded",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
} as const;

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: keyof typeof roundedMap;
  className?: string;
}

export function Skeleton({
  width,
  height,
  rounded = "md",
  className,
}: SkeletonProps) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden bg-[var(--surface-secondary)]",
        roundedMap[rounded],
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    >
      <div className="absolute inset-0 animate-[shimmer_1.5s_infinite]" />
      <style>{`
        @keyframes shimmer {
          0% { background: linear-gradient(90deg, transparent 0%, var(--surface-hover, rgba(0,0,0,0.05)) 50%, transparent 100%); background-size: 200% 100%; background-position: -200% 0; }
          100% { background: linear-gradient(90deg, transparent 0%, var(--surface-hover, rgba(0,0,0,0.05)) 50%, transparent 100%); background-size: 200% 100%; background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          rounded="sm"
          className={i === lines - 1 ? "w-3/4" : "w-full"}
        />
      ))}
    </div>
  );
}

interface SkeletonCircleProps {
  size?: number;
  className?: string;
}

export function SkeletonCircle({ size = 40, className }: SkeletonCircleProps) {
  return (
    <Skeleton width={size} height={size} rounded="full" className={className} />
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={clsx(
        "p-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)]",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <SkeletonCircle size={32} />
        <div className="flex-1 flex flex-col gap-1.5">
          <Skeleton height={12} className="w-1/3" rounded="sm" />
          <Skeleton height={10} className="w-1/5" rounded="sm" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}
