"use client";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "../../components/Providers";
import { post } from "../../lib/api";
import {
  PageHeader, Button, Field, Modal, Drawer, Icon, LoadingBlock, EmptyState,
  StatusBadge, PriorityBadge, inputCls, cardCls,
} from "../../components/ui";

const empty = { id: "", name: "", age: "", gender: "M", contact: "", disease: "" };
const genderName = { M: "Male", F: "Female", O: "Other" };
const PAGE = 8;

function validate(f, patients, editing) {
  const e = {};
  if (!/^\d+$/.test(String(f.id)) || Number(f.id) <= 0) e.id = "Positive whole number.";
  else if (!editing && patients.some((p) => String(p.id) === String(f.id))) e.id = "This ID already exists.";
  if (!String(f.name).trim()) e.name = "Required.";
  if (!/^\d+$/.test(String(f.age)) || Number(f.age) < 0 || Number(f.age) > 120) e.age = "0 to 120.";
  if (!["M", "F", "O"].includes(f.gender)) e.gender = "M, F or O.";
  if (!/^\d{10,15}$/.test(String(f.contact))) e.contact = "10 to 15 digits.";
  if (!String(f.disease).trim()) e.disease = "Required.";
  return e;
}

export default function Patients() {
  const { patients, appts, loading, online, reload, toast } = useApp();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState({ key: "id", dir: 1 });
  const [page, setPage] = useState(0);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(false);
  const [errs, setErrs] = useState({});
  const [drawer, setDrawer] = useState(null); // patient id
  const [delTarget, setDelTarget] = useState(null);

  const firstLoad = loading && online == null;

  const shown = useMemo(() => {
    const k = q.trim().toLowerCase();
    const filtered = patients.filter(
      (p) => String(p.id).includes(k) || p.name.toLowerCase().includes(k)
    );
    const dir = sort.dir;
    return [...filtered].sort((a, b) => {
      if (sort.key === "name") return dir * a.name.localeCompare(b.name);
      if (sort.key === "age") return dir * (a.age - b.age);
      return dir * (a.id - b.id);
    });
  }, [patients, q, sort]);

  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  useEffect(() => { if (page >= pages) setPage(0); }, [pages, page]);
  const rows = shown.slice(page * PAGE, page * PAGE + PAGE);

  const drawerPatient = patients.find((p) => p.id === drawer) || null;
  const drawerAppts = drawer ? appts.filter((a) => a.patientId === drawer) : [];

  const setField = (k) => (e) => {
    let v = e.target.value;
    if (k === "id" || k === "contact") v = v.replace(/\D/g, ""); // digits only
    setForm({ ...form, [k]: v });
  };
  const openNew = () => { setEditing(false); setErrs({}); setForm(empty); };
  const openEdit = (p) => { setEditing(true); setErrs({}); setForm({ ...p }); };

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(form, patients, editing);
    setErrs(found);
    if (Object.keys(found).length) return;
    const r = await post(editing ? "/api/patients/update" : "/api/patients", form);
    toast(r.ok, r.message);
    if (r.ok) { setForm(null); reload(); }
    else setErrs({ id: r.message });
  };

  const confirmDelete = async () => {
    const r = await post("/api/patients/delete", { id: delTarget.id });
    toast(r.ok, r.message);
    setDelTarget(null);
    if (r.ok) { setDrawer(null); reload(); }
  };

  const sortBtn = (key, label) => {
    const on = sort.key === key;
    return (
      <button onClick={() => setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 }))}
        aria-label={`Sort by ${label}`} data-cur
        className={`group -mx-1 inline-flex items-center gap-1.5 rounded-[2px] px-1 py-0.5 uppercase transition-colors hover:text-brand ${on ? "text-brand" : ""}`}>
        {label}
        <span className="inline-flex flex-col leading-[0]">
          <svg width="8" height="5" viewBox="0 0 8 5" aria-hidden="true"
            className={on && sort.dir > 0 ? "text-brand" : "text-muted/35 group-hover:text-muted/70"}>
            <path d="M4 0l4 5H0z" fill="currentColor" /></svg>
          <svg width="8" height="5" viewBox="0 0 8 5" aria-hidden="true" className="mt-[2px]"
            fill="none"><path d="M4 5L0 0h8z" fill={on && sort.dir < 0 ? "var(--color-brand)" : "color-mix(in srgb, var(--color-muted) 35%, transparent)"} /></svg>
        </span>
      </button>
    );
  };

  return (
    <div className="page-in">
      <PageHeader eyebrow="Clinical administration" title="Patients"
        caption="Register, search and manage patient records.">
        <Button onClick={openNew}><Icon name="plus" size={16} /> Add patient</Button>
      </PageHeader>

      {/* toolbar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <span className="pointer-events-none absolute left-3 top-2.5 text-muted"><Icon name="search" size={16} /></span>
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search by ID or name…" className={`${inputCls} pl-9`} />
        </div>
        <span className="ml-auto font-mono tnum text-[13px] text-muted">
          {shown.length} of {patients.length}
        </span>
      </div>

      {/* table */}
      <div className={`${cardCls} overflow-hidden`}>
        {firstLoad ? (
          <LoadingBlock />
        ) : rows.length === 0 ? (
          <EmptyState
            title={patients.length === 0 ? "No patients yet" : "No matches"}
            caption={patients.length === 0 ? "Add the first record to get started." : "Check the ID or name."}
            action={patients.length === 0 ? <Button onClick={openNew}><Icon name="plus" size={16} /> Add patient</Button> : null}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-line text-[13px] font-medium uppercase tracking-[0.04em] text-muted">
                  <th className="px-5 py-3 text-left font-medium">{sortBtn("id", "ID")}</th>
                  <th className="px-5 py-3 text-left font-medium">{sortBtn("name", "Name")}</th>
                  <th className="px-5 py-3 text-left font-medium">{sortBtn("age", "Age")}</th>
                  <th className="px-5 py-3 text-left font-medium">Sex</th>
                  <th className="px-5 py-3 text-left font-medium">Contact</th>
                  <th className="px-5 py-3 text-left font-medium">Diagnosis</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} onClick={() => setDrawer(p.id)} data-cur
                    className="row-hov cursor-pointer border-b border-line last:border-0">
                    <td className="px-5 py-3 font-mono tnum text-muted">{p.id}</td>
                    <td className="px-5 py-3 font-medium">{p.name}</td>
                    <td className="px-5 py-3 font-mono tnum">{p.age}</td>
                    <td className="px-5 py-3 text-muted">{genderName[p.gender] || p.gender}</td>
                    <td className="px-5 py-3 font-mono tnum text-muted">{p.contact}</td>
                    <td className="px-5 py-3">{p.disease}</td>
                    <td className="px-5 py-3 text-right text-muted">
                      <Icon name="arrow" size={15} className="inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-[13px] text-muted">
            <span className="font-mono tnum">Page {page + 1} / {pages}</span>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
              <Button variant="secondary" onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* add / edit modal */}
      {form && (
        <Modal title={editing ? "Edit patient" : "Add patient"} onClose={() => setForm(null)}>
          <form onSubmit={submit}>
            <div className="space-y-4 px-6 py-5">
              <Field label="Patient ID" hint={editing ? "Fixed" : "Unique"} required error={errs.id}>
                <input className={inputCls} value={form.id} onChange={setField("id")} disabled={editing} inputMode="numeric" maxLength={9} />
              </Field>
              <Field label="Full name" required error={errs.name}>
                <input className={inputCls} value={form.name} onChange={setField("name")} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Age" hint="0–120" required error={errs.age}>
                  <input className={inputCls} value={form.age} onChange={setField("age")} inputMode="numeric" />
                </Field>
                <Field label="Gender" required error={errs.gender}>
                  <select className={inputCls} value={form.gender} onChange={setField("gender")}>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </Field>
              </div>
              <Field label="Contact" hint="10–15 digits" required error={errs.contact}>
                <input className={inputCls} value={form.contact} onChange={setField("contact")} inputMode="numeric" />
              </Field>
              <Field label="Diagnosis" required error={errs.disease}>
                <input className={inputCls} value={form.disease} onChange={setField("disease")} />
              </Field>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-line px-6 py-4">
              <span className="text-[12px] text-muted"><span className="text-brand">*</span> All fields required</span>
              <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
              <Button type="submit">{editing ? "Save changes" : "Register patient"}</Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* detail drawer */}
      {drawerPatient && (
        <Drawer title="Patient record" onClose={() => setDrawer(null)}>
          <div className="px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-heading text-[24px] font-bold leading-tight">{drawerPatient.name}</div>
                <div className="mt-0.5 font-mono tnum text-[13px] text-muted">
                  ID {drawerPatient.id} · {drawerPatient.age} / {genderName[drawerPatient.gender]}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(drawerPatient)} aria-label="Edit" className="rounded-[4px] p-2 text-muted transition-colors hover:bg-blush hover:text-brand"><Icon name="edit" /></button>
                <button onClick={() => setDelTarget(drawerPatient)} aria-label="Delete" className="rounded-[4px] p-2 text-muted transition-colors hover:bg-blush hover:text-brand"><Icon name="trash" /></button>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-4 text-[14px]">
              <div><dt className="text-[13px] text-muted">Contact</dt><dd className="font-mono tnum">{drawerPatient.contact}</dd></div>
              <div><dt className="text-[13px] text-muted">Diagnosis</dt><dd>{drawerPatient.disease}</dd></div>
            </dl>
          </div>

          <div className="border-t border-line px-6 py-5">
            <div className="mb-3 text-[13px] font-medium uppercase tracking-[0.06em] text-muted">
              Appointments ({drawerAppts.length})
            </div>
            {drawerAppts.length === 0 ? (
              <div className="text-[14px] text-muted">No appointments for this patient.</div>
            ) : (
              <ul className="space-y-2">
                {drawerAppts.map((a) => (
                  <li key={a.id} className="hov-red flex items-center justify-between rounded-[4px] border border-line px-3 py-2 text-[14px] hover:border-brand">
                    <div>
                      <div className="font-mono tnum text-[13px]">#{a.id} · {a.date} {a.time}</div>
                      <div className="text-[13px] text-muted">Dr. {a.doctor}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={a.priority || "Normal"} />
                      <StatusBadge status={a.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Drawer>
      )}

      {/* delete confirm */}
      {delTarget && (
        <Modal title="Delete patient?" onClose={() => setDelTarget(null)}>
          <div className="px-6 py-5 text-[14px] text-muted">
            <span className="font-medium text-ink">{delTarget.name}</span> (ID {delTarget.id}) will be removed.
            Their scheduled appointments will be cancelled.
          </div>
          <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
            <Button variant="secondary" data-autofocus onClick={() => setDelTarget(null)}>Cancel</Button>
            <Button onClick={confirmDelete}>Delete</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
