import Link from "next/link";

// Loop-safe sign-in error page. The proxy/matcher deliberately excludes this
// route from the auth gate, so landing here never redirects back to login —
// a failed sign-in stops here instead of looping. The callback route sends
// users here with ?error=<message>.
export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex w-full max-w-md flex-col items-center gap-6 px-8 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Sign-in failed
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {error ??
              "Something went wrong while signing you in. Please try again."}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Plain anchor: /api/auth/login is a route handler, not a page. */}
          <a
            href="/api/auth/login"
            className="flex h-11 items-center justify-center rounded-full bg-black px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Try again
          </a>
          <Link
            href="/"
            className="flex h-11 items-center justify-center rounded-full border border-solid border-black/[.08] px-6 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]"
          >
            Back home
          </Link>
        </div>
      </main>
    </div>
  );
}
