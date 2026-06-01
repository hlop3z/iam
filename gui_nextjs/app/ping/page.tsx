"use client";

import { useState } from "react";

interface PingResult {
  reply: string;
  message: string;
  user: string;
}

// Simple req/resp tester: POSTs a single `message` to the BFF (/api/ping),
// which forwards it to the authenticated FastAPI endpoint and returns the pong.
export default function PingPage() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<PingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? data.detail ?? `Request failed (${res.status})`);
      } else {
        setResult(data as PingResult);
      }
    } catch {
      setError("Network error — is the FastAPI backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex w-full max-w-md flex-col gap-6 px-6 py-24">
        <div>
          <h1 className="text-3xl leading-10 tracking-tight text-black dark:text-zinc-50">
            Ping / Pong
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Send a message to the authenticated FastAPI endpoint and see the
            reply. Requires you to be signed in.
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label
            htmlFor="message"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Message
          </label>
          <input
            id="message"
            name="message"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="ping"
            autoComplete="off"
            className="rounded-lg border border-black/[.12] bg-white px-4 py-2.5 text-black outline-none transition-colors focus:border-black/[.4] dark:border-white/[.18] dark:bg-black dark:text-zinc-50 dark:focus:border-white/[.5]"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-black px-4 py-2.5 text-center font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {loading ? "Sending…" : "Send"}
          </button>
        </form>

        {result && (
          <div className="rounded-lg border border-green-600/30 bg-green-50 px-4 py-3 text-sm dark:bg-green-950/30">
            <p className="font-mono text-green-800 dark:text-green-300">
              {result.reply}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              from <code>{result.user}</code>
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-600/30 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
