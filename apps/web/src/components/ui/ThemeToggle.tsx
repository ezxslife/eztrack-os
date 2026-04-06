"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import clsx from "clsx";

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
      <button
        className="w-7 h-7 rounded-md bg-[var(--surface-secondary)] border border-[var(--border-default)] flex items-center justify-center"
        aria-label="Toggle theme"
      />
    );
  }

  return (
    <button
      onClick={toggle}
      className={clsx(
        "relative w-7 h-7 rounded-md flex items-center justify-center",
        "bg-[var(--surface-secondary)] border border-[var(--border-default)]",
        "hover:bg-[var(--surface-hover)] active:bg-[var(--surface-pressed)]",
        "transition-colors duration-150 cursor-pointer"
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
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
          style={{ color: "var(--text-primary)" }}
        />
        <Moon
          size={16}
          className={clsx(
            "absolute inset-0 transition-all duration-300",
            isDark
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 -rotate-90 scale-0"
          )}
          style={{ color: "var(--text-primary)" }}
        />
      </div>
    </button>
  );
}
