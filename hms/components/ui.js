"use client";

export const cardCls = "rounded-2xl border border-line bg-white shadow-sm";

export const inputCls =
  "h-10 w-full rounded-lg border border-line bg-mist px-3 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-60";

export const btnPrimary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60";

export const btnGhost =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink transition hover:bg-mist";

const icons = {
  grid: (
    <>
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  calendar: (
    <>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="m9 16 2 2 4-4" />
    </>
  ),
  plus: (
    <>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </>
  ),
  userPlus: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" x2="19" y1="8" y2="14" />
      <line x1="22" x2="16" y1="11" y2="11" />
    </>
  ),
  edit: (
    <>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  x: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  cancel: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </>
  ),
  pulse: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
};

export function Icon({ name, size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

export function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          {eyebrow}
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Avatar({ name = "?", size = 36 }) {
  const initials =
    name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-blush text-xs font-bold text-brand-dark"
    >
      {initials}
    </div>
  );
}

const badge = {
  Scheduled: "bg-amber-50 text-amber-800",
  Completed: "bg-emerald-50 text-emerald-700",
  Cancelled: "bg-gray-100 text-gray-600",
};
const dot = {
  Scheduled: "bg-amber-500",
  Completed: "bg-emerald-500",
  Cancelled: "bg-gray-400",
};

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${badge[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot[status]}`} />
      {status}
    </span>
  );
}

export function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}