"use client";

import { ReactNode } from "react";

interface PopupLinkProps {
  /** Resolved URL to open (pass it in from a server component). */
  href: string;
  /** window.open size. */
  width?: number;
  height?: number;
  /** window.open target name. */
  name?: string;
  className?: string;
  children: ReactNode;
}

/**
 * A link that opens its href in a popup window. Client component so it can use
 * the onClick handler; the href is passed in as a prop, so the URL can still be
 * computed server-side (e.g. from env). Degrades gracefully: with JS disabled
 * the anchor is a normal link to the same href.
 */
export default function PopupLink({
  href,
  name = "_blank",
  className,
  children,
  width = 1100,
  height = 800,
}: PopupLinkProps) {
  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        popupManager.open(href, name, { width: width, height: height });
      }}
    >
      {children}
    </a>
  );
}

type PopupOptions = {
  width?: number;
  height?: number;
};

class PopupManager {
  private windows = new Map<string, Window>();

  open(
    url: string,
    name: string,
    { width = 600, height = 700 }: PopupOptions = {},
  ): Window | null {
    const existing = this.windows.get(name);

    if (existing && !existing.closed) {
      existing.focus();

      // Re-point the popup at the requested URL. We can't read
      // existing.location.href when the popup is on another origin (that read
      // throws a cross-origin SecurityError), but navigating it is allowed.
      try {
        existing.location.replace(url);
      } catch {
        // Navigation blocked — focusing the existing popup is enough.
      }

      return existing;
    }

    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      url,
      name,
      [
        `width=${width}`,
        `height=${height}`,
        `left=${Math.round(left)}`,
        `top=${Math.round(top)}`,
        "popup=yes",
        "resizable=yes",
        "scrollbars=yes",
      ].join(","),
    );

    if (popup) {
      this.windows.set(name, popup);

      const timer = setInterval(() => {
        if (popup.closed) {
          this.windows.delete(name);
          clearInterval(timer);
        }
      }, 1000);
    }

    return popup;
  }

  close(name: string) {
    const popup = this.windows.get(name);

    if (popup && !popup.closed) {
      popup.close();
    }

    this.windows.delete(name);
  }

  closeAll() {
    for (const popup of this.windows.values()) {
      if (!popup.closed) {
        popup.close();
      }
    }

    this.windows.clear();
  }
}

export const popupManager = new PopupManager();
