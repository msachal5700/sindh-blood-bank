import { NextResponse } from "next/server";
import { currentUser, publicUser } from "@/lib/auth";
export async function GET() {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  return NextResponse.json({ user: publicUser(u) });
}
