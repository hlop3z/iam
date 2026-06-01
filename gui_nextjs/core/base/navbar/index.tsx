"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/services/iam";
import PopupLink from "@/core/base/popup-link";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/ping", label: "Ping" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, loading, login, logout } = useAuth();
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock background scroll while the full-height mobile drawer is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const linkClass = (active: boolean) =>
    `rounded-full px-3 py-1.5 transition-colors ${
      active
        ? "bg-black/[.06] text-black dark:bg-white/[.1] dark:text-zinc-50"
        : "text-zinc-600 hover:bg-black/[.04] hover:text-black dark:text-zinc-400 dark:hover:bg-white/[.06] dark:hover:text-zinc-50"
    }`;

  const authBtnClass = (block: boolean) =>
    `${block ? "w-full " : ""}rounded-full bg-black px-4 py-1.5 text-center text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200`;

  // Auth control shared by desktop (inline) and mobile (block) layouts.
  const renderAuth = (block: boolean) => {
    if (isAuthenticated) {
      return (
        <div
          className={block ? "flex flex-col gap-2" : "flex items-center gap-2"}
        >
          <PopupLink
            name="account"
            href="/api/auth/account"
            className="max-w-[12rem] truncate px-3 py-1.5 text-zinc-500 dark:text-zinc-400"
          >
            {user?.name ?? user?.preferred_username ?? user?.email ?? "Account"}
          </PopupLink>

          <button
            type="button"
            onClick={logout}
            className={authBtnClass(block)}
          >
            Log out
          </button>
        </div>
      );
    }
    // While loading (or signed out) show "Log in" so the control is always
    // present — avoids the button briefly disappearing on refresh. It swaps to
    // the signed-in view once /api/auth/me resolves.
    return (
      <button
        type="button"
        onClick={login}
        className={authBtnClass(block)}
        aria-busy={loading}
      >
        Log in
      </button>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-black/[.08] bg-white/80 backdrop-blur dark:border-white/[.145] dark:bg-black/80">
        <nav className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight text-black dark:text-zinc-50"
          >
            IAM
          </Link>

          <div className="flex items-center gap-2 text-sm font-medium">
            {/* Desktop links + auth */}
            <ul className="hidden items-center gap-1 md:flex">
              {links.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isActive(pathname, href) ? "page" : undefined}
                    className={linkClass(isActive(pathname, href))}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="hidden md:flex">{renderAuth(false)}</div>

            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-700 transition-colors hover:bg-black/[.04] dark:text-zinc-300 dark:hover:bg-white/[.06] md:hidden"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {open ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu panel — full-height overlay below the header.
          Kept outside <header> so the header's backdrop-filter doesn't
          become the containing block for this fixed element. */}
      {open && (
        <ul
          id="mobile-menu"
          className="fixed inset-x-0 bottom-0 top-14 z-30 flex flex-col gap-1 overflow-y-auto border-t border-black/[.08] bg-white px-4 py-4 text-base font-medium dark:border-white/[.145] dark:bg-black md:hidden"
        >
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(pathname, href) ? "page" : undefined}
                className={`block ${linkClass(isActive(pathname, href))}`}
              >
                {label}
              </Link>
            </li>
          ))}
          <li className="mt-2 border-t border-black/[.08] pt-3 dark:border-white/[.145]">
            {renderAuth(true)}
          </li>
        </ul>
      )}
    </>
  );
}
