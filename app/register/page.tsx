"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Drop from "@/components/Drop";
import Celebration from "@/components/Celebration";

const GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const ECG_D = "M0 22 H70 l8 -6 10 12 8 -24 10 32 8 -14 H160 l8 -6 10 12 8 -24 10 32 8 -14 H300";

/* ---------- small icons ---------- */
function CheckBadge({ tone }: { tone: "teal" | "crimson" }) {
  return (
    <span className={`rc-check ${tone}`}>
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <path d="M2 6.5 4.8 9 10 3" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function HeartHandsIcon({ tone }: { tone: "white" | "crimson" }) {
  const c = tone === "white" ? "#ffffff" : "#a4133c";
  return (
    <svg width="25" height="25" viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M24 21.2c-1.9-3.8-5.4-5.1-8-3.8-2.9 1.4-3.7 5.3-1.8 8.4 1.6 2.7 5 5.3 9.8 8 4.8-2.7 8.2-5.3 9.8-8 1.9-3.1 1.1-7-1.8-8.4-2.6-1.3-6.1 0-8 3.8z"
        fill={tone === "white" ? "#ffffff" : "none"} stroke={c} strokeWidth="2.4" strokeLinejoin="round"
      />
      <path d="M7 31.5c3.2 5.8 9.2 9.3 17 9.3s13.8-3.5 17-9.3" fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function DropIcon({ tone }: { tone: "white" | "teal" }) {
  const c = tone === "white" ? "#ffffff" : "#0f766e";
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M24 5.5C24 5.5 11.5 21.5 11.5 29.5a12.5 12 0 0 0 25 0C36.5 21.5 24 5.5 24 5.5z"
        fill={tone === "white" ? "#ffffff" : "none"} stroke={c} strokeWidth="2.4" strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartCrossBadge() {
  return (
    <svg width="42" height="42" viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M24 41.5S8.5 30.4 8.5 19.3C8.5 13.2 13 9 18.2 9c2.4 0 4.5 1 5.8 2.7C25.3 10 27.4 9 29.8 9 35 9 39.5 13.2 39.5 19.3 39.5 30.4 24 41.5 24 41.5z"
        fill="#e0456a"
      />
      <path d="M21.8 16.5h4.4v5h5v4.4h-5v5h-4.4v-5h-5v-4.4h5z" fill="#ffffff" />
    </svg>
  );
}

function PhoneHeart() {
  return (
    <svg width="36" height="36" viewBox="0 0 48 48" aria-hidden="true">
      <rect x="14" y="5" width="20" height="38" rx="5.5" fill="rgba(255,255,255,.28)" stroke="#ffffff" strokeWidth="2" />
      <path
        d="M24 30.6c-3.4-2.6-5.2-4.4-5.2-6.5 0-1.7 1.3-2.9 2.8-2.9 1 0 1.9.5 2.4 1.3.5-.8 1.4-1.3 2.4-1.3 1.5 0 2.8 1.2 2.8 2.9 0 2.1-1.8 3.9-5.2 6.5z"
        fill="#ff8fab"
      />
      <circle cx="24" cy="37.5" r="1.6" fill="#ffffff" />
    </svg>
  );
}

function MiniDropDeco({ size, style }: { size: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={style} aria-hidden="true">
      <path d="M24 5.5C24 5.5 11.5 21.5 11.5 29.5a12.5 12 0 0 0 25 0C36.5 21.5 24 5.5 24 5.5z" fill="rgba(255,255,255,.5)" />
    </svg>
  );
}

/** ECG line whose teal drawn portion grows with progress (patient register). */
function EcgLine({ progress }: { progress: number }) {
  const w = Math.round(Math.max(0, Math.min(1, progress)) * 300);
  return (
    <svg viewBox="0 0 300 40" width="100%" height="40" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <clipPath id="reg-ecg-clip"><rect x="0" y="0" width={w} height="40" /></clipPath>
      </defs>
      <path d={ECG_D} fill="none" stroke="#dcebe4" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      <g clipPath="url(#reg-ecg-clip)">
        <path d={ECG_D} fill="none" stroke="#0f766e" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function QuoteBlock() {
  return (
    <section className="hp-foot">
      <Drop fill={1} size={34} />
      <svg className="hp-foot-hairline" viewBox="0 0 560 26" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 13 H238 L250 13 L257 5 L266 21 L273 13 H560" fill="none" stroke="#E7D5C8" strokeWidth="1.5" />
        <path d="M250 13 L257 5 L266 21 L273 13" fill="none" stroke="#C01430" strokeWidth="1.5" />
      </svg>
      <p className="hp-foot-quote">“The blood you donate gives someone another chance at life. One day that someone may be a close relative, a friend, a loved one — or even you.”</p>
      <p className="hp-foot-small">Blood Bank Platform · Sindh, Pakistan · In an emergency, always call the hospital and the branch directly.</p>
      <p className="hp-foot-tag">Give blood. Give time back.</p>
    </section>
  );
}

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

  const totalFree = pub?.stats?.totalFree ?? pub?.results?.reduce((s: number, c: any) => s + c.banks.reduce((x: number, b: any) => x + b.totalFree, 0), 0);
  const branchCount = pub?.results?.reduce((s: number, c: any) => s + c.banks.length, 0);
  const pendingRequests = pub?.stats?.pendingRequests;
  const totalDonations = pub?.stats?.totalDonations;
  const donorCount = pub?.stats?.donorCount;

  const donor = role === "DONOR";
  // Counted details (both roles): full name, phone, email, password, city.
  const counted = [form.name, form.phone, form.email, form.password, form.cityId];
  const filledCount = counted.filter((v) => String(v).trim()).length;
  const progress = filledCount / counted.length;
  const pct = Math.round(progress * 100);
  const remaining = counted.length - filledCount;

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, role, cityId: form.cityId ? Number(form.cityId) : null }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) return setErr(j.error || "Registration failed");
    setCelebrate(true);
  }

  const formCard = (
    <div className="auth-form">
      <div className="auth-toggle" role="tablist" aria-label="Sign in or create account">
        <Link href="/login" className="at-opt">Sign in</Link>
        <span className={`at-opt sel ${donor ? "sel-donor" : "sel-teal"}`} aria-current="page">Create account</span>
      </div>
      <p className="auth-intro">
        {donor
          ? "Create a free donor account — book donation visits, and give someone in Sindh years of life back."
          : "Create a free account — request the blood group you need and follow every request, step by step."}
      </p>
      <p className="join-label">I am joining as a…</p>
      <div className="role-cards" role="radiogroup" aria-label="I am joining as">
        <div className={`role-card v2 ${!donor ? "sel-patient2" : ""}`} onClick={() => setRole("PATIENT")} role="radio" aria-checked={!donor}>
          {!donor && <CheckBadge tone="teal" />}
          <span className={`rc-icon ${!donor ? "fill-teal" : "pale"}`}>
            <HeartHandsIcon tone={!donor ? "white" : "crimson"} />
          </span>
          <strong>Patient / Recipient</strong>
          <span className="rc-sub">I need blood for myself or family</span>
        </div>
        <div className={`role-card v2 ${donor ? "sel-donor2" : ""}`} onClick={() => setRole("DONOR")} role="radio" aria-checked={donor}>
          {donor && <CheckBadge tone="crimson" />}
          <span className={`rc-icon ${donor ? "fill-crimson" : "pale"}`}>
            <DropIcon tone={donor ? "white" : "teal"} />
          </span>
          <strong>Donor</strong>
          <span className="rc-sub">I want to give blood and save lives</span>
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
              <button type="button" className={`pw-toggle-txt ${donor ? "crimson" : "teal"}`} onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Hide password" : "Show password"}>{showPw ? "Hide" : "Show"}</button>
            </div>
          </div>
          <div><label>{donor ? "Your blood group" : "Patient's blood group"}</label>
            <select value={form.bloodGroup} onChange={set("bloodGroup")}>{GROUPS.map((g) => <option key={g}>{g}</option>)}</select></div>
          <div><label>Your city</label>
            <select value={form.cityId} onChange={set("cityId")}><option value="">Select your city...</option>{cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        </div>
        {!donor && (<><label>Hospital (where the patient is admitted)</label><input value={form.hospital} onChange={set("hospital")} placeholder="e.g. Civil Hospital Karachi" /></>)}
        {donor ? (
          <div className="dn-progress">
            <div className="dn-progress-row">
              <Drop fill={progress} size={30} />
              <span>Your drop is {pct}% full — {remaining} details to go.</span>
            </div>
            <div className="dn-track"><div style={{ width: `${pct}%` }} /></div>
          </div>
        ) : (
          <div className="ecg-progress-row">
            <div className="ecg-box"><EcgLine progress={progress} /></div>
            <p>Your heartbeat line is {pct}% complete — {remaining} details to go.</p>
          </div>
        )}
        <p style={{ marginTop: 14 }}>
          <button className={`btn btn-block ${donor ? "btn-donor" : "btn-teal"}`} disabled={busy}>
            {busy ? "Creating…" : donor ? "Join as a Donor" : "Create my account — find blood"}
          </button>
        </p>
      </form>
    </div>
  );

  const donorPanel = (
    <aside className="panel panel-donor2">
      <div className="dn-mascot">
        <MiniDropDeco size={26} style={{ position: "absolute", left: -38, top: 22 }} />
        <MiniDropDeco size={17} style={{ position: "absolute", left: -22, top: 74, opacity: .7 }} />
        <Drop fill={1} size={150} />
        <MiniDropDeco size={20} style={{ position: "absolute", right: -34, top: 12, opacity: .8 }} />
        <span className="dn-phone"><PhoneHeart /></span>
      </div>
      <h2>Be someone's heartbeat.</h2>
      <p className="dn-lede">Fifteen minutes of your day — one donation from you can save up to three lives, and someone in Sindh goes home because of it.</p>
      <div className="dn-pills">
        <span>✓ 18+ years</span>
        <span>✓ 50kg+</span>
        <span>✓ Feeling healthy today</span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="panel-cover dn-cover" src="/cover.jpg" alt="A young thalassemia patient smiling with the doctor holding his hand during his transfusion" />
      <div className="dn-tiles">
        <div className="dn-tile"><div className="num">{totalDonations ?? "–"}</div><span>donations given so far</span></div>
        <div className="dn-tile"><div className="num">{donorCount ?? "–"}</div><span>donors in the circle</span></div>
        <div className="dn-tile"><div className="num">{totalFree ?? "–"}</div><span>free units ready</span></div>
      </div>
    </aside>
  );

  const patientPanel = (
    <aside className="panel panel-patient2">
      <div className="pt-badge"><HeartCrossBadge /></div>
      <h2>You are not alone. We will find it together.</h2>
      <p className="pt-lede">Tell us the blood group you need, and the nearest branches in Sindh see your request right away — you can follow every step from here.</p>
      <div className="pt-steps">
        <div className="pt-step"><span className="pt-num">1</span><div><strong>Create account</strong><span>One minute, completely free.</span></div></div>
        <div className="pt-step"><span className="pt-num">2</span><div><strong>Request your blood group</strong><span>Tell us the group and the hospital.</span></div></div>
        <div className="pt-step"><span className="pt-num">3</span><div><strong>Nearest bank responds</strong><span>Follow every step from your account.</span></div></div>
      </div>
      <div className="pt-tiles">
        <div className="pt-tile"><div className="num">{pendingRequests ?? "–"}</div><span>requests waiting now</span></div>
        <div className="pt-tile"><div className="num">{totalFree ?? "–"}</div><span>free units ready</span></div>
        <div className="pt-tile"><div className="num">{branchCount ?? "–"}</div><span>branches, {cities.length || "–"} Sindh cities</span></div>
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
      <QuoteBlock />
      {celebrate && (
        <Celebration name={form.name} role={role} onDone={() => { router.push("/dashboard"); router.refresh(); }} />
      )}
    </div>
  );
}
