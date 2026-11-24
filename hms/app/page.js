"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "../components/Providers";
import { post } from "../lib/api";
import {
  CountUp, Ring, Columns, HBars, StackBar, Button, btnCls, Icon, PlusGlyph,
  PriorityBadge, StatusBadge, priorityRank, cardCls,
} from "../components/ui";

const pad = (n) => String(n).padStart(2, "0");
const dateKey = (d) => (d || "").split("-").reverse().join(""); // DD-MM-YYYY -> YYYYMMDD
const toDMY = (d) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
const prio = (a) => a.priority || "Normal";
const PLUS = "M13 0h6v13h13v6H19v13h-6V19H0v-6h13z";

function useClock() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function Panel({ title, caption, action, className = "", children, delay = 0 }) {
  return (
    <section className={`${cardCls} slide-up p-6 ${className}`} style={{ animationDelay: `${delay}s` }}>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold">{title}</h2>
          {caption && <p className="mt-0.5 text-[13px] text-muted">{caption}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function Dashboard() {
  const { patients, appts, reload, toast } = useApp();
  const now = useClock();
  const today = now ? toDMY(now) : "";

  // ---- derived from real data only ----
  const scheduled = appts.filter((a) => a.status === "Scheduled");
  const completed = appts.filter((a) => a.status === "Completed").length;
  const cancelled = appts.filter((a) => a.status === "Cancelled").length;
  const lane = [...scheduled].sort((a, b) => priorityRank[prio(b)] - priorityRank[prio(a)] || a.id - b.id);
  const next = lane[0];
  const upNext = lane.slice(1, 5);
  const patientOf = (id) => patients.find((p) => p.id === id);
  const nextPatient = next ? patientOf(next.patientId) : null;

  const nCritical = scheduled.filter((a) => prio(a) === "Critical").length;
  const nUrgent = scheduled.filter((a) => prio(a) === "Urgent").length;
  const nNormal = scheduled.length - nCritical - nUrgent;
  const avgAge = patients.length ? Math.round(patients.reduce((s, p) => s + p.age, 0) / patients.length) : 0;
  const todayCount = today ? appts.filter((a) => a.date === today).length : 0;

  // appointments per date: start at today (or the latest dates), up to 10 columns
  const byDate = {};
  appts.forEach((a) => { byDate[a.date] = (byDate[a.date] || 0) + 1; });
  const dates = Object.keys(byDate).sort((a, b) => dateKey(a).localeCompare(dateKey(b)));
  let from = today ? dates.findIndex((d) => dateKey(d) >= dateKey(today)) : -1;
  if (from === -1) from = Math.max(0, dates.length - 10);
  from = Math.min(from, Math.max(0, dates.length - 10));
  const perDate = dates.slice(from, from + 10).map((d) => ({
    label: d.slice(0, 5), value: byDate[d], highlight: d === today,
  }));

  // doctor workload
  const docs = {};
  appts.forEach((a) => {
    const k = a.doctor.trim().toLowerCase();
    if (!docs[k]) docs[k] = { label: "Dr. " + a.doctor.trim(), value: 0, waiting: 0 };
    docs[k].value++;
    if (a.status === "Scheduled") docs[k].waiting++;
  });
  const doctorData = Object.values(docs).sort((a, b) => b.value - a.value).slice(0, 5)
    .map((d, i) => ({ ...d, sub: `${d.waiting} waiting`, color: i === 0 ? "var(--color-brand)" : "var(--color-ink)" }));

  const latest = [...appts].sort((a, b) => b.id - a.id).slice(0, 5);

  const metrics = [
    { label: "Patients", value: patients.length, icon: "person",
      sub: patients.length ? `Average age ${avgAge}` : "No records yet" },
    { label: "Appointments", value: appts.length, icon: "calendar",
      sub: today ? `${todayCount} scheduled for today` : "All bookings" },
    { label: "In queue", value: scheduled.length, icon: "clock",
      sub: `${completed} completed · ${cancelled} cancelled` },
    { label: "Critical waiting", value: nCritical, icon: "alert", accent: nCritical > 0,
      sub: nCritical ? `${nUrgent} urgent behind them` : "No critical cases" },
  ];

  const processNext = async () => {
    const r = await post("/api/appointments/process");
    toast(r.ok, r.message);
    reload();
  };

  const hour = now ? now.getHours() : 9;
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 21 ? "Good evening" : "Good night";
  const dateLong = now
    ? now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <div className="page-in">
      {/* ---------------- hero ---------------- */}
      <section className="slide-up relative overflow-hidden rounded-[8px] border border-line bg-surface px-6 py-9 sm:px-10 sm:py-12">
        <svg className="pointer-events-none absolute -bottom-40 -right-32 h-[420px] w-[420px]" viewBox="0 0 32 32" aria-hidden="true"
          style={{ color: "color-mix(in srgb, var(--color-brand) 6%, transparent)" }}>
          <path d={PLUS} fill="currentColor" />
        </svg>

        <div className="relative flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3 text-[12px] uppercase tracking-[0.14em] text-muted">
              <span className="live-dot" />
              <span>{greeting}</span>
            </div>
            <h1 className="mt-5 font-brand text-[clamp(40px,7.4vw,88px)] font-extrabold uppercase leading-[0.9] tracking-[-0.015em]">
              Z&rsquo;s HMS
            </h1>
            <p className="mt-5 flex items-center gap-2 font-heading text-[17px] font-bold text-ink">
              <PlusGlyph size={11} className="text-brand" />
              Hospital Management System
            </p>
          </div>

          <div className="shrink-0 lg:text-right">
            <div className="mb-2 text-[12px] uppercase tracking-[0.12em] text-muted">{dateLong}</div>
            <div className="font-mono tnum text-[clamp(36px,4.5vw,56px)] font-semibold leading-none">
              {now ? <>{pad(now.getHours())}:{pad(now.getMinutes())}<span className="text-muted">:{pad(now.getSeconds())}</span></> : "--:--"}
            </div>
            <div className="mt-3 flex gap-2 lg:justify-end">
              <Link href="/patients" className={btnCls("secondary")}><Icon name="plus" size={16} /> Patient</Link>
              <Link href="/appointments" className={btnCls("primary")}><Icon name="plus" size={16} /> Appointment</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- metric band ---------------- */}
      <section className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[8px] border border-line bg-line lg:grid-cols-4">
        {metrics.map((m, i) => (
          <div key={m.label} className="slide-up group bg-surface p-6 transition-colors hover:bg-[color-mix(in_srgb,var(--color-blush)_25%,var(--color-surface))]"
            style={{ animationDelay: `${0.06 + i * 0.06}s` }}>
            <div className="flex items-center justify-between text-[12px] uppercase tracking-[0.12em] text-muted transition-colors group-hover:text-brand">
              <span>{m.label}</span>
              <Icon name={m.icon} size={16} />
            </div>
            <div className={`mt-5 font-mono tnum text-[clamp(38px,4vw,56px)] font-semibold leading-none ${m.accent ? "text-brand" : ""}`}>
              <CountUp value={m.value} />
            </div>
            <div className="mt-3 text-[13px] text-muted">{m.sub}</div>
          </div>
        ))}
      </section>

      {/* ---------------- now serving + priority ---------------- */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <section className="slide-up relative overflow-hidden rounded-[8px] border border-line p-7 text-white sm:p-8 lg:col-span-7"
          style={{ animationDelay: ".18s", background: "var(--panel)" }}>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-white/60">
              <span className="live-dot" /> Now serving
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/40">by priority</span>
          </div>

          {next ? (
            <div className="relative">
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <PriorityBadge priority={prio(next)} />
                <span className="font-mono tnum text-[13px] text-white/50">Appointment #{next.id}</span>
              </div>
              <div className="mt-3 break-words font-heading text-[clamp(30px,3.6vw,44px)] font-bold leading-[1.05]">
                {nextPatient ? nextPatient.name : `Patient ${next.patientId}`}
              </div>
              <div className="mt-2 text-[15px] text-white/65">
                {nextPatient ? nextPatient.disease : "Record removed"} · Dr. {next.doctor}
              </div>

              <div className="mt-7 grid grid-cols-3 gap-px overflow-hidden rounded-[4px] bg-white/10">
                {[
                  ["Date", next.date],
                  ["Time", next.time],
                  ["Waiting", `${scheduled.length} in line`],
                ].map(([k, v]) => (
                  <div key={k} className="px-4 py-3" style={{ background: "var(--panel)" }}>
                    <div className="text-[11px] uppercase tracking-[0.12em] text-white/45">{k}</div>
                    <div className="mt-1 font-mono tnum text-[15px]">{v}</div>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Button onClick={processNext} className="h-11 px-5">
                  Process next <Icon name="arrow" size={16} />
                </Button>
                <Link href="/appointments" className="text-[14px] text-white/70 transition-colors hover:text-brand">
                  Open the full queue
                </Link>
              </div>
            </div>
          ) : (
            <div className="relative py-10">
              <div className="font-heading text-[30px] font-bold">The queue is clear.</div>
              <p className="mt-2 text-[15px] text-white/60">No scheduled appointments are waiting.</p>
              <Link href="/appointments" className={btnCls("inverse", "mt-6")}>
                <Icon name="plus" size={16} /> Book an appointment
              </Link>
            </div>
          )}

          {upNext.length > 0 && (
            <div className="relative mt-8 border-t border-white/10 pt-5">
              <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">Up next</div>
              <ol className="mt-3">
                {upNext.map((a, i) => {
                  const p = patientOf(a.patientId);
                  return (
                    <li key={a.id} className="group flex items-center gap-4 rounded-[4px] px-2 py-2.5 transition-colors hover:bg-white/5">
                      <span className="w-6 font-mono tnum text-[13px] text-white/35">{pad(i + 2)}</span>
                      <span className="min-w-0 flex-1 truncate text-[15px] transition-colors group-hover:text-brand">
                        {p ? p.name : `Patient ${a.patientId}`}
                      </span>
                      <PriorityBadge priority={prio(a)} />
                      <span className="hidden font-mono tnum text-[12px] text-white/45 sm:inline">{a.date} {a.time}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </section>

        <Panel title="Waiting by priority" caption="Critical, then Urgent, then Normal." className="flex flex-col lg:col-span-5" delay={0.24}>
          <div className="flex flex-1 items-center">
            {scheduled.length ? (
              <Ring size={196} thickness={18} centerLabel="Waiting" data={[
                { label: "Critical", value: nCritical, color: "var(--color-brand)" },
                { label: "Urgent", value: nUrgent, color: "#E58C99" },
                { label: "Normal", value: nNormal, color: "#BDBDB7" },
              ]} />
            ) : (
              <p className="w-full py-10 text-center text-[14px] text-muted">Nobody is waiting right now.</p>
            )}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-[4px] border border-line bg-line">
            {[
              ["Today", todayCount],
              ["Served", completed],
              ["Cancelled", cancelled],
            ].map(([k, v]) => (
              <div key={k} className="hov-red bg-surface px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted">{k}</div>
                <div className="mt-1 font-mono tnum text-[20px] font-semibold"><CountUp value={v} /></div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ---------------- volume + status ---------------- */}
      {appts.length > 0 ? (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            <Panel title="Appointments per date" className="lg:col-span-8" delay={0.3}
              caption={today && byDate[today] ? "Today is marked in red." : "Booked appointments by calendar date."}>
              <Columns data={perDate} />
            </Panel>
            <Panel title="Status" caption={`All ${appts.length} appointments.`} className="lg:col-span-4" delay={0.36}>
              <StackBar data={[
                { label: "Scheduled", value: scheduled.length, color: "var(--color-ink)" },
                { label: "Completed", value: completed, color: "var(--color-muted)" },
                { label: "Cancelled", value: cancelled, color: "var(--color-line)" },
              ]} />
            </Panel>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            <Panel title="Doctor workload" caption="Appointments per doctor, busiest first." className="lg:col-span-6" delay={0.42}>
              <HBars data={doctorData} />
            </Panel>
            <Panel title="Latest bookings" caption="Most recent appointments first." className="lg:col-span-6" delay={0.48}
              action={<Link href="/appointments" className="hov-red text-[13px] font-medium text-muted">View all</Link>}>
              <ul className="-mx-2">
                {latest.map((a) => {
                  const p = patientOf(a.patientId);
                  return (
                    <li key={a.id} className="group flex items-center gap-3 rounded-[4px] px-2 py-2.5 transition-colors hover:bg-mist">
                      <span className="w-10 font-mono tnum text-[12px] text-muted">#{a.id}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium transition-colors group-hover:text-brand">
                          {p ? p.name : "Deleted patient"}
                        </span>
                        <span className="block truncate font-mono tnum text-[12px] text-muted">
                          {a.date} {a.time} · Dr. {a.doctor}
                        </span>
                      </span>
                      <PriorityBadge priority={prio(a)} />
                      <StatusBadge status={a.status} />
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </div>
        </>
      ) : (
        <section className={`${cardCls} slide-up mt-6 flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center`}
          style={{ animationDelay: ".3s" }}>
          <div>
            <h2 className="text-[20px] font-bold">Charts appear once there are appointments.</h2>
            <p className="mt-1 text-[14px] text-muted">Register a patient, then book their first appointment.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/patients" className={btnCls("secondary")}>Add patient</Link>
            <Link href="/appointments" className={btnCls("primary")}>Book appointment</Link>
          </div>
        </section>
      )}
    </div>
  );
}
