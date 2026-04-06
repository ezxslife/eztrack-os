"use client";

import { type ReactNode } from "react";
import Image from "next/image";
import clsx from "clsx";

const PALETTE = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
  "#f97316", // orange
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#10b981", // emerald
] as const;

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

const sizeMap = {
  xs: { container: "w-5 h-5", text: "text-[8px]", img: 20 },
  sm: { container: "w-6 h-6", text: "text-[9px]", img: 24 },
  md: { container: "w-8 h-8", text: "text-[11px]", img: 32 },
  lg: { container: "w-10 h-10", text: "text-[13px]", img: 40 },
  xl: { container: "w-12 h-12", text: "text-[15px]", img: 48 },
} as const;

type AvatarSize = keyof typeof sizeMap;

interface AvatarProps {
  src?: string;
  name: string;
  size?: AvatarSize;
  className?: string;
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const config = sizeMap[size];
  const bgColor = PALETTE[hashName(name) % PALETTE.length];
  const initial = name.charAt(0).toUpperCase();

  if (src) {
    return (
      <div
        className={clsx(
          config.container,
          "relative rounded-full overflow-hidden flex-shrink-0",
          className
        )}
      >
        <Image src={src} alt={name} fill className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        config.container,
        config.text,
        "rounded-full flex items-center justify-center font-medium text-white flex-shrink-0 select-none",
        className
      )}
      style={{ backgroundColor: bgColor }}
      title={name}
    >
      {initial}
    </div>
  );
}

interface AvatarGroupProps {
  children: ReactNode;
  max?: number;
  size?: AvatarSize;
}

export function AvatarGroup({ children, max = 4, size = "md" }: AvatarGroupProps) {
  const childArray = Array.isArray(children) ? children : [children];
  const visible = childArray.slice(0, max);
  const overflow = childArray.length - max;
  const config = sizeMap[size];

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((child, i) => (
        <div
          key={i}
          className="ring-2 ring-[var(--surface-primary)] rounded-full"
          style={{ zIndex: visible.length - i }}
        >
          {child}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={clsx(
            config.container,
            config.text,
            "rounded-full flex items-center justify-center font-medium flex-shrink-0",
            "bg-[var(--surface-tertiary)] text-[var(--text-secondary)]",
            "ring-2 ring-[var(--surface-primary)]"
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
