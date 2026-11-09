import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Sindh Blood Bank — Give Blood, Give Time Back",
  description: "Find free, paid and exchange blood across Sindh. Donate at a branch near you.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <footer className="site-footer">
          <p>🩸 Sindh Blood Bank — Karachi · Hyderabad · Sukkur · Ghotki · Larkana · Mirpurkhas · Nawabshah · Khairpur</p>
          <p className="muted">Give blood. Give time back. One donation can save up to three lives.</p>
        </footer>
      </body>
    </html>
  );
}
