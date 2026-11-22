"use client";
import { useEffect, useState } from "react";
import { get, post } from "../../lib/api";
import Toast from "../../components/Toast";
import Logo from "../../components/Logo";
import {
  Icon, PageHeader, Avatar, StatusBadge,
  cardCls, inputCls, btnPrimary,
} from "../../components/ui";

const empty = { patientId: "", date: "", time: "", doctor: "" };
const filters = ["All", "Scheduled", "Completed", "Cancelled"];

// DD-MM-YYYY + HH:MM  ->  YYYYMMDDHHMM (string compare = chronological)
const sortKey = (a) => a.date.split("-").reverse().join("") + a.time.replace(":", "");
// <input type="date"> gives YYYY-MM-DD, the C++ side wants DD-MM-YYYY
const toDMY = (d) => (d ? d.split("-").reverse().join("-") : "");

export default function Appointments() {
  const [list, setList] = useState([]);
  const [patients, setPatients] = useState([]);
  const [filter, setFilter] = useState("All");
  const [order, setOrder] = useState("arrival");
  const [form, setForm] = useState(empty);
  const [toast, setToast] = useState(null);

  const load = async () => {
    setList(await get("/api/appointments"));
    setPatients(await get("/api/patients"));
  };
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const patientOf = (id) => patients.find((p) => p.id === id);

  const book = async (e) => {
    e.preventDefault();
    const r = await post("/api/appointments", { ...form, date: toDMY(form.date) });
    setToast({ ok: r.ok, text: r.message });
    if (r.ok) { setForm(empty); load(); }
  };

  const processNext = async () => {
    const r = await post("/api/appointments/process");
    setToast({ ok: r.ok, text: r.message });
    load();
  };

  const cancel = async (id) => {
    const r = await post("/api/appointments/cancel", { id });
    setToast({ ok: r.ok, text: r.message });
    load();
  };

  const next = list.find((a) => a.status === "Scheduled");
  const nextPatient = next ? patientOf(next.patientId) : null;
  const count = (s) => (s === "All" ? list.length : list.filter((a) => a.status === s).length);

  let shown = filter === "All" ? list : list.filter((a) => a.status === filter);
  if (order === "datetime") shown = [...shown].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

  return (
    <div>
      <PageHeader
        eyebrow="Outpatient Department"
        title="Appointments & Queue"
        subtitle="Book appointments and serve them in order of arrival."
      />

      {/* Booking */}
      <form onSubmit={book} className={`${cardCls} mb-6 p-6`}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blush/60 text-brand">
            <Icon name="calendar" size={18} />
          </div>
          <div>
            <div className="font-display text-base font-semibold">Book new appointment</div>
            <div className="text-xs text-muted">Added to the rear of the queue.</div>
          </div>
        </div>
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-5">
          <label className="block text-xs font-semibold text-muted lg:col-span-2">
            <span className="mb-1.5 block">Patient</span>
            <select className={inputCls} value={form.patientId} onChange={set("patientId")} required>
              <option value="">{patients.length ? "Select a patient…" : "No patients registered"}</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>#{p.id} · {p.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-muted">
            <span className="mb-1.5 block">Date</span>
            <input type="date" className={inputCls} value={form.date} onChange={set("date")} required />
          </label>
          <label className="block text-xs font-semibold text-muted">
            <span className="mb-1.5 block">Time</span>
            <input type="time" className={inputCls} value={form.time} onChange={set("time")} required />
          </label>
          <label className="block text-xs font-semibold text-muted">
            <span className="mb-1.5 block">Doctor</span>
            <input className={inputCls} placeholder="e.g. Ahmed" value={form.doctor} onChange={set("doctor")} required />
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="submit" className={btnPrimary}>
            <Icon name="plus" size={16} />
            Book appointment
          </button>
        </div>
      </form>

      {/* Queue banner */}
      <div className="relative mb-6 flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-line bg-gradient-to-r from-blush/60 via-white to-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white shadow-md">
            <Icon name="clock" size={24} />
          </div>
          <div>
            <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
              Live queue
            </span>
            <div className="mt-1 text-sm">
              {next ? (
                <>
                  <span className="font-bold">Next in queue: </span>
                  <span className="font-bold text-brand-dark">
                    #{next.id} · {nextPatient ? nextPatient.name : `Patient ${next.patientId}`}
                  </span>
                  <span className="text-muted"> · Dr. {next.doctor}, {next.date} {next.time}</span>
                </>
              ) : (
                <span className="text-muted">The queue is empty. Nothing is waiting.</span>
              )}
            </div>
          </div>
        </div>
        <button onClick={processNext} disabled={!next} className={btnPrimary}>
          Process next in queue
          <Icon name="arrow" size={16} />
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                filter === f
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white text-ink hover:border-brand"
              }`}
            >
              {f}
              <span
                className={`rounded-full px-1.5 text-[11px] font-bold ${
                  filter === f ? "bg-white/25" : "bg-mist text-muted"
                }`}
              >
                {count(f)}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-mist p-1">
          <span className="px-2 text-xs font-semibold text-muted">View</span>
          {[["arrival", "Arrival order"], ["datetime", "Date & time"]].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setOrder(k)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                order === k ? "bg-white text-brand shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={`${cardCls} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead className="bg-mist text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              {["Appt #", "Patient", "Doctor", "Date", "Time", "Status", ""].map((h, i) => (
                <th key={i} className="px-5 py-3.5 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.map((a) => {
              const p = patientOf(a.patientId);
              const isNext = next && a.id === next.id;
              return (
                <tr
                  key={a.id}
                  className={`transition hover:bg-blush/20 ${isNext ? "bg-blush/20" : ""} ${
                    a.status === "Cancelled" ? "opacity-70" : ""
                  }`}
                >
                  <td className="px-5 py-4">
                    <span className={`font-semibold ${a.status === "Cancelled" ? "line-through" : ""}`}>
                      #{a.id}
                    </span>
                    {isNext && (
                      <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">
                        NEXT
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={p ? p.name : "?"} size={32} />
                      <div className="leading-tight">
                        <div className="font-semibold">{p ? p.name : "Deleted patient"}</div>
                        <div className="text-xs text-muted">ID {a.patientId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">Dr. {a.doctor}</td>
                  <td className="px-5 py-4">{a.date}</td>
                  <td className="px-5 py-4">{a.time}</td>
                  <td className="px-5 py-4"><StatusBadge status={a.status} /></td>
                  <td className="px-5 py-4 text-right">
                    {a.status === "Scheduled" && (
                      <div className="inline-flex items-center gap-1">
                        {isNext && (
                          <button
                            onClick={processNext}
                            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
                          >
                            Process now
                          </button>
                        )}
                        <button
                          onClick={() => cancel(a.id)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted transition hover:bg-blush/50 hover:text-brand"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {shown.length === 0 && (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Logo size={56} color="#FFB3B1" />
            <div className="mt-3 font-display text-lg font-semibold">No appointments here</div>
            <div className="mt-1 max-w-sm text-sm text-muted">
              {list.length === 0
                ? "Book the first appointment using the form above."
                : `There are no ${filter.toLowerCase()} appointments.`}
            </div>
          </div>
        )}

        <div className="border-t border-line bg-mist/60 px-5 py-3 text-xs text-muted">
          Showing <b className="text-ink">{shown.length}</b> of <b className="text-ink">{list.length}</b> appointments
        </div>
      </div>

      <Toast msg={toast} onDone={() => setToast(null)} />
    </div>
  );
}