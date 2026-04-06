import clsx from "clsx";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  variant?: "spinner" | "dots";
  className?: string;
}

export function LoadingState({
  message,
  variant = "spinner",
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx(
        "flex flex-col items-center justify-center py-12 px-4 gap-3",
        className
      )}
    >
      {variant === "spinner" ? (
        <Loader2 className="h-5 w-5 text-[var(--action-primary)] animate-spin" />
      ) : (
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-[var(--action-primary)]"
              style={{
                animation: "pulse-dot 1.2s ease-in-out infinite",
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
          <style>{`
            @keyframes pulse-dot {
              0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
              40% { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
      {message && (
        <p className="text-[13px] text-[var(--text-tertiary)]">{message}</p>
      )}
    </div>
  );
}
