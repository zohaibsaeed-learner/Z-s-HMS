"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./ui";
import { useApp } from "./Providers";

function ToastItem({ toast, onDone }) {
  const [paused, setPaused] = useState(false);
  const left = useRef(4000);
  const start = useRef(0);
  const raf = useRef(0);

  useEffect(() => {
    function loop(t) {
      if (!start.current) start.current = t;
      if (!paused) {
        left.current -= t - start.current;
        start.current = t;
        if (left.current <= 0) { onDone(); return; }
      } else {
        start.current = t;
      }
      raf.current = requestAnimationFrame(loop);
    }
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [paused, onDone]);

  const ok = toast.ok;
  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="status"
      className="glass pointer-events-auto flex w-80 items-start gap-3 overflow-hidden rounded-[4px] border border-line p-3 animate-[hms-modal-in_.18s_var(--ease)]"
      style={{ boxShadow: "0 12px 40px -12px rgba(23,24,26,.35)" }}>
      <span className={`absolute left-0 top-0 h-full w-1 ${ok ? "bg-muted" : "bg-brand"}`} />
      <span className={`ml-1 mt-0.5 ${ok ? "text-muted" : "text-brand"}`}>
        <Icon name={ok ? "check" : "alert"} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold">{ok ? "Done" : "Not completed"}</div>
        <div className="mt-0.5 whitespace-pre-line break-words text-[13px] text-muted">{toast.message}</div>
      </div>
      <button onClick={onDone} aria-label="Dismiss" className="rounded-[4px] p-0.5 text-muted transition-colors hover:bg-blush hover:text-brand">
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}

export default function ToastStack() {
  const { toasts, dismiss } = useApp();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="relative">
          <ToastItem toast={t} onDone={() => dismiss(t.id)} />
        </div>
      ))}
    </div>
  );
}
