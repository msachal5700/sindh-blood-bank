"use client";
import { useEffect, useRef, useState } from "react";
import Drop from "./Drop";
import Ecg from "./Ecg";

/**
 * ~2.5s celebration shown after a successful sign-in / registration.
 * Click anywhere to skip. Respects prefers-reduced-motion (shortens).
 */
export default function Celebration({ name, role, onDone }: { name?: string; role?: string; onDone: () => void }) {
  const [fill, setFill] = useState(0);
  const done = useRef(false);
  const finish = () => { if (!done.current) { done.current = true; onDone(); } };

  useEffect(() => {
    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const raf = requestAnimationFrame(() => setFill(1));
    const t = setTimeout(finish, reduced ? 500 : 2500);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const first = (name || "friend").split(" ")[0];
  const message =
    role === "DONOR" ? `Welcome, ${first}. Someone in Sindh is waiting for a hero like you.` :
    role === "PATIENT" ? `Welcome, ${first}. You are not alone — let's find your blood, together.` :
    role === "BANK" ? `Welcome back, ${first}. Your branch saves lives every day.` :
    role === "ADMIN" ? `Welcome back, ${first}. All of Sindh is in view.` :
    `Welcome, ${first}. You are part of the circle now.`;

  return (
    <div className="celebrate" onClick={finish} role="dialog" aria-label="Welcome">
      <div className="celebrate-card">
        <Drop fill={fill} size={110} />
        <div style={{ margin: "2px 0 0" }}>
          <span className="heart-beat" style={{ fontSize: "1.5rem" }}>❤️</span>
        </div>
        <Ecg className="ecg-live" height={36} />
        <h2 style={{ margin: "6px 0 4px", color: "var(--crimson-dark)" }}>{message}</h2>
        <p className="muted" style={{ margin: 0 }}>Tap anywhere to continue…</p>
      </div>
    </div>
  );
}
