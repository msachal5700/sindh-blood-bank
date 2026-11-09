"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Drop from "./Drop";

const TINT: Record<string, string> = {
  DONOR: "tint-donor",
  PATIENT: "tint-patient",
  BANK: "tint-bank",
  ADMIN: "tint-admin",
};

export default function Header() {
  const pathname = usePathname();
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)).then((j) => setMe(j?.user || null)).catch(() => {});
  }, [pathname]);

  const onDashboard = pathname?.startsWith("/dashboard");
  const tint = onDashboard && me?.role ? TINT[me.role] || "" : "";

  return (
    <header className={`site-header ${tint}`}>
      <Link href="/" className="brand">
        <span className="brand-drop"><Drop fill={0.85} size={30} /></span>
        Sindh Blood Bank
      </Link>
      <nav>
        <Link href="/" className="navlink">Find Blood</Link>
        <Link href="/dashboard" className="navlink">Dashboard</Link>
        {me ? (
          <span className="tag" style={{ textTransform: "none", fontSize: ".82rem" }}>{me.name?.split(" ")[0]} · {me.role}</span>
        ) : (
          <>
            <Link href="/login" className="btn btn-sm" style={{ height: 40, display: "inline-flex", alignItems: "center" }}>Sign in</Link>
            <Link href="/register" className="btn btn-primary join-btn">Join Free</Link>
          </>
        )}
      </nav>
    </header>
  );
}
