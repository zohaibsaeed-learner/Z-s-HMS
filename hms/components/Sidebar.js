"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { Icon } from "./ui";
import ThemeToggle from "./ThemeToggle";

const links = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/patients", label: "Patients", icon: "person" },
  { href: "/appointments", label: "Appointments", icon: "calendar" },
];

function Brand({ size = 34 }) {
  return (
    <Link href="/" aria-label="Go to dashboard" data-cur
      className="group flex items-center gap-3 rounded-[4px] outline-offset-4">
      <span className="transition-transform duration-200 group-hover:scale-110">
        <Logo size={size} />
      </span>
      <span className="leading-tight">
        <span className="block font-brand text-[14px] font-extrabold uppercase tracking-[0.02em] transition-colors group-hover:text-brand">
          Z&rsquo;s HMS
        </span>
        <span className="block text-[12px] text-muted">Hospital Management</span>
      </span>
    </Link>
  );
}

function Nav({ path }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center border-b border-line px-5">
        <Brand />
      </div>

      <div className="px-5 pb-2 pt-7 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
        Menu
      </div>
      <nav className="flex flex-col gap-1 px-3" aria-label="Main">
        {links.map((l) => {
          const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-[4px] px-3 py-2.5 text-[14px] transition-colors duration-150 ${
                active ? "bg-blush font-semibold text-brand" : "text-ink hover:bg-mist hover:text-brand"
              }`}>
              <Icon name={l.icon} size={18} />
              <span className="flex-1">{l.label}</span>
              {active && (
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                  <path d="M4 0h2v4h4v2H6v4H4V6H0V4h4z" fill="currentColor" />
                </svg>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4">
        <ThemeToggle />
      </div>
    </div>
  );
}

export default function Sidebar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [path]);

  return (
    <>
      {/* desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-line bg-surface lg:block">
        <Nav path={path} />
      </aside>

      {/* mobile top bar */}
      <div className="glass sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line px-4 lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open menu"
          className="rounded-[4px] p-1.5 transition-colors hover:bg-mist hover:text-brand">
          <Icon name="menu" size={20} />
        </button>
        <Brand size={26} />
        <span className="ml-auto"><ThemeToggle compact /></span>
      </div>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onMouseDown={() => setOpen(false)}
          style={{ background: "color-mix(in srgb, var(--color-ink) 45%, transparent)" }}>
          <aside className="h-full w-64 border-r border-line bg-surface animate-[hms-drawer-left_.22s_var(--ease)]"
            onMouseDown={(e) => e.stopPropagation()}>
            <Nav path={path} />
          </aside>
        </div>
      )}
    </>
  );
}
