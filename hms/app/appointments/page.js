"use client";
import { useState } from "react";
import { useApp } from "../../components/Providers";
import { post } from "../../lib/api";
import {
  PageHeader, Button, Field, Icon, LoadingBlock, EmptyState,
  StatusBadge, PriorityBadge, priorityRank, inputCls, cardCls,
} from "../../components/ui";

const empty = { patientId: "", date: "", time: "", doctor: "", priority: "Normal" };
const toDMY = (d) => (d ? d.split("-").reverse().join("-") : ""); // YYYY-MM-DD -> DD-MM-YYYY
const filters = ["All", "Scheduled", "Completed", "Cancelled"];
const prioOptions = ["Normal", "Urgent", "Critical"];

export default function Appointments() {
  const { patients, appts, loading, online, reload, toast } = useApp();
  const [form, setForm] = useState(empty);
  const [filter, setFilter] = useState("All");
  const [leaving, setLeaving] = useState(null);

  const firstLoad = loading && online == null;
  const prio = (a) => a.priority || "Normal";
  const patientOf = (id) => patients.find((p) => p.id === id);
  const setField = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const scheduled = appts.filter((a) => a.status === "Scheduled");
  const lane = [...scheduled].sort(
    (a, b) => priorityRank[prio(b)] - priorityRank[prio(a)] || a.id - b.id
  );
  const front = lane[0];

  const count = (s) => (s === "All" ? appts.length : appts.filter((a) => a.status === s).length);
  const rows = filter === "All" ? appts : appts.filter((a) => a.status === filter);

  const book = async (e) => {
    e.preventDefault();
    const r = await post("/api/appointments", { ...form, date: toDMY(form.date) });
    toast(r.ok, r.message);
    if (r.ok) { setForm(empty); reload(); }
  };

  const processNext = async () => {
    if (!front) return;
    setLeaving(front.id);
    setTimeout(async () => {
      const r = await post("/api/appointments/process");
      toast(r.ok, r.message);
      setLeaving(null);
      reload();
    }, 260);
  };

  const cancel = async (id) => {
    const r = await post("/api/appointments/cancel", { id });
    toast(r.ok, r.message);
    reload();
  };

  return (
    <div className="page-in">
      <PageHeader eyebrow="Outpatient department" title="Appointments"
        caption="Book appointments and serve the queue in priority order." />

      {/* booking form */}
      <form onSubmit={book} className={`${cardCls} mb-6 p-6`}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Field label="Patient" required>
              <select className={inputCls} value={form.patientId} onChange={setField("patientId")} required>
                <option value="">{patients.length ? "Select a patient…" : "No patients registered"}</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>#{p.id} · {p.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Date" required><input type="date" className={inputCls} value={form.date} onChange={setField("date")} required /></Field>
          <Field label="Time" required><input type="time" className={inputCls} value={form.time} onChange={setField("time")} required /></Field>
          <div className="lg:col-span-2">
            <Field label="Doctor" required><input className={inputCls} placeholder="e.g. Ahmed" value={form.doctor} onChange={setField("doctor")} required /></Field>
          </div>
          <div className="lg:col-span-2">
            <Field label="Priority" required>
              <div className="flex gap-1 rounded-[4px] border border-line p-1">
                {prioOptions.map((p) => (
                  <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })}
                    className={`flex-1 rounded-[2px] px-3 py-1.5 text-[13px] font-medium transition ${
                      form.priority === p ? "bg-brand text-white" : "text-muted hover:bg-blush/60 hover:text-brand"
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit"><Icon name="plus" size={16} /> Book appointment</Button>
        </div>
      </form>

      {/* priority lane */}
      <div className={`${cardCls} mb-6 p-6`}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[19px] font-bold">Emergency queue</h2>
            <p className="text-[13px] text-muted">Critical → Urgent → Normal, then arrival order.</p>
          </div>
          <Button onClick={processNext} disabled={!front}>Process next <Icon name="arrow" size={16} /></Button>
        </div>

        {firstLoad ? (
          <LoadingBlock />
        ) : lane.length === 0 ? (
          <div className="py-6 text-[14px] text-muted">The queue is empty — nothing waiting.</div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 pt-3">
            {lane.map((a, i) => {
              const p = patientOf(a.patientId);
              const isFront = i === 0;
              const isLeaving = leaving === a.id;
              return (
                <div key={a.id}
                  data-cur className={`group lift relative min-w-[200px] rounded-[4px] border bg-surface p-4 transition-all duration-[260ms] ${
                    isFront ? "border-brand" : "border-line"
                  }`}
                  style={isLeaving ? { opacity: 0, transform: "translateY(-18px)" } : undefined}>
                  {isFront && (
                    <span className="absolute -top-2 left-3 rounded-[4px] bg-brand px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Next</span>
                  )}
                  <div className="text-[15px] font-medium transition-colors group-hover:text-brand">{p ? p.name : `Patient ${a.patientId}`}</div>
                  <div className="mt-0.5 font-mono tnum text-[12px] text-muted">#{a.id} · {a.date} {a.time}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <PriorityBadge priority={prio(a)} />
                    <span className="text-[12px] text-muted">Dr. {a.doctor}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`inline-flex items-center gap-2 rounded-[4px] border px-3 py-1.5 text-[13px] font-medium transition ${
              filter === f ? "border-brand bg-blush text-brand" : "border-line text-muted hover:border-brand hover:text-brand"
            }`}>
            {f}<span className="font-mono tnum">{count(f)}</span>
          </button>
        ))}
      </div>

      {/* table */}
      <div className={`${cardCls} overflow-hidden`}>
        {firstLoad ? (
          <LoadingBlock />
        ) : rows.length === 0 ? (
          <EmptyState title="No appointments here"
            caption={appts.length === 0 ? "Book the first appointment above." : `No ${filter.toLowerCase()} appointments.`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-line text-[13px] font-medium uppercase tracking-[0.04em] text-muted">
                  <th className="px-5 py-3 text-left font-medium">Appt</th>
                  <th className="px-5 py-3 text-left font-medium">Patient</th>
                  <th className="px-5 py-3 text-left font-medium">Doctor</th>
                  <th className="px-5 py-3 text-left font-medium">Date</th>
                  <th className="px-5 py-3 text-left font-medium">Time</th>
                  <th className="px-5 py-3 text-left font-medium">Priority</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const p = patientOf(a.patientId);
                  return (
                    <tr key={a.id} className="row-hov border-b border-line last:border-0">
                      <td className="px-5 py-3 font-mono tnum text-muted">#{a.id}</td>
                      <td className="px-5 py-3 font-medium">{p ? p.name : <span className="text-muted">Deleted patient</span>}</td>
                      <td className="px-5 py-3">Dr. {a.doctor}</td>
                      <td className="px-5 py-3 font-mono tnum">{a.date}</td>
                      <td className="px-5 py-3 font-mono tnum">{a.time}</td>
                      <td className="px-5 py-3"><PriorityBadge priority={prio(a)} /></td>
                      <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-5 py-3 text-right">
                        {a.status === "Scheduled" && (
                          <button onClick={() => cancel(a.id)} className="rounded-[4px] px-2 py-1 text-[13px] font-medium text-muted hover:bg-blush hover:text-brand">Cancel</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
