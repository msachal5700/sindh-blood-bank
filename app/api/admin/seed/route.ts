import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// One-time bootstrap endpoint — used on 2026-11-09 to create tables and seed
// the production database, then permanently disabled.
export async function POST() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
