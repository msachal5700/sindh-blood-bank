import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDatabase } from "@/lib/seedData";

export const dynamic = "force-dynamic";

// One-time bootstrap: creates tables (DDL mirrors prisma/schema.prisma) and
// seeds demo data. Guarded by the SESSION_SECRET value sent as `x-seed-key`;
// account passwords arrive in the request body and are never stored in code.
const DDL = `
CREATE TABLE IF NOT EXISTS "City" ("id" SERIAL PRIMARY KEY, "name" TEXT NOT NULL, "lat" DOUBLE PRECISION NOT NULL, "lng" DOUBLE PRECISION NOT NULL);
CREATE TABLE IF NOT EXISTS "BloodBank" ("id" SERIAL PRIMARY KEY, "name" TEXT NOT NULL, "address" TEXT NOT NULL, "phone" TEXT NOT NULL, "hours" TEXT NOT NULL, "cityId" INTEGER NOT NULL REFERENCES "City"("id"));
CREATE TABLE IF NOT EXISTS "User" ("id" SERIAL PRIMARY KEY, "name" TEXT NOT NULL, "email" TEXT NOT NULL UNIQUE, "passwordHash" TEXT NOT NULL, "role" TEXT NOT NULL, "phone" TEXT, "bloodGroup" TEXT, "hospital" TEXT, "bankId" INTEGER REFERENCES "BloodBank"("id"), "cityId" INTEGER REFERENCES "City"("id"), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS "Inventory" ("id" SERIAL PRIMARY KEY, "bankId" INTEGER NOT NULL REFERENCES "BloodBank"("id"), "bloodGroup" TEXT NOT NULL, "freeUnits" INTEGER NOT NULL DEFAULT 0, "paidUnits" INTEGER NOT NULL DEFAULT 0, "paidPrice" INTEGER NOT NULL DEFAULT 0, "exchangeUnits" INTEGER NOT NULL DEFAULT 0, UNIQUE("bankId", "bloodGroup"));
CREATE TABLE IF NOT EXISTS "BloodRequest" ("id" SERIAL PRIMARY KEY, "patientId" INTEGER NOT NULL REFERENCES "User"("id"), "bankId" INTEGER NOT NULL REFERENCES "BloodBank"("id"), "bloodGroup" TEXT NOT NULL, "mode" TEXT NOT NULL DEFAULT 'FREE', "units" INTEGER NOT NULL DEFAULT 1, "urgency" TEXT NOT NULL DEFAULT 'Normal', "hospital" TEXT NOT NULL DEFAULT '', "status" TEXT NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS "Donation" ("id" SERIAL PRIMARY KEY, "donorId" INTEGER NOT NULL REFERENCES "User"("id"), "bankId" INTEGER NOT NULL REFERENCES "BloodBank"("id"), "bloodGroup" TEXT NOT NULL, "units" INTEGER NOT NULL DEFAULT 1, "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS "Appointment" ("id" SERIAL PRIMARY KEY, "donorId" INTEGER NOT NULL REFERENCES "User"("id"), "bankId" INTEGER NOT NULL REFERENCES "BloodBank"("id"), "date" TIMESTAMP(3) NOT NULL, "status" TEXT NOT NULL DEFAULT 'BOOKED', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
`;

export async function POST(req: Request) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || req.headers.get("x-seed-key") !== secret)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const passwords = body?.passwords as Record<string, string> | undefined;
  if (!passwords) return NextResponse.json({ error: "passwords required" }, { status: 400 });
  for (const stmt of DDL.split(";").map((s) => s.trim()).filter(Boolean))
    await prisma.$executeRawUnsafe(stmt);
  const counts = await seedDatabase(passwords);
  return NextResponse.json({ ok: true, counts });
}
