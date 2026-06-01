import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-1 w-full max-w-7xl flex-col items-center justify-center gap-6 py-32 px-16 bg-white dark:bg-black sm:items-start sm:text-left">
        <h1 className="text-3xl leading-10 tracking-tight text-black dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          This is a new page served at <code>/dashboard</code>. Edit{" "}
          <code>app/dashboard/page.tsx</code> to build it out.
        </p>
        <Link
          href="/"
          className="flex h-12 items-center justify-center rounded-full border border-solid border-black/[.08] px-5 text-base font-medium transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
        >
          ← Back home
        </Link>
      </main>
    </div>
  );
}
