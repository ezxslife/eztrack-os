"use client";

import { type InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";
import { Search } from "lucide-react";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, containerClassName, ...rest }, ref) => {
    return (
      <div className={clsx("relative w-full", containerClassName)}>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          ref={ref}
          type="search"
          className={clsx(
            "w-full min-h-11 rounded-[var(--input-radius)] border border-[var(--border-default)] bg-[var(--surface-primary)] pl-10 pr-[var(--input-padding-x)] text-[14px] text-[var(--text-primary)] shadow-[var(--shadow-xs)] transition-all duration-150 ease-out placeholder:text-[var(--text-tertiary)] hover:border-[var(--border-hover)] focus:outline-none focus-visible:border-[var(--border-focused)] focus-visible:shadow-[var(--focus-ring)]",
            className
          )}
          {...rest}
        />
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
