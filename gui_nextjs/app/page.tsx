import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-54 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert mx-auto"
          src="/globe.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />

        <Link
          className="mx-auto flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
          href="/dashboard"
        >
          Dashboard
        </Link>

        <Demo></Demo>
      </main>
    </div>
  );
}

function Demo() {
  return (
    <div className="max-w-2xl text-center">
      <h1 className="text-4xl font-bold tracking-tight">
        Next.js with ZITADEL
      </h1>

      <p className="mt-4 text-lg text-muted-foreground">
        A modern authentication starter built with Next.js and ZITADEL,
        providing secure sign-in, user management, and OpenID Connect (OIDC)
        integration out of the box.
      </p>

      <p className="mt-4 text-sm text-muted-foreground">
        This project demonstrates how to use ZITADEL as an identity provider for
        Next.js applications, including authentication flows, protected routes,
        session handling, and user profile management.
      </p>
    </div>
  );
}
