import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPassword, publicUser, setSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() }, include: { city: true, bank: { include: { city: true } } } });
  if (!user || !(await checkPassword(password, user.passwordHash)))
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  await setSession(user.id);
  return NextResponse.json({ user: publicUser(user) });
}
