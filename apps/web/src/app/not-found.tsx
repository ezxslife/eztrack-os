import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface-bg)]">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-[var(--text-primary)]">404</h1>
        <p className="text-[var(--text-tertiary)]">Page not found</p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-[var(--eztrack-primary-500,#6366f1)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
