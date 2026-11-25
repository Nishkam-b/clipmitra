"use client";

import { useEffect, useState } from "react";
import { useSystemStatus } from "@/hooks/useSystemStatus";
import { MonitorIcon, Spinner } from "./icons";

/**
 * The web UI is hosted (nishtek.in/clipmitra) but all processing happens on the visitor's own
 * computer. Show the upload box only when the local ClipMitra engine answers.
 */
/**
 * Chrome/Edge (Local Network Access) ask the user before a public site like nishtek.in may talk to
 * apps on their own computer. Returns "granted" | "prompt" | "denied" | "unsupported".
 */
function useLocalNetworkPermission(): string {
  const [state, setState] = useState("unsupported");
  useEffect(() => {
    let status: PermissionStatus | null = null;
    const update = () => status && setState(status.state);
    (async () => {
      for (const name of ["local-network-access", "loopback-network"]) {
        try {
          status = await navigator.permissions.query({ name: name as PermissionName });
          update();
          status.addEventListener("change", update);
          return;
        } catch { /* not supported by this browser */ }
      }
    })();
    return () => status?.removeEventListener("change", update);
  }, []);
  return state;
}

export function EngineGate({ children }: { children: React.ReactNode }) {
  const sys = useSystemStatus(5_000);
  const lna = useLocalNetworkPermission();
  const hosted = typeof window !== "undefined" && !["localhost", "127.0.0.1"].includes(window.location.hostname);

  if (sys.state === "loading") {
    return (
      <div className="flex min-h-[300px] items-center justify-center gap-3 rounded-3xl border border-violet-100 bg-white/80 text-zinc-500">
        <Spinner /> Looking for ClipMitra on this computer…
      </div>
    );
  }
  if (sys.state === "offline" && hosted && lna === "denied") {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50/60 p-8">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900">Your browser is blocking ClipMitra</h2>
        <p className="mt-1.5 max-w-xl text-zinc-700">
          ClipMitra processes videos on your own computer, so this page needs permission to talk to the
          ClipMitra engine running there. That permission is currently blocked for this site.
        </p>
        <ol className="mt-5 space-y-2 text-sm text-zinc-700">
          <li><b>1.</b> Click the site settings icon at the left of the address bar.</li>
          <li><b>2.</b> Set <b>Local network access</b> (or “Apps on this device”) to <b>Allow</b>.</li>
          <li><b>3.</b> Reload this page.</li>
        </ol>
      </section>
    );
  }
  if (sys.state === "offline") {
    return (
      <section className="rounded-3xl border border-violet-100 bg-white/80 p-8 shadow-[0_8px_40px_-12px_rgba(124,58,237,0.15)]">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700">
            <MonitorIcon width={26} height={26} />
          </span>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">ClipMitra runs on your own computer</h2>
            <p className="mt-1.5 max-w-xl text-zinc-600">
              Your videos never leave your machine: the AI (transcription, highlight finding, face tracking and
              captions) runs locally on your GPU. This page connects to the ClipMitra engine on this computer,
              and it isn&apos;t running right now.
            </p>
            <ol className="mt-5 space-y-2 text-sm text-zinc-700">
              <li><b>1.</b> Start Ollama.</li>
              <li><b>2.</b> Start the engine: <code className="rounded bg-zinc-100 px-1.5 py-0.5">scripts\dev-backend.ps1</code></li>
              <li><b>3.</b> Keep this page open — it connects automatically. If your browser asks to allow access to devices on your local network, choose <b>Allow</b>.</li>
            </ol>
            <p className="mt-5 text-xs text-zinc-400">
              ClipMitra is in private beta. Needs Windows with an NVIDIA GPU (6 GB+), FFmpeg and Ollama.
            </p>
          </div>
        </div>
      </section>
    );
  }
  return <>{children}</>;
}
