import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
export const COOKIE = "sbb_session";

function sign(payload: string) {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function makeToken(userId: number) {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readToken(token: string | undefined): number | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch { return null; }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (Date.now() > data.exp) return null;
    return data.uid as number;
  } catch { return null; }
}

export async function setSession(userId: number) {
  const store = await cookies();
  store.set(COOKIE, makeToken(userId), {
    httpOnly: true, sameSite: "lax", path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function currentUser() {
  const store = await cookies();
  const uid = readToken(store.get(COOKIE)?.value);
  if (!uid) return null;
  return prisma.user.findUnique({
    where: { id: uid },
    include: { city: true, bank: { include: { city: true } } },
  });
}

export async function hashPassword(pw: string) { return bcrypt.hash(pw, 10); }
export async function checkPassword(pw: string, hash: string) { return bcrypt.compare(pw, hash); }

export function publicUser(u: any) {
  if (!u) return null;
  return {
    id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role,
    bloodGroup: u.bloodGroup, hospital: u.hospital,
    city: u.city ? u.city.name : null, cityId: u.cityId,
    bank: u.bank ? { id: u.bank.id, name: u.bank.name, city: u.bank.city?.name } : null,
    bankId: u.bankId,
  };
}
