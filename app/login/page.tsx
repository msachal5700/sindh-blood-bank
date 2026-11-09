"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Drop, { MiniDrop } from "@/components/Drop";
import Celebration from "@/components/Celebration";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const [celebrate, setCelebrate] = useState<any>(null);
  const [pub, setPub] = useState<any>(null);

  useEffect(() => { fetch("/api/public").then((r) => r.json()).then(setPub).catch(() => {}); }, []);
  const totalFree = pub?.results?.reduce((s: number, c: any) => s + c.banks.reduce((x: number, b: any) => x + b.totalFree, 0), 0);
  const branchCount = pub?.results?.reduce((s: number, c: any) => s + c.banks.length, 0);
  const progress = (email.trim() ? 0.5 : 0) + (password ? 0.5 : 0);

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
        <aside className="panel panel-crimson">
          <Drop fill={0.8} size={86} />
          <h2>Welcome back to the circle.</h2>
          <p style={{ opacity: .93 }}>Every sign-in is a heartbeat returning. Your requests, donations and appointments are waiting for you.</p>
          <div className="mini-stats">
            <span>🩸 {totalFree ?? "–"} free units ready</span>
            <span>🏥 {branchCount ?? "–"} branches</span>
            <span>📍 {pub?.cities?.length ?? "–"} cities</span>
          </div>
        </aside>
        <div className={`auth-form ${shake ? "shake" : ""}`} key={shake}>
          <h1 style={{ marginTop: 0 }}>Sign in</h1>
          <p className="muted">Sign in to your Sindh Blood Bank account.</p>
          {err && <p className="err">{err}</p>}
          <form onSubmit={submit}>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <label htmlFor="password">Password</label>
            <div className="pw-wrap">
              <input id="password" type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Hide password" : "Show password"}>{showPw ? "Hide" : "Show"}</button>
            </div>
            <div className="progress-row">
              <MiniDrop fill={progress} size={40} />
              <span>{progress === 1 ? "Ready — the drop is full. Welcome back." : progress > 0 ? "Halfway there — the drop is filling." : "Fill in your details and watch the drop fill."}</span>
            </div>
            <p style={{ marginTop: 8 }}><button className="btn btn-primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button></p>
          </form>
          <p className="muted">New here? <Link href="/register">Create a free account</Link></p>
        </div>
      </div>
      {celebrate && (
        <Celebration name={celebrate.name} role={celebrate.role} onDone={() => { router.push("/dashboard"); router.refresh(); }} />
      )}
    </div>
  );
}
