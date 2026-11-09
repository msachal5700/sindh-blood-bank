import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sindh Blood Bank — Give Blood, Give Time Back",
  description: "Find free, paid and exchange blood across Sindh. Donate at a branch near you.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/" className="brand"><span className="brand-drop">🩸</span> Sindh Blood Bank</Link>
          <nav>
            <Link href="/">Find Blood</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/login">Sign in</Link>
            <Link href="/register" className="btn btn-primary btn-sm">Join free</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p>🩸 Sindh Blood Bank — Karachi · Hyderabad · Sukkur · Ghotki · Larkana · Mirpurkhas · Nawabshah · Khairpur</p>
          <p className="muted">Give blood. Give time back. One donation can save up to three lives.</p>
        </footer>
      </body>
    </html>
  );
}
