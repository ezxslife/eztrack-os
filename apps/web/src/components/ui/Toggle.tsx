"use client";

import clsx from "clsx";

const sizeConfig = {
  sm: {
    track: "w-8 h-[18px]",
    thumb: "w-3.5 h-3.5",
    translate: "translate-x-[14px]",
    offset: "translate-x-[2px]",
  },
  md: {
    track: "w-9 h-5",
    thumb: "w-4 h-4",
    translate: "translate-x-[16px]",
    offset: "translate-x-[2px]",
  },
} as const;

type ToggleSize = keyof typeof sizeConfig;

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: ToggleSize;
  label?: string;
  id?: string;
}

export function Toggle({
  checked,
  onChange,
  disabled = false,
  size = "md",
  label,
  id,
}: ToggleProps) {
  const config = sizeConfig[size];

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={clsx(
          config.track,
          "relative inline-flex items-center rounded-full cursor-pointer",
          "transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-primary)] focus-visible:ring-offset-2",
          checked
            ? "bg-[var(--eztrack-primary-500,#6366f1)]"
            : "bg-[var(--surface-tertiary)]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span
          className={clsx(
            config.thumb,
            "bg-white rounded-full shadow-sm",
            "transition-transform duration-200",
            checked ? config.translate : config.offset
          )}
          style={{
            transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
      </button>
      {label && (
        <label
          htmlFor={id}
          className={clsx(
            "text-[13px] text-[var(--text-primary)] select-none",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          )}
          onClick={handleClick}
        >
          {label}
        </label>
      )}
    </div>
  );
}
