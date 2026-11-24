"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getJson } from "../lib/api";

const AppCtx = createContext(null);
export function useApp() {
  const v = useContext(AppCtx);
  if (!v) throw new Error("useApp must be used inside <Providers>");
  return v;
}

let nextToastId = 0;

export default function Providers({ children }) {
  const [patients, setPatients] = useState([]);
  const [appts, setAppts] = useState([]);
  const [online, setOnline] = useState(null);   // null = unknown, then true/false
  const [loading, setLoading] = useState(true);  // true only until the first fetch resolves
  const [toasts, setToasts] = useState([]);

  const load = useCallback(async () => {
    try {
      const [p, a] = await Promise.all([
        getJson("/api/patients"),
        getJson("/api/appointments"),
      ]);
      setPatients(Array.isArray(p) ? p : []);
      setAppts(Array.isArray(a) ? a : []);
      setOnline(true);
    } catch {
      setOnline(false);           // offline: keep last-known data, do NOT clear to []
    } finally {
      setLoading(false);
    }
  }, []);

  // initial fetch + lightweight liveness poll
  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  const toast = useCallback((ok, message) => {
    const id = ++nextToastId;
    setToasts((list) => [...list, { id, ok, message }]);
    return id;
  }, []);
  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const value = {
    patients, appts, online, loading,
    reload: load, toast, toasts, dismiss,
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
