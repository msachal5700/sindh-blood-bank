"use client";
import { useId } from "react";

/**
 * Glossy 3D blood-drop mascot.
 * fill: 0 (pale, sad, tear) → 1 (full red, smiling).
 */
export default function Drop({ fill = 0, size = 120 }: { fill?: number; size?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const clipId = `dropclip-${uid}`;
  const f = Math.max(0, Math.min(1, fill));
  const happy = f > 0.55;
  const tear = f < 0.35;
  // Drop interior: y from 18 (tip area inside) to 92 (bottom). Fill rises from bottom.
  const fillTop = 92 - f * 74;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={happy ? "A full, happy blood drop" : "An empty blood drop waiting to be filled"}>
      <defs>
        <clipPath id={clipId}>
          <path d="M50 4 C50 4 16 44 16 64 a34 32 0 0 0 68 0 C84 44 50 4 50 4 Z" />
        </clipPath>
        <linearGradient id={`red-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e3325f" />
          <stop offset="55%" stopColor="#c21847" />
          <stop offset="100%" stopColor="#8f1030" />
        </linearGradient>
      </defs>
      {/* soft shadow */}
      <ellipse cx="50" cy="95" rx="24" ry="3.6" fill="rgba(90,10,30,.18)" />
      {/* pale body */}
      <path d="M50 4 C50 4 16 44 16 64 a34 32 0 0 0 68 0 C84 44 50 4 50 4 Z" fill="#f6d9de" stroke="#d9a7b1" strokeWidth="1.6" />
      {/* red fill, clipped to the drop */}
      <g clipPath={`url(#${clipId})`}>
        <rect x="10" y={fillTop} width="80" height="90" fill={`url(#red-${uid})`} style={{ transition: "y .8s ease" }} />
        <ellipse cx="50" cy={fillTop} rx="36" ry="4.5" fill="#ef6d8c" opacity="0.75" style={{ transition: "cy .8s ease" }} />
      </g>
      {/* outline + gloss */}
      <path d="M50 4 C50 4 16 44 16 64 a34 32 0 0 0 68 0 C84 44 50 4 50 4 Z" fill="none" stroke="#8f1030" strokeWidth="1.6" opacity="0.55" />
      <ellipse cx="36" cy="52" rx="6" ry="11" fill="#ffffff" opacity="0.5" transform="rotate(-18 36 52)" />
      {/* face */}
      <circle cx="41" cy="64" r="2.6" fill="#5d0a21" />
      <circle cx="59" cy="64" r="2.6" fill="#5d0a21" />
      {happy ? (
        <path d="M41 74 Q50 82 59 74" fill="none" stroke="#5d0a21" strokeWidth="2.6" strokeLinecap="round" />
      ) : (
        <path d="M41 79 Q50 72 59 79" fill="none" stroke="#5d0a21" strokeWidth="2.6" strokeLinecap="round" />
      )}
      {/* cheeks when happy */}
      {happy && (<>
        <circle cx="33" cy="71" r="3.4" fill="#f28ba4" opacity="0.8" />
        <circle cx="67" cy="71" r="3.4" fill="#f28ba4" opacity="0.8" />
      </>)}
      {/* tear when empty */}
      {tear && (
        <path d="M33 76 C33 76 28.5 83 28.5 86.5 a4.5 4.5 0 0 0 9 0 C37.5 83 33 76 33 76 Z" fill="#7cc4e8" stroke="#4a9ec4" strokeWidth="0.8" />
      )}
    </svg>
  );
}

/** Tiny progress drop used inside auth forms — fills as fields complete. */
export function MiniDrop({ fill = 0, size = 44 }: { fill?: number; size?: number }) {
  return <Drop fill={fill} size={size} />;
}
