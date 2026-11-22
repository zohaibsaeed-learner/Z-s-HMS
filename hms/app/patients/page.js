"use client";
import { useEffect, useState } from "react";
import { get, post } from "../../lib/api";
import Toast from "../../components/Toast";
import Logo from "../../components/Logo";
import {
  Icon, PageHeader, Avatar, Modal,
  cardCls, inputCls, btnPrimary, btnGhost,
} from "../../components/ui";

const empty = { id: "", name: "", age: "", gender: "M", contact: "", disease: "" };
const genderName = { M: "Male", F: "Female", O: "Other" };

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-xs font-semibold text-muted">
        <span>{label}</span>
        {hint && <span className="font-normal">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export default function Patients() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState(null);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState("");
  const [delTarget, setDelTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const load = async () => setList(await get("/api/patients"));
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const openNew = () => { setEditing(false); setFormError(""); setForm(empty); };
  const openEdit = (p) => { setEditing(true); setFormError(""); setForm({ ...p }); };

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    const r = await post(editing ? "/api/patients/update" : "/api/patients", form);
    if (r.ok) {
      setToast({ ok: true, text: r.message });
      setForm(null);
      load();
    } else {
      setFormError(r.message);
    }
  };

  const confirmDelete = async () => {
    const r = await post("/api/patients/delete", { id: delTarget.id });
    setToast({ ok: r.ok, text: r.message });
    setDelTarget(null);
    load();
  };

  const sort = async (by) => {
    const r = await post("/api/patients/sort", { by });
    if (r.ok) setSortBy(by);
    setToast({ ok: r.ok, text: r.message });
    load();
  };

  const key = q.trim().toLowerCase();
  const shown = list.filter((p) => String(p.id).includes(key) || p.name.toLowerCase().includes(key));

  return (
    <div>
      <PageHeader
        eyebrow="Clinical Administration"
        title="Patient Directory"
        subtitle="Register, update, search and sort patient records."
      >
        <button onClick={openNew} className={btnPrimary}>
          <Icon name="userPlus" size={18} />
          Register patient
        </button>
      </PageHeader>

      {/* Toolbar */}
      <div className={`${cardCls} mb-4 flex flex-wrap items-center justify-between gap-3 p-3`}>
        <div className="relative w-full max-w-sm">
          <Icon name="search" size={16} className="absolute left-3 top-3 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by patient ID or name…"
            className={`${inputCls} pl-9`}
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-mist p-1">
          <span className="px-2 text-xs font-semibold text-muted">Sort by</span>
          {["id", "name", "age"].map((b) => (
            <button
              key={b}
              onClick={() => sort(b)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition ${
                sortBy === b ? "bg-white text-brand shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {b === "id" ? "ID" : b}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={`${cardCls} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead className="bg-mist text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              {["Patient ID", "Patient", "Age / Sex", "Contact", "Diagnosis", ""].map((h, i) => (
                <th key={i} className="px-5 py-3.5 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.map((p) => (
              <tr key={p.id} className="transition hover:bg-blush/20">
                <td className="px-5 py-4 font-semibold text-brand-dark">#{p.id}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} />
                    <span className="font-semibold">{p.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  {p.age} <span className="text-muted">/ {genderName[p.gender] || p.gender}</span>
                </td>
                <td className="px-5 py-4 text-muted">{p.contact}</td>
                <td className="px-5 py-4">
                  <span className="rounded-md bg-mist px-2.5 py-1 text-xs font-medium">{p.disease}</span>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="inline-flex gap-1">
                    <button
                      onClick={() => openEdit(p)}
                      title="Edit"
                      className="rounded-lg p-2 text-muted transition hover:bg-mist hover:text-ink"
                    >
                      <Icon name="edit" />
                    </button>
                    <button
                      onClick={() => setDelTarget(p)}
                      title="Delete"
                      className="rounded-lg p-2 text-muted transition hover:bg-blush/50 hover:text-brand"
                    >
                      <Icon name="trash" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {shown.length === 0 && (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Logo size={56} color="#FFB3B1" />
            <div className="mt-3 font-display text-lg font-semibold">
              {list.length === 0 ? "No patients registered yet" : "No matching patients"}
            </div>
            <div className="mt-1 max-w-sm text-sm text-muted">
              {list.length === 0
                ? "Use the Register patient button to add the first record."
                : "Check the ID or name and try again."}
            </div>
          </div>
        )}

        <div className="border-t border-line bg-mist/60 px-5 py-3 text-xs text-muted">
          Showing <b className="text-ink">{shown.length}</b> of <b className="text-ink">{list.length}</b> registered patients
        </div>
      </div>

      {/* Register / edit modal */}
      {form && (
        <Modal onClose={() => setForm(null)}>
          <form onSubmit={submit}>
            <div className="flex items-start justify-between border-b border-line px-6 py-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-brand">
                  {editing ? "Edit record" : "New admission"}
                </div>
                <h2 className="font-display text-xl font-bold">
                  {editing ? "Update patient" : "Register patient"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setForm(null)}
                className="rounded-lg p-1.5 text-muted hover:bg-mist"
              >
                <Icon name="x" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              {formError && (
                <div className="flex items-start gap-2 rounded-lg border border-brand/30 bg-blush/40 px-3 py-2.5 text-sm text-brand-dark">
                  <Icon name="alert" size={16} className="mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
              <Field label="Patient ID" hint={editing ? "Cannot be changed" : "Must be unique"}>
                <input className={inputCls} value={form.id} onChange={set("id")} disabled={editing} required />
              </Field>
              <Field label="Full name">
                <input className={inputCls} value={form.name} onChange={set("name")} required />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Age" hint="0 to 120">
                  <input className={inputCls} inputMode="numeric" value={form.age} onChange={set("age")} required />
                </Field>
                <Field label="Gender">
                  <select className={inputCls} value={form.gender} onChange={set("gender")}>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </Field>
              </div>
              <Field label="Contact number" hint="10 to 15 digits">
                <input className={inputCls} inputMode="numeric" value={form.contact} onChange={set("contact")} required />
              </Field>
              <Field label="Disease / diagnosis">
                <input className={inputCls} value={form.disease} onChange={set("disease")} required />
              </Field>
            </div>

            <div className="flex justify-end gap-2 border-t border-line bg-mist/60 px-6 py-4">
              <button type="button" onClick={() => setForm(null)} className={btnGhost}>Cancel</button>
              <button type="submit" className={btnPrimary}>
                <Icon name="check" size={16} />
                Save patient record
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirmation */}
      {delTarget && (
        <Modal onClose={() => setDelTarget(null)}>
          <div className="px-6 py-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blush/60 text-brand">
              <Icon name="trash" size={20} />
            </div>
            <h2 className="mt-4 font-display text-xl font-bold">Delete this patient?</h2>
            <p className="mt-2 text-sm text-muted">
              <b className="text-ink">{delTarget.name}</b> (ID {delTarget.id}) will be removed from the
              system. Any scheduled appointments of this patient will be cancelled.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setDelTarget(null)} className={btnGhost}>Cancel</button>
              <button onClick={confirmDelete} className={btnPrimary}>Delete patient</button>
            </div>
          </div>
        </Modal>
      )}

      <Toast msg={toast} onDone={() => setToast(null)} />
    </div>
  );
}