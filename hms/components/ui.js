"use client";
import { useEffect, useRef, useState } from "react";
import { useApp } from "./Providers";

/* ------------------------------------------------------------------ */
/* shared class tokens                                                 */
/* ------------------------------------------------------------------ */
export const cardCls = "rounded-[4px] border border-line bg-surface";
export const inputCls =
  "h-10 w-full rounded-[2px] border border-line bg-surface px-3 text-[14px] text-ink " +
  "transition-colors placeholder:text-muted/70 hover:border-muted focus:border-brand focus:outline-none disabled:opacity-40";

/* ------------------------------------------------------------------ */
/* icons: simple geometric strokes (no icon library)                   */
/* ------------------------------------------------------------------ */
const paths = {
  plus: "M12 5v14M5 12h14",
  x: "M6 6l12 12M18 6L6 18",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M20 20l-4-4",
  trash: "M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13",
  edit: "M5 19h14M7 15l8-8 2 2-8 8H7z",
  caret: "M6 9l6 6 6-6",
  menu: "M4 7h16M4 12h16M4 17h16",
  check: "M5 12l4 4 10-10",
  alert: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 8v5M12 16h.01",
  arrow: "M5 12h14M13 6l6 6-6 6",
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  person: "M12 5a3.2 3.2 0 1 0 0 6.4A3.2 3.2 0 0 0 12 5M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6",
  calendar: "M5 6h14v14H5zM5 10h14M9 3v4M15 3v4",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l3 2",
};
export function Icon({ name, size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      className={`shrink-0 ${className}`} aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

/* small solid plus used as a brand glyph */
export function PlusGlyph({ size = 12, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" className={className} aria-hidden="true">
      <path d="M4.5 0h3v4.5H12v3H7.5V12h-3V7.5H0v-3h4.5z" fill="currentColor" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* buttons, fields, headers                                            */
/* ------------------------------------------------------------------ */
const BTN_BASE =
  "inline-flex h-10 items-center justify-center gap-2 rounded-[4px] px-4 text-[14px] font-medium " +
  "transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none";
const BTN_STYLES = {
  primary: "bg-brand text-white hover:bg-brand-700",
  secondary: "bg-surface text-ink border border-line hover:border-brand hover:text-brand",
  ghost: "text-ink hover:text-brand hover:bg-blush/50",
  inverse: "bg-surface text-ink hover:bg-blush hover:text-brand",
};
// Same look for <Link> elements that act like buttons.
export function btnCls(variant = "primary", extra = "") {
  return `${BTN_BASE} ${BTN_STYLES[variant]} ${extra}`;
}
export function Button({ variant = "primary", className = "", ...rest }) {
  return <button className={btnCls(variant, className)} {...rest} />;
}

export function Field({ label, hint, error, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-muted">
        <span>{label}{required && <span className="ml-0.5 text-brand">*</span>}</span>
        {hint && <span className="font-normal">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-[13px] text-brand">{error}</span>}
    </label>
  );
}

export function PageHeader({ eyebrow, title, caption, children }) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && (
          <div className="mb-2 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em] text-muted">
            <PlusGlyph size={9} className="text-brand" />
            {eyebrow}
          </div>
        )}
        <h1 className="text-[30px] font-bold leading-[1.1]">{title}</h1>
        {caption && <p className="mt-1.5 text-[14px] text-muted">{caption}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* status + priority chips                                             */
/* ------------------------------------------------------------------ */
export function StatusBadge({ status }) {
  const map = {
    Scheduled: "bg-mist text-ink",
    Completed: "bg-mist text-muted",
    Cancelled: "bg-mist text-muted line-through",
  };
  return (
    <span className={`inline-flex items-center rounded-[4px] px-2 py-0.5 text-[12px] font-medium ${map[status] || "bg-mist text-muted"}`}>
      {status}
    </span>
  );
}

export const priorityRank = { Critical: 3, Urgent: 2, Normal: 1 };
export function PriorityBadge({ priority = "Normal" }) {
  const map = {
    Normal: "bg-mist text-muted",
    Urgent: "bg-blush text-brand border border-brand",
    Critical: "bg-brand text-white",
  };
  return (
    <span className={`inline-flex items-center rounded-[4px] px-2 py-0.5 text-[12px] font-medium ${map[priority] || map.Normal}`}>
      {priority}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* overlay plumbing                                                    */
/* Runs ONCE per open overlay. onClose is read through a ref, so typing */
/* in a field (which re-renders the parent) never re-runs the effect   */
/* and never steals focus. Only the top-most overlay reacts to keys.   */
/* ------------------------------------------------------------------ */
const overlayStack = [];
let overlayIds = 0;

function useOverlay(onClose) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const id = ++overlayIds;
    overlayStack.push(id);
    const prev = document.activeElement;
    const node = ref.current;
    const sel = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

    // first real input wins, then an explicit autofocus target, then anything focusable
    const first =
      (node && node.querySelector("[data-autofocus]")) ||
      (node && node.querySelector("input:not([disabled]),select:not([disabled]),textarea:not([disabled])")) ||
      (node && node.querySelector(sel));
    if (first) first.focus();

    function onKey(e) {
      if (overlayStack[overlayStack.length - 1] !== id) return;
      if (e.key === "Escape") { e.preventDefault(); closeRef.current(); return; }
      if (e.key === "Tab" && node) {
        const items = node.querySelectorAll(sel);
        if (!items.length) return;
        const a = items[0], b = items[items.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
        else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
      }
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      const i = overlayStack.indexOf(id);
      if (i >= 0) overlayStack.splice(i, 1);
      if (overlayStack.length === 0) document.body.style.overflow = "";
      if (prev && prev.focus) prev.focus();
    };
  }, []);
  return ref;
}

const SCRIM = { background: "color-mix(in srgb, var(--color-ink) 45%, transparent)" };
const OVERLAY_SHADOW = { boxShadow: "0 24px 60px -20px rgba(23,24,26,.45)" };

function CloseBtn({ onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label="Close"
      className="rounded-[4px] p-1.5 text-muted transition-colors hover:bg-blush hover:text-brand">
      <Icon name="x" size={18} />
    </button>
  );
}

export function Modal({ title, onClose, children }) {
  const ref = useOverlay(onClose);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-[hms-fade-in_.15s_ease]"
      style={SCRIM} onMouseDown={() => onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} style={OVERLAY_SHADOW}
        onMouseDown={(e) => e.stopPropagation()}
        className="glass w-full max-w-lg overflow-hidden rounded-[8px] border border-line animate-[hms-modal-in_.2s_var(--ease)]">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-[19px] font-bold">{title}</h2>
          <CloseBtn onClick={() => onClose()} />
        </div>
        {children}
      </div>
    </div>
  );
}

export function Drawer({ title, onClose, children }) {
  const ref = useOverlay(onClose);
  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-[hms-fade-in_.15s_ease]"
      style={SCRIM} onMouseDown={() => onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} style={OVERLAY_SHADOW}
        onMouseDown={(e) => e.stopPropagation()}
        className="glass flex h-full w-full max-w-md flex-col border-l border-line animate-[hms-drawer-in_.22s_var(--ease)]">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-[19px] font-bold">{title}</h2>
          <CloseBtn onClick={() => onClose()} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* loading + empty states                                              */
/* ------------------------------------------------------------------ */
export function Skeleton({ className = "" }) {
  return <div className={`skel ${className}`} aria-hidden="true" />;
}

// The plus that turns and breathes, with "Loading Data" and three looping dots.
export function PlusLoader({ label = "Loading Data", size = 56 }) {
  return (
    <div className="flex flex-col items-center gap-6" role="status" aria-live="polite">
      <div className="relative" style={{ width: size, height: size }}>
        <span className="plus-halo" />
        <svg className="relative" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="var(--color-brand)" />
          <path className="plus-beat" d="M13 6.5h6v6.5h6.5v6H19v6.5h-6V19H6.5v-6H13z" fill="#FFFFFF" />
        </svg>
      </div>
      <div className="font-heading text-[15px] font-bold tracking-[0.02em] text-ink">
        {label}
        <span className="dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span>
      </div>
    </div>
  );
}

// Inline block version, for sections that are still waiting on data.
export function LoadingBlock({ label }) {
  return <div className="flex justify-center py-16"><PlusLoader label={label} size={44} /></div>;
}

// Full-screen splash shown until the first fetch resolves (at least ~700ms, so it never flashes).
export function LoadingSplash() {
  const { loading } = useApp();
  const [minDone, setMinDone] = useState(false);
  const [gone, setGone] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMinDone(true), 700); return () => clearTimeout(t); }, []);
  const hide = !loading && minDone;
  useEffect(() => {
    if (!hide) return;
    const t = setTimeout(() => setGone(true), 320);
    return () => clearTimeout(t);
  }, [hide]);
  if (gone) return null;
  return (
    <div className={`fixed inset-0 z-[80] grid place-items-center bg-canvas transition-opacity duration-300 ${
      hide ? "pointer-events-none opacity-0" : "opacity-100"}`}>
      <PlusLoader />
    </div>
  );
}

export function EmptyState({ title, caption, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <svg width="44" height="44" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="1" y="1" width="30" height="30" rx="7" fill="none" stroke="var(--color-line)" strokeWidth="2" />
        <path d="M13 6.5h6v6.5h6.5v6H19v6.5h-6V19H6.5v-6H13z" fill="var(--color-line)" />
      </svg>
      <div className="mt-4 font-heading text-[16px] font-bold">{title}</div>
      {caption && <div className="mt-1 max-w-sm text-[14px] text-muted">{caption}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* global pill cursor + offline banner                                 */
/* ------------------------------------------------------------------ */
export function Cursor() {
  useEffect(() => {
    const fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    const dot = document.createElement("div"); dot.className = "cur";
    const ring = document.createElement("div"); ring.className = "cur-ring";
    document.body.append(dot, ring);
    document.body.classList.add("cursor-on");

    let mx = innerWidth / 2, my = innerHeight / 2;
    let dx = mx, dy = my, rx = mx, ry = my, raf = 0, shown = false;

    const move = (e) => {
      mx = e.clientX; my = e.clientY;
      if (!shown) { shown = true; dot.style.opacity = "1"; ring.style.opacity = "1"; }
    };
    const over = (e) => {
      const t = e.target;
      if (t.closest && t.closest("input,select,textarea")) {
        dot.classList.add("beam"); ring.classList.add("beam");
        dot.classList.remove("hot"); ring.classList.remove("hot");
      } else if (t.closest && t.closest("a,button,[data-cur]")) {
        dot.classList.add("hot"); ring.classList.add("hot");
        dot.classList.remove("beam"); ring.classList.remove("beam");
      } else {
        dot.classList.remove("hot", "beam"); ring.classList.remove("hot", "beam");
      }
    };
    const leave = () => { dot.style.opacity = "0"; ring.style.opacity = "0"; shown = false; };

    addEventListener("mousemove", move, { passive: true });
    addEventListener("mouseover", over, { passive: true });
    document.addEventListener("mouseleave", leave);

    const tick = () => {
      dx += (mx - dx) * 0.35; dy += (my - dy) * 0.35;
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      dot.style.transform = `translate(${dx}px,${dy}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("mousemove", move);
      removeEventListener("mouseover", over);
      document.removeEventListener("mouseleave", leave);
      dot.remove(); ring.remove();
      document.body.classList.remove("cursor-on");
    };
  }, []);
  return null;
}

export function OfflineBanner() {
  const { online } = useApp();
  if (online !== false) return null;
  return (
    <div role="alert" className="flex items-center gap-2 border-b border-line bg-blush px-6 py-2 text-[13px] text-brand-700 lg:px-10">
      <Icon name="alert" size={15} />
      Can&rsquo;t reach the server. Start <span className="font-mono">hms_server.exe</span>. Showing the last known data.
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* count-up + inline-SVG charts (real data only)                       */
/* ------------------------------------------------------------------ */
export function CountUp({ value = 0, className = "" }) {
  const [n, setN] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const to = Number(value) || 0;
    const start0 = from.current;
    if (reduce || start0 === to) { setN(to); from.current = to; return; }
    let raf = 0, start = 0;
    const step = (t) => {
      if (!start) start = t;
      const k = Math.min(1, (t - start) / 800);
      const v = Math.round(start0 + (to - start0) * (1 - Math.pow(1 - k, 3)));
      setN(v);
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = to;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={className}>{n}</span>;
}

// Ring with the total in the middle. data = [{label, value, color}]
export function Ring({ data, size = 168, thickness = 16, centerLabel = "Total" }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2, c = 2 * Math.PI * r, cx = size / 2;
  const [drawn, setDrawn] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setDrawn(true)); return () => cancelAnimationFrame(id); }, []);
  const gap = total > 1 ? 3 : 0;
  let off = 0;
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--color-mist)" strokeWidth={thickness} />
          {total > 0 && data.map((d, i) => {
            const len = Math.max(0, (d.value / total) * c - (d.value ? gap : 0));
            const seg = (
              <circle key={i} cx={cx} cy={cx} r={r} fill="none" stroke={d.color} strokeWidth={thickness}
                strokeDasharray={`${drawn ? len : 0} ${c}`} strokeDashoffset={-off}
                style={{ transition: `stroke-dasharray .9s var(--ease) ${i * 0.12}s` }} />
            );
            off += (d.value / total) * c;
            return seg;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="font-mono tnum text-[34px] font-semibold leading-none"><CountUp value={total} /></div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted">{centerLabel}</div>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-2.5 sm:w-auto">
        {data.map((d, i) => (
          <li key={i} className="hov-red flex items-center gap-3 text-[14px]">
            <span className="h-3 w-3 rounded-[2px]" style={{ background: d.color, outline: "1px solid var(--color-line)" }} />
            <span className="min-w-[72px]">{d.label}</span>
            <span className="ml-auto font-mono tnum font-semibold">{d.value}</span>
            <span className="w-10 text-right font-mono tnum text-[12px] text-muted">
              {total ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Vertical columns. data = [{label, value, highlight?}]
export function Columns({ data, height = 190 }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end justify-around gap-2 sm:gap-4" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="group flex h-full min-w-0 max-w-[72px] flex-1 flex-col items-center justify-end gap-2" data-cur>
          <span className="font-mono tnum text-[12px] text-muted transition-colors group-hover:text-brand">{d.value}</span>
          <div className="flex w-full items-end" style={{ height: "100%" }}>
            <div className={`grow-y w-full rounded-t-[2px] transition-colors ${
              d.highlight ? "bg-brand" : "bg-ink group-hover:bg-brand"}`}
              style={{ height: `${Math.max(4, (d.value / max) * 100)}%`, animationDelay: `${i * 0.05}s` }}
              title={`${d.label}: ${d.value}`} />
          </div>
          <span className={`max-w-full truncate font-mono text-[11px] transition-colors group-hover:text-brand ${
            d.highlight ? "font-semibold text-brand" : "text-muted"}`}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// Horizontal bars. data = [{label, value, color?, sub?}]
export function HBars({ data }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-4">
      {data.map((d, i) => (
        <div key={i} className="hov-red">
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[14px]">
            <span className="truncate">{d.label}</span>
            <span className="shrink-0 font-mono tnum">
              <span className="font-semibold">{d.value}</span>
              {d.sub != null && <span className="ml-2 text-[12px] text-muted">{d.sub}</span>}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-[2px] bg-mist">
            <div className="grow-x h-full rounded-[2px]"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color || "var(--color-ink)", animationDelay: `${i * 0.06}s` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// One 100% bar split into parts. data = [{label, value, color}]
export function StackBar({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-[2px] bg-mist">
        {data.map((d, i) => d.value > 0 && (
          <div key={i} className="grow-x h-full" title={`${d.label}: ${d.value}`}
            style={{ width: `${(d.value / total) * 100}%`, background: d.color, animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {data.map((d, i) => (
          <div key={i} className="hov-red">
            <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.08em] text-muted">
              <span className="h-2 w-2 rounded-[2px]" style={{ background: d.color, outline: "1px solid var(--color-line)" }} />
              {d.label}
            </div>
            <div className="mt-1 font-mono tnum text-[22px] font-semibold">{d.value}</div>
            <div className="font-mono tnum text-[12px] text-muted">{Math.round((d.value / total) * 100)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
