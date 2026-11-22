"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { get, post } from "../lib/api";
import Toast from "../components/Toast";
import { Icon, PageHeader, Avatar, cardCls, btnPrimary } from "../components/ui";

function Stat({ label, value, icon, tone }) {
  return (
    <div className={`${cardCls} p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</div>
          <div className="mt-2 font-display text-4xl font-bold">{value}</div>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
          <Icon name={icon} size={22} />
        </div>
      </div>
    </div>
  );
}

const bars = [
  { label: "Scheduled", color: "bg-amber-500" },
  { label: "Completed", color: "bg-emerald-500" },
  { label: "Cancelled", color: "bg-gray-400" },
];

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [appts, setAppts] = useState([]);
  const [toast, setToast] = useState(null);
  const [today, setToday] = useState("");

  const load = async () => {
    setPatients(await get("/api/patients"));
    setAppts(await get("/api/appointments"));
  };

  useEffect(() => {
    load();
    setToday(
      new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  const count = (s) => appts.filter((a) => a.status === s).length;
  const next = appts.find((a) => a.status === "Scheduled");
  const nextPatient = next ? patients.find((p) => p.id === next.patientId) : null;
  const recent = patients.slice(-5).reverse();

  const processNext = async () => {
    const r = await post("/api/appointments/process");
    setToast({ ok: r.ok, text: r.message });
    load();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Clinical Administration"
        title="Dashboard"
        subtitle="Overview of patient records and the appointment queue."
      >
        {today && (
          <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium">
            <Icon name="calendar" size={16} className="text-brand" />
            {today}
          </div>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total patients" value={patients.length} icon="users" tone="bg-blush/60 text-brand" />
        <Stat label="Scheduled" value={count("Scheduled")} icon="clock" tone="bg-amber-50 text-amber-700" />
        <Stat label="Completed" value={count("Completed")} icon="check" tone="bg-emerald-50 text-emerald-700" />
        <Stat label="Cancelled" value={count("Cancelled")} icon="cancel" tone="bg-gray-100 text-gray-600" />
      </div>

      {/* Next in queue */}
      <div className={`${cardCls} relative mt-6 overflow-hidden p-7`}>
        <div className="absolute inset-y-0 left-0 w-1.5 bg-brand" />
        <div className="pointer-events-none absolute -bottom-16 right-0 h-64 w-64 rounded-full bg-blush/40 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blush/50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-dark">
              <span className="h-2 w-2 rounded-full bg-brand" />
              Next in queue · first come, first served
            </span>

            {next ? (
              <div className="mt-4 flex items-center gap-4">
                <Avatar name={nextPatient?.name} size={52} />
                <div>
                  <div className="font-display text-2xl font-bold">
                    {nextPatient ? nextPatient.name : `Patient ${next.patientId}`}
                  </div>
                  <div className="mt-0.5 text-sm text-muted">
                    Appointment #{next.id} · Patient ID {next.patientId}
                    {nextPatient ? ` · ${nextPatient.disease}` : ""}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-lg bg-mist px-2.5 py-1">Dr. {next.doctor}</span>
                    <span className="rounded-lg bg-mist px-2.5 py-1">{next.date}</span>
                    <span className="rounded-lg bg-mist px-2.5 py-1">{next.time}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <div className="font-display text-2xl font-bold">The queue is empty</div>
                <div className="mt-1 text-sm text-muted">No scheduled appointments are waiting.</div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 lg:min-w-[220px]">
            <button onClick={processNext} disabled={!next} className={`${btnPrimary} h-12`}>
              Process next
              <Icon name="arrow" size={18} />
            </button>
            <Link
              href="/appointments"
              className="text-center text-sm font-medium text-brand hover:underline"
            >
              Go to appointments →
            </Link>
          </div>
        </div>
      </div>

      {/* Lower section */}
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className={`${cardCls} p-6 lg:col-span-3`}>
          <h3 className="font-display text-lg font-semibold">Appointment status</h3>
          <p className="text-sm text-muted">Share of all {appts.length} appointments by status.</p>
          <div className="mt-5 space-y-4">
            {bars.map((b) => {
              const n = count(b.label);
              const pct = appts.length ? (n / appts.length) * 100 : 0;
              return (
                <div key={b.label}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-medium">{b.label}</span>
                    <span className="text-muted">{n}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-mist">
                    <div className={`h-full rounded-full ${b.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`${cardCls} p-6 lg:col-span-2`}>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Recently registered</h3>
            <Link href="/patients" className="text-sm font-medium text-brand hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {recent.length === 0 && <div className="text-sm text-muted">No patients registered yet.</div>}
            {recent.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <Avatar name={p.name} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.name}</div>
                  <div className="truncate text-xs text-muted">{p.disease}</div>
                </div>
                <span className="text-xs font-semibold text-brand-dark">#{p.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Toast msg={toast} onDone={() => setToast(null)} />
    </div>
  );
}