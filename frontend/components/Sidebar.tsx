"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSystemStatus } from "@/hooks/useSystemStatus";
import { FolderIcon, GearIcon, MonitorIcon, PlayLogo, PlusIcon } from "./icons";

const NAV = [
  { href: "/", label: "Create Clips", Icon: PlusIcon },
  { href: "/projects", label: "My Projects", Icon: FolderIcon },
  { href: "/settings", label: "Settings", Icon: GearIcon },
];

export function Sidebar() {
  const path = usePathname();
  const sys = useSystemStatus();

  const dot =
    sys.state === "ok"
      ? sys.data.ready_for_processing ? "bg-emerald-500" : "bg-amber-400"
      : sys.state === "offline" ? "bg-rose-500" : "bg-zinc-300";
  const sub =
    sys.state === "loading" ? "Checking…"
      : sys.state === "offline" ? "Backend offline"
      : sys.data.ready_for_processing ? "Uses your computer (Free)"
      : "Setup incomplete";

  return (
    <aside className="relative hidden w-[264px] shrink-0 flex-col overflow-hidden border-r border-violet-100/70 bg-gradient-to-b from-violet-50/70 to-white px-4 py-6 md:flex">
      <Link href="/" className="mb-9 flex items-center gap-3 px-2">
        <PlayLogo />
        <div className="leading-tight">
          <div className="text-[19px] font-bold tracking-tight text-zinc-900">ClipMitra</div>
          <div className="text-xs font-medium text-zinc-500">by Nishtek</div>
        </div>
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, label, Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition ${
                active ? "bg-violet-100/80 text-zinc-900" : "text-zinc-600 hover:bg-violet-50 hover:text-zinc-900"
              }`}
            >
              <Icon className={active ? "text-violet-600" : "text-zinc-500"} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-96 rounded-[50%] bg-violet-100/50" />

      <Link
        href="/settings"
        className="relative mt-auto flex items-center gap-3 rounded-2xl border border-white bg-white/90 p-3.5 shadow-sm shadow-violet-100"
      >
        <MonitorIcon className="text-zinc-600" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-zinc-800">Local Processing</div>
          <div className="truncate text-xs text-zinc-500">{sub}</div>
        </div>
        <span className={`h-2.5 w-2.5 self-start rounded-full ${dot}`} />
      </Link>
    </aside>
  );
}
