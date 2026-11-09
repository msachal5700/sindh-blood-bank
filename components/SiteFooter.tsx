"use client";
import { usePathname } from "next/navigation";

// Site-wide footer strip — hidden on the homepage and auth pages, whose
// own closing quote block ends the page (matching the original design).
export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/register" || pathname === "/login") return null;
  return (
    <footer className="site-footer">
      <p>🩸 Sindh Blood Bank — Karachi · Hyderabad · Sukkur · Ghotki · Larkana · Mirpurkhas · Nawabshah · Khairpur</p>
      <p className="muted">Give blood. Give time back. One donation can save up to three lives.</p>
    </footer>
  );
}
