"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Drop, { MiniDrop } from "@/components/Drop";
import { EcgProgress } from "@/components/Ecg";
import Celebration from "@/components/Celebration";

const GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

export default function Register() {
  const router = useRouter();
  const [role, setRole] = useState<"DONOR" | "PATIENT">("PATIENT");
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", bloodGroup: "O+", cityId: "", hospital: "" });
  const [cities, setCities] = useState<any[]>([]);
  const [pub, setPub] = useState<any>(null);
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => { fetch("/api/public").then((r) => r.json()).then((j) => { setCities(j.cities || []); setPub(j); }).catch(() => {}); }, []);
  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  const totalFree = pub?.results?.reduce((s: number, c: any) => s + c.banks.reduce((x: number, b: any) => x + b.totalFree, 0), 0);
  const branchCount = pub?.results?.reduce((s: number, c: any) => s + c.banks.length, 0);

  const donor = role === "DONOR";
  // Progress: share of the form's fields that are filled (typed values survive role switches)
  const fields = donor
    ? [form.name, form.phone, form.email, form.password, form.cityId]
    : [form.name, form.phone, form.email, form.password, form.cityId, form.hospital];
  const progress = fields.filter((v) => String(v).trim()).length / fields.length;

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, role, cityId: form.cityId ? Number(form.cityId) : null }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) return setErr(j.error || "Registration failed");
    setCelebrate(true);
  }

  const formCard = (
    <div className="auth-form">
      <h1 style={{ marginTop: 0 }}>{donor ? "Join as a Donor" : "Create my account"}</h1>
      <div className="role-cards" role="radiogroup" aria-label="I am a">
        <div className={`role-card ${!donor ? "sel-patient" : ""}`} onClick={() => setRole("PATIENT")} role="radio" aria-checked={!donor}>
          <strong>🤲 Patient / Recipient</strong><br /><span className="muted">I need blood for myself or family</span>
        </div>
        <div className={`role-card ${donor ? "sel-donor" : ""}`} onClick={() => setRole("DONOR")} role="radio" aria-checked={donor}>
          <strong>🩸 Donor</strong><br /><span className="muted">I want to give blood and save lives</span>
        </div>
      </div>
      {err && <p className="err">{err}</p>}
      <form onSubmit={submit}>
        <div className="grid grid-2" style={{ gap: 12 }}>
          <div><label>Full name</label><input required value={form.name} onChange={set("name")} /></div>
          <div><label>Phone</label><input value={form.phone} onChange={set("phone")} placeholder="03xx-xxxxxxx" /></div>
          <div><label>Email</label><input type="email" required value={form.email} onChange={set("email")} autoComplete="email" /></div>
          <div><label>Password</label>
            <div className="pw-wrap">
              <input type={showPw ? "text" : "password"} required value={form.password} onChange={set("password")} autoComplete="new-password" />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Hide password" : "Show password"}>{showPw ? "Hide" : "Show"}</button>
            </div>
          </div>
          <div><label>{donor ? "Your blood group" : "Patient's blood group"}</label>
            <select value={form.bloodGroup} onChange={set("bloodGroup")}>{GROUPS.map((g) => <option key={g}>{g}</option>)}</select></div>
          <div><label>Your city</label>
            <select value={form.cityId} onChange={set("cityId")}><option value="">Select your city…</option>{cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        </div>
        {!donor && (<><label>Hospital (where the patient is admitted)</label><input value={form.hospital} onChange={set("hospital")} placeholder="e.g. Civil Hospital Karachi" /></>)}
        {donor ? (
          <div className="progress-row"><MiniDrop fill={progress} size={42} /><span>{progress === 1 ? "Your drop is full — you are ready to be someone's heartbeat." : "Watch your drop fill as you join."}</span></div>
        ) : (
          <div className="progress-row"><EcgProgress progress={progress} /><span>{Math.round(progress * 100)}%</span></div>
        )}
        <p style={{ marginTop: 10 }}>
          <button className={`btn ${donor ? "btn-primary" : "btn-teal"}`} disabled={busy}>{busy ? "Creating…" : donor ? "Join as a Donor" : "Create my account — find blood"}</button>
        </p>
      </form>
      <p className="muted">Already have an account? <Link href="/login">Sign in</Link></p>
    </div>
  );

  const donorPanel = (
    <aside className="panel panel-sunrise">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="panel-cover" src="/cover.jpg" alt="A young thalassemia patient smiling with the doctor holding his hand during his transfusion" />
      <Drop fill={Math.max(0.25, progress)} size={86} />
      <h2>Be someone's heartbeat.</h2>
      <p style={{ opacity: .95 }}>Fifteen minutes of yours can become years for someone else.</p>
      <ul className="check-list">
        <li>18+ years old</li>
        <li>50kg or more</li>
        <li>Feeling healthy today</li>
      </ul>
      <div className="mini-stats">
        <span>🩸 {totalFree ?? "–"} free units on shelves</span>
        <span>🏥 {branchCount ?? "–"} branches waiting for you</span>
        <span>❤️ 1 donation = up to 3 lives</span>
      </div>
    </aside>
  );

  const patientPanel = (
    <aside className="panel panel-teal">
      <h2 style={{ color: "var(--teal-dark)" }}>You are not alone. We will find it together.</h2>
      <p className="muted">Create a free account, then request blood from the branch nearest to you and follow every step.</p>
      <div className="steps-strip">
        <div><strong>1</strong><br />Create account</div>
        <div><strong>2</strong><br />Search nearest free blood</div>
        <div><strong>3</strong><br />Request &amp; get approved</div>
      </div>
      <div className="mini-stats">
        <span>🩸 {totalFree ?? "–"} free units ready</span>
        <span>🏥 {branchCount ?? "–"} branches</span>
        <span>📍 {cities.length || "–"} cities</span>
      </div>
    </aside>
  );

  return (
    <div className="auth-wrap">
      {donor ? (
        <div className="auth-shell flip">{formCard}{donorPanel}</div>
      ) : (
        <div className="auth-shell">{patientPanel}{formCard}</div>
      )}
      {celebrate && (
        <Celebration name={form.name} role={role} onDone={() => { router.push("/dashboard"); router.refresh(); }} />
      )}
    </div>
  );
}
