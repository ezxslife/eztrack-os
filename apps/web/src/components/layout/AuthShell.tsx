import { type HTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[var(--surface-bg)]">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: [
              "radial-gradient(circle at top, rgba(255,255,255,0.04), transparent 30%)",
              "linear-gradient(180deg, #101114 0%, #0b0d11 100%)",
            ].join(", "),
          }}
        />
        <div
          className="animate-auth-aurora absolute -left-32 top-[-12rem] h-[30rem] w-[36rem] rounded-full blur-3xl opacity-80"
          style={{
            background:
              "radial-gradient(ellipse at center, color-mix(in srgb, var(--action-primary-fill) 36%, transparent) 0%, color-mix(in srgb, var(--action-primary) 14%, transparent) 40%, transparent 74%)",
          }}
        />
        <div
          className="animate-auth-orb-drift absolute -right-24 bottom-[-14rem] h-[28rem] w-[28rem] rounded-full blur-3xl opacity-65"
          style={{
            background:
              "radial-gradient(circle, rgba(176, 148, 105, 0.2) 0%, transparent 72%)",
          }}
        />
        <div
          className="animate-auth-beam absolute left-[8%] top-[-20%] h-[140%] w-[14rem] rotate-[18deg] blur-3xl opacity-20"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--action-primary-fill) 28%, transparent) 0%, rgba(255,255,255,0.03) 40%, transparent 78%)",
          }}
        />
        <div
          className="animate-auth-beam-reverse absolute bottom-[-20%] right-[6%] h-[110%] w-[12rem] rotate-[-20deg] blur-3xl opacity-18"
          style={{
            background:
              "linear-gradient(180deg, rgba(176,148,105,0.22) 0%, rgba(176,148,105,0.03) 42%, transparent 76%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.32) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.32) 1px, transparent 1px)",
            backgroundSize: "96px 96px",
            maskImage:
              "radial-gradient(circle at center, black 0%, black 48%, rgba(0,0,0,0.55) 72%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(circle at center, black 0%, black 48%, rgba(0,0,0,0.55) 72%, transparent 100%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full items-center justify-center px-[var(--page-gutter-mobile)] py-6 sm:px-[var(--page-gutter-tablet)] sm:py-8 lg:px-[var(--page-gutter-desktop)]">
        <div data-auth-shell-panel className="page-width-form mx-auto w-full min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthCard({
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "w-full min-w-0 rounded-[28px] border border-white/8 bg-[color-mix(in_srgb,var(--surface-primary)_90%,transparent)] p-[clamp(1.25rem,4vw,2rem)] shadow-[0_30px_100px_rgba(0,0,0,0.38)] backdrop-blur-2xl sm:rounded-[32px]",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
