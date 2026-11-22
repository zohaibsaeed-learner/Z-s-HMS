"use client";
import { useEffect } from "react";
import { Icon } from "./ui";

export default function Toast({ msg, onDone }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [msg, onDone]);

  if (!msg) return null;
  const ok = msg.ok;

  return (
    <div className="fixed right-6 top-6 z-50 flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border border-line bg-white p-4 shadow-xl">
      <div className={`absolute inset-y-0 left-0 w-1.5 ${ok ? "bg-emerald-600" : "bg-brand"}`} />
      <div
        className={`ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          ok ? "bg-emerald-50 text-emerald-700" : "bg-blush text-brand"
        }`}
      >
        <Icon name={ok ? "check" : "alert"} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{ok ? "Success" : "Action not completed"}</div>
        <div className="mt-0.5 whitespace-pre-line text-sm text-muted">{msg.text}</div>
      </div>
      <button onClick={onDone} className="rounded p-1 text-muted hover:bg-mist">
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}