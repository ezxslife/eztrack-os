"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import clsx from "clsx";
import { IconButton } from "@/components/ui/IconButton";

const STORAGE_KEY = "eztrack-theme";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setIsDark(stored === "dark");
    } else {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
  }, [isDark, mounted]);

  const toggle = () => {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    setIsDark((prev) => !prev);
    setTimeout(() => {
      root.classList.remove("theme-transition");
    }, 500);
  };

  if (!mounted) {
    return (
      <div
        className="h-10 w-10 rounded-xl border border-[var(--border-default)] bg-[var(--surface-secondary)]"
        aria-label="Toggle theme"
      />
    );
  }

  return (
    <IconButton
      onClick={toggle}
      className={clsx(
        "relative bg-[var(--surface-secondary)] text-[var(--text-primary)]",
        "hover:bg-[var(--surface-hover)]"
      )}
      label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      size="md"
      type="button"
      variant="outline"
    >
      <div className="relative w-4 h-4">
        <Sun
          size={16}
          className={clsx(
            "absolute inset-0 transition-all duration-300",
            isDark
              ? "opacity-0 rotate-90 scale-0"
              : "opacity-100 rotate-0 scale-100"
          )}
        />
        <Moon
          size={16}
          className={clsx(
            "absolute inset-0 transition-all duration-300",
            isDark
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 -rotate-90 scale-0"
          )}
        />
      </div>
    </IconButton>
  );
}
