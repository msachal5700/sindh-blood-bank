"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Drop from "@/components/Drop";
import Celebration from "@/components/Celebration";

const ECG_D = "M0 22 H70 l8 -6 10 12 8 -24 10 32 8 -14 H160 l8 -6 10 12 8 -24 10 32 8 -14 H300";

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

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const [celebrate, setCelebrate] = useState<any>(null);
  const [pub, setPub] = useState<any>(null);

  useEffect(() => { fetch("/api/public").then((r) => r.json()).then(setPub).catch(() => {}); }, []);
  const totalFree = pub?.stats?.totalFree ?? pub?.results?.reduce((s: number, c: any) => s + c.banks.reduce((x: number, b: any) => x + b.totalFree, 0), 0);
  const branchCount = pub?.results?.reduce((s: number, c: any) => s + c.banks.length, 0);
  const pendingRequests = pub?.stats?.pendingRequests;

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) { setErr(j.error || "Sign in failed"); setShake((s) => s + 1); return; }
    let user = j.user;
    if (!user) { try { const m = await fetch("/api/auth/me"); if (m.ok) user = (await m.json()).user; } catch {} }
    setCelebrate(user || { name: "friend" });
  }

  return (
    <div className="auth-wrap">
      <div className="auth-shell">
        <aside className="panel panel-login2">
          <div className="dn-mascot">
            <MiniDropDeco size={26} style={{ position: "absolute", left: -38, top: 22 }} />
            <MiniDropDeco size={17} style={{ position: "absolute", left: -22, top: 74, opacity: .7 }} />
            <Drop fill={1} size={150} />
            <MiniDropDeco size={20} style={{ position: "absolute", right: -34, top: 12, opacity: .8 }} />
            <span className="dn-phone"><PhoneHeart /></span>
          </div>
          <h2>Welcome back to the circle.</h2>
          <p className="lg-lede">Every account here is a person — a donor ready to give, or a family holding on. Fifteen minutes of one can become years for the other.</p>
          <div className="dn-tiles">
            <div className="dn-tile glass"><div className="num">{pendingRequests ?? "–"}</div><span>requests waiting now</span></div>
            <div className="dn-tile glass"><div className="num">{totalFree ?? "–"}</div><span>free units ready</span></div>
            <div className="dn-tile glass"><div className="num">{branchCount ?? "–"}</div><span>branches, {pub?.cities?.length ?? "–"} Sindh cities</span></div>
          </div>
          <svg className="lg-ecg" viewBox="0 0 300 40" height="34" preserveAspectRatio="none" aria-hidden="true">
            <path d={ECG_D} fill="none" stroke="rgba(255,255,255,.65)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </aside>
        <div className={`auth-form ${shake ? "shake" : ""}`} key={shake}>
          <div className="auth-toggle" role="tablist" aria-label="Sign in or create account">
            <span className="at-opt sel sel-crimson" aria-current="page">Sign in</span>
            <Link href="/register" className="at-opt">Create account</Link>
          </div>
          <p className="auth-intro">Sign in to your account — donor, patient, blood bank branch, or admin.</p>
          {err && <p className="err">{err}</p>}
          <form onSubmit={submit}>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" />
            <label htmlFor="password">Password</label>
            <div className="pw-wrap">
              <input id="password" type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              <button type="button" className="pw-toggle-txt crimson" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Hide password" : "Show password"}>{showPw ? "Hide" : "Show"}</button>
            </div>
            <p style={{ marginTop: 16 }}><button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button></p>
          </form>
        </div>
      </div>

      <QuoteBlock />
      {celebrate && (
        <Celebration name={celebrate.name} role={celebrate.role} onDone={() => { router.push("/dashboard"); router.refresh(); }} />
      )}
    </div>
  );
}
