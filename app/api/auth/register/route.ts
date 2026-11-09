import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, publicUser, setSession } from "@/lib/auth";
import { BLOOD_GROUPS } from "@/lib/data";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const { name, phone, email, password, role, bloodGroup, cityId, hospital } = b;
  if (!name || !email || !password) return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
  if (!["DONOR", "PATIENT"].includes(role)) return NextResponse.json({ error: "Role must be DONOR or PATIENT" }, { status: 400 });
  if (bloodGroup && !BLOOD_GROUPS.includes(bloodGroup)) return NextResponse.json({ error: "Invalid blood group" }, { status: 400 });
  if (String(password).length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  const cleanEmail = String(email).toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existing) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  const user = await prisma.user.create({
    data: {
      name: String(name), phone: phone ? String(phone) : "", email: cleanEmail,
      passwordHash: await hashPassword(String(password)), role,
      bloodGroup: bloodGroup || null, hospital: role === "PATIENT" ? (hospital || null) : null,
      cityId: cityId ? Number(cityId) : null,
    },
    include: { city: true, bank: { include: { city: true } } },
  });
  await setSession(user.id);
  return NextResponse.json({ user: publicUser(user) }, { status: 201 });
}
