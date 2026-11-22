"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { Icon } from "./ui";

const links = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/patients", label: "Patients", icon: "users" },
  { href: "/appointments", label: "Appointments", icon: "calendar" },
];

export default function Sidebar() {
  const path = usePathname();
  const [online, setOnline] = useState(null);

  // Live check that the C++ server is reachable
  useEffect(() => {
    let alive = true;
    const ping = () =>
      fetch("/api/patients", { cache: "no-store" })
        .then((r) => alive && setOnline(r.ok))
        .catch(() => alive && setOnline(false));
    ping();
    const t = setInterval(ping, 8000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col justify-between border-r border-line bg-white">
      <div>
        <div className="flex h-16 items-center gap-3 border-b border-line px-6">
          <Logo size={34} />
          <div className="leading-tight">
            <div className="font-display text-base font-bold">Z&apos;s HMS</div>
            <div className="text-xs text-muted">Hospital Management</div>
          </div>
        </div>

        <div className="px-6 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-widest text-muted">
          Clinical Operations
        </div>
        <nav className="flex flex-col gap-1 px-4">
          {links.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-brand text-white shadow-sm"
                    : "text-ink hover:bg-blush/40 hover:text-brand-dark"
                }`}
              >
                <Icon name={l.icon} size={19} />
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-line bg-mist/60 p-4">
        <div className="rounded-lg border border-line bg-white p-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold">
              <Icon name="pulse" size={14} className="text-brand" />
              C++ Backend
            </span>
            <span
              className={`h-2 w-2 rounded-full ${
                online === null ? "bg-gray-300" : online ? "bg-emerald-500" : "bg-brand"
              }`}
            />
          </div>
          <div className="mt-1 text-xs text-muted">
            {online === null ? "Checking…" : online ? "Connected" : "Offline. Start hms_server.exe"}
          </div>
        </div>
        <div className="mt-3 px-1 text-[11px] text-muted">Linked list · Queue · File storage</div>
      </div>
    </aside>
  );
}