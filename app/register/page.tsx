"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

export default function Register() {
  const router = useRouter();
  const [role, setRole] = useState<"DONOR" | "PATIENT">("PATIENT");
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", bloodGroup: "O+", cityId: "", hospital: "" });
  const [cities, setCities] = useState<any[]>([]);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { fetch("/api/public").then((r) => r.json()).then((j) => setCities(j.cities || [])); }, []);
  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, role, cityId: form.cityId ? Number(form.cityId) : null }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) return setErr(j.error || "Registration failed");
    router.push("/dashboard"); router.refresh();
  }
  const donor = role === "DONOR";
  return (
    <div className="auth-wrap">
      <div className="card">
        <h1 style={{ marginTop: 4 }}>{donor ? "Be someone's heartbeat." : "You are not alone. We will find it together."}</h1>
        <p className="muted">{donor ? "Join as a donor — fifteen minutes of yours can save up to three lives." : "Create a free account. Request blood and follow every request."}</p>
        <div className="role-cards">
          <div className={`role-card ${!donor ? "sel-patient" : ""}`} onClick={() => setRole("PATIENT")}>
            <strong>🤲 Patient / Recipient</strong><br /><span className="muted">I need blood for myself or family</span>
          </div>
          <div className={`role-card ${donor ? "sel-donor" : ""}`} onClick={() => setRole("DONOR")}>
            <strong>🩸 Donor</strong><br /><span className="muted">I want to give blood and save lives</span>
          </div>
        </div>
        {err && <p className="err">{err}</p>}
        <form onSubmit={submit}>
          <div className="grid grid-2" style={{ gap: 12 }}>
            <div><label>Full name</label><input required value={form.name} onChange={set("name")} /></div>
            <div><label>Phone</label><input value={form.phone} onChange={set("phone")} placeholder="03xx-xxxxxxx" /></div>
            <div><label>Email</label><input type="email" required value={form.email} onChange={set("email")} /></div>
            <div><label>Password</label><input type="password" required value={form.password} onChange={set("password")} /></div>
            <div><label>{donor ? "Your blood group" : "Patient's blood group"}</label>
              <select value={form.bloodGroup} onChange={set("bloodGroup")}>{GROUPS.map((g) => <option key={g}>{g}</option>)}</select></div>
            <div><label>Your city</label>
              <select value={form.cityId} onChange={set("cityId")}><option value="">Select your city…</option>{cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          </div>
          {!donor && (<><label>Hospital (where the patient is admitted)</label><input value={form.hospital} onChange={set("hospital")} placeholder="e.g. Civil Hospital Karachi" /></>)}
          {donor && <p className="muted" style={{ marginTop: 10 }}>Donor checklist: 18+ years · 50kg+ · feeling healthy today.</p>}
          <p style={{ marginTop: 16 }}>
            <button className={`btn ${donor ? "btn-primary" : "btn-teal"}`} disabled={busy}>{busy ? "Creating…" : donor ? "Join as a Donor" : "Create my account — find blood"}</button>
          </p>
        </form>
        <p className="muted">Already have an account? <Link href="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
