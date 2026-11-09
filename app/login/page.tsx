"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) return setErr(j.error || "Sign in failed");
    router.push("/dashboard"); router.refresh();
  }
  return (
    <div className="auth-wrap">
      <div className="card">
        <h1 style={{ marginTop: 4 }}>Welcome back to the circle.</h1>
        <p className="muted">Sign in to your Sindh Blood Bank account.</p>
        {err && <p className="err">{err}</p>}
        <form onSubmit={submit}>
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <label>Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          <p style={{ marginTop: 18 }}><button className="btn btn-primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button></p>
        </form>
        <p className="muted">New here? <Link href="/register">Create a free account</Link></p>
      </div>
    </div>
  );
}
