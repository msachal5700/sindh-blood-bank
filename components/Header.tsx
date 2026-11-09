"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const TINT: Record<string, string> = {
  DONOR: "tint-donor",
  PATIENT: "tint-patient",
  BANK: "tint-bank",
  ADMIN: "tint-admin",
};

function WhiteDrop() {
  return (
    <svg width="22" height="22" viewBox="0 0 100 100" aria-hidden="true">
      <path d="M50 5 C50 5 17 45 17 64 a33 31 0 0 0 66 0 C83 45 50 5 50 5 Z" fill="#ffffff" />
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)).then((j) => setMe(j?.user || null)).catch(() => {});
  }, [pathname]);

  const onDashboard = pathname?.startsWith("/dashboard");
  const tint = onDashboard && me?.role ? TINT[me.role] || "" : "";
  const onHome = pathname === "/";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setMe(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className={`site-header ${tint}`}>
      <div className="hdr-left">
        <Link href="/" className="hdr-drop" aria-label="Sindh Blood Bank — home">
          <WhiteDrop />
        </Link>
        <Link href="/" className="hdr-pill">
          Find Blood
          {onHome && <span className="hdr-bar" />}
        </Link>
      </div>
      <nav>
        {me ? (
          <>
            <Link href="/dashboard" className="hdr-pill">Dashboard</Link>
            <button className="hdr-signout" onClick={logout}>Sign out</button>
          </>
        ) : (
          <>
            <Link href="/login" className="hdr-signin">Sign in</Link>
            <Link href="/register" className="hdr-pill">Join free</Link>
          </>
        )}
      </nav>
    </header>
  );
}
