"use client";

/** Animated ECG / heartbeat line. Add the `ecg-live` class (e.g. when in view) to draw it. */
export default function Ecg({ color = "#c21847", height = 54, className = "" }: { color?: string; height?: number; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 600 60" width="100%" height={height} preserveAspectRatio="none" aria-hidden="true">
      <path
        className="ecg-path"
        d="M0 32 H120 l10 -8 12 16 10 -34 12 44 10 -18 H300 l10 -8 12 16 10 -34 12 44 10 -18 H480 l10 -8 12 16 10 -30 10 38 8 -12 H600"
        fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"
      />
    </svg>
  );
}

/** Heartbeat-line progress bar for the patient register form. */
export function EcgProgress({ progress = 0 }: { progress?: number }) {
  const p = Math.max(0, Math.min(1, progress));
  return (
    <div style={{ position: "relative", height: 40, flex: 1 }} aria-hidden="true">
      <svg viewBox="0 0 300 40" width="100%" height="40" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
        <path d="M0 22 H70 l8 -6 10 12 8 -24 10 32 8 -14 H160 l8 -6 10 12 8 -24 10 32 8 -14 H300"
          fill="none" stroke="#d8e8e2" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, width: `${p * 100}%`, overflow: "hidden", transition: "width .5s ease" }}>
        <svg viewBox="0 0 300 40" width="300" height="40" preserveAspectRatio="none" style={{ position: "absolute", left: 0, top: 0 }}>
          <path d="M0 22 H70 l8 -6 10 12 8 -24 10 32 8 -14 H160 l8 -6 10 12 8 -24 10 32 8 -14 H300"
            fill="none" stroke="#0f766e" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
