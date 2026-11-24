"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle({ compact = false }) {
  const [theme, setTheme] = useState(null); // null until mounted, avoids hydration mismatch

  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next === "dark" ? "dark" : "light");
    try { localStorage.setItem("hms-theme", next); } catch {}
  };

  const isDark = theme === "dark";
  const sun = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
    </svg>
  );
  const moon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5z" />
    </svg>
  );

  if (compact) {
    return (
      <button onClick={toggle} data-cur aria-label="Toggle dark mode"
        className="rounded-[4px] p-1.5 text-muted transition-colors hover:bg-mist hover:text-brand">
        {isDark ? sun : moon}
      </button>
    );
  }

  return (
    <button onClick={toggle} data-cur role="switch" aria-checked={isDark} aria-label="Toggle dark mode"
      className="group flex w-full items-center justify-between rounded-[4px] border border-line bg-surface px-3 py-2 text-[13px] transition-colors hover:border-brand">
      <span className="flex items-center gap-2 text-muted transition-colors group-hover:text-brand">
        {isDark ? sun : moon}
        {isDark ? "Dark" : "Light"} mode
      </span>
      <span className={`relative h-5 w-9 rounded-full transition-colors ${isDark ? "bg-brand" : "bg-mist"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-surface shadow-sm transition-all ${isDark ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}
